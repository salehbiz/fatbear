import { frameWindow } from './math.mjs';
import { media } from './media';

// Frame loader modelled on the Vaultfy hero (vaultfy.ai, src/components/FrameScrub.jsx). One pool of fetch
// slots, filled in this order:
//   1. the frame on screen at full quality, plus the few ahead of it, so the opening is sharp at once
//   2. previews around the playhead
//   3. preview stride passes 8 and 4, which make the whole film scrubbable
//   4. full quality around the playhead
//   5. the remaining previews
//   6. once the page has loaded, the rest of the film at full quality in stride order
// Until a full-quality frame is ready the poster stays up, and a sharp frame up to HOLD frames away is held
// over a nearer preview. The high tier steps down to its fallback once if its frames fail or are too slow.

type Frame = ImageBitmap | HTMLImageElement;
function dispose(frame: Frame) { if ('close' in frame) frame.close(); }

const CACHE_NAME = 'fatbear-frame-cache-v3';
// Previews stay compressed for the whole film; only those this close to the playhead are held decoded.
const PREVIEW_RADIUS = 48;
// A full-quality frame slower than this means the tier is too heavy for the connection.
const SLOW_FRAME_MS = 4000;
// A sharp frame this close to the playhead is shown instead of a preview; the poster counts as sharp frame 0.
const HOLD = 8;

const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
const SLOTS = 6;
const PREVIEW_AROUND = 15;
const REAL_AROUND = coarse ? 6 : 12;
// Bulk full-quality streaming waits for the page's own load so it never competes with CSS, JS or the poster.
let bulkAllowed = typeof document === 'undefined' || document.readyState === 'complete';
const bulkWaiters = new Set<() => void>();
if (!bulkAllowed) {
  addEventListener('load', () => {
    const go = () => { bulkAllowed = true; bulkWaiters.forEach(wake => wake()); };
    if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 1000 }); else setTimeout(go, 200);
  }, { once: true });
}

async function fetchWithCacheStorage(url: string, signal?: AbortSignal): Promise<Blob> {
  if (typeof caches !== 'undefined') {
    try {
      const cache = await caches.open(CACHE_NAME);
      const matched = await cache.match(url);
      if (matched) return await matched.blob();
      const response = await fetch(url, { signal });
      if (!response.ok) throw new Error(`Frame HTTP error: ${response.status}`);
      try {
        await cache.put(url, response.clone());
      } catch {}
      return await response.blob();
    } catch (err: any) {
      if (err?.name === 'AbortError') throw err;
    }
  }
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Frame HTTP error: ${response.status}`);
  return await response.blob();
}

async function decodeImage(blob: Blob): Promise<Frame> {
  if (typeof createImageBitmap === 'function') return createImageBitmap(blob);
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export class FrameCache {
  private frames = new Map<number, Frame>();
  private previewFrames = new Map<number, Frame>();
  private compressedBlobs = new Map<number, Blob>();
  private previewBlobs = new Map<number, Blob>();

  private pending = new Map<number, AbortController>();
  private previewPending = new Map<number, AbortController>();
  private decoding = new Set<number>();
  private previewDecoding = new Set<number>();

  private failed = new Set<number>();
  private previewFailed = new Set<number>();
  private wanted: number[] = [];
  private wantedSet = new Set<number>();
  private destroyed = false;
  private target = 0;
  private direction = 1;
  private active = false;
  private previewOrder: number[] = [];
  private previewHead = 0;
  private bulkOrder: number[] = [];
  private fallenBack = false;
  private wake = () => this.pump();

  constructor(
    private last: number,
    private limit: number,
    private update: () => void,
    private framePath: (index: number) => string = n => `frames/${String(n + 1).padStart(4, '0')}.webp`,
    private previewPath?: (index: number) => string,
    private fallbackPath?: (index: number) => string
  ) {
    const strideOrder = (step: number) => {
      const order: number[] = [], seen = new Set<number>();
      for (const stride of [8, 4, 2, 1]) {
        for (let i = 0; i <= last; i += stride * step) if (!seen.has(i)) { seen.add(i); order.push(i); }
      }
      return order;
    };
    this.previewOrder = strideOrder(1);
    this.previewHead = this.previewOrder.filter(n => n % 4 === 0).length;
    // Phones stream every other frame in bulk; the playhead window fills the gaps where the viewer is.
    this.bulkOrder = strideOrder(coarse ? 2 : 1);
    bulkWaiters.add(this.wake);
  }

  request(target: number) {
    if (this.destroyed) return;
    if (target !== this.target) this.direction = target > this.target ? 1 : -1;
    this.target = target;
    this.active = true;

    // Decode window: bitmaps held around the playhead, weighted toward the scroll direction.
    this.wanted = frameWindow(target, this.last, this.limit, this.direction);
    this.wantedSet = new Set(this.wanted);

    this.evict();
    this.pump();
  }

  private evict() {
    for (const [n, frame] of this.frames) {
      if (!this.wantedSet.has(n)) {
        dispose(frame);
        this.frames.delete(n);
      }
    }
    for (const [n, frame] of this.previewFrames) {
      if (Math.abs(n - this.target) > PREVIEW_RADIUS) {
        dispose(frame);
        this.previewFrames.delete(n);
      }
    }
    // Compressed frames are all kept (as Vaultfy does) so any position re-decodes without a fetch.
  }

  private needsReal(n: number) {
    return !this.frames.has(n) && !this.compressedBlobs.has(n) && !this.pending.has(n) && !this.failed.has(n);
  }

  private pump() {
    if (this.destroyed || !this.active) return;

    // Decode whatever is already downloaded near the playhead.
    for (const n of this.wanted) {
      const blob = this.compressedBlobs.get(n);
      if (blob && !this.frames.has(n) && !this.decoding.has(n)) void this.decodeBlob(n, blob);
    }
    for (let d = 0; d <= PREVIEW_RADIUS && this.previewDecoding.size < 4; d++) {
      for (const p of d ? [this.target + d, this.target - d] : [this.target]) {
        if (this.previewBlobs.has(p) && !this.previewFrames.has(p) && !this.previewDecoding.has(p)) void this.decodePreview(p);
      }
    }

    const busy = () => this.pending.size + this.previewPending.size >= SLOTS;
    const around = (radius: number, missing: (n: number) => boolean) => {
      for (let d = 0; d <= radius; d++) {
        for (const n of d ? [this.target + d * this.direction, this.target - d * this.direction] : [this.target]) {
          if (n >= 0 && n <= this.last && missing(n)) return n;
        }
      }
    };
    const needsPreview = (n: number) => !!this.previewPath && !this.previewBlobs.has(n) && !this.previewPending.has(n) && !this.previewFailed.has(n);
    const nextPreview = (count: number) => this.previewOrder.slice(0, count).find(needsPreview);
    const next = (): [number, boolean] | undefined => {
      let n: number | undefined;
      // 1. The frame on screen and the next few ahead, at full quality.
      if (this.pending.size < 3) {
        for (let d = 0; d <= HOLD && n === undefined; d++) {
          const f = this.target + d * this.direction;
          if (f >= 0 && f <= this.last && this.needsReal(f)) n = f;
        }
        if (n !== undefined) return [n, false];
      }
      if ((n = around(PREVIEW_AROUND, needsPreview)) !== undefined) return [n, true];
      if ((n = nextPreview(this.previewHead)) !== undefined) return [n, true];
      if ((n = around(REAL_AROUND, f => this.needsReal(f))) !== undefined) return [n, false];
      if ((n = nextPreview(this.previewOrder.length)) !== undefined) return [n, true];
      if (!bulkAllowed) return;
      if ((n = this.bulkOrder.find(f => this.needsReal(f))) !== undefined) return [n, false];
    };
    for (let item = next(); item && !busy(); item = next()) {
      if (item[1]) this.loadPreview(item[0]); else this.loadReal(item[0]);
    }
  }

  private realPath(n: number) {
    return this.fallenBack && this.fallbackPath ? this.fallbackPath(n) : this.framePath(n);
  }

  private stepDown() {
    if (this.fallenBack || !this.fallbackPath) return false;
    this.fallenBack = true;
    this.failed.clear();
    return true;
  }

  private async loadReal(n: number) {
    const controller = new AbortController();
    this.pending.set(n, controller);
    const started = performance.now();
    const fallenBack = this.fallenBack;
    try {
      const blob = await fetchWithCacheStorage(media(this.realPath(n)), controller.signal);
      // A cold network fetch this slow means the tier is too heavy here; cached hits are near-instant.
      if (!fallenBack && performance.now() - started > SLOW_FRAME_MS) this.stepDown();
      this.compressedBlobs.set(n, blob);
      if (this.wantedSet.has(n) && this.active && !this.destroyed) void this.decodeBlob(n, blob);
    } catch {
      if (!controller.signal.aborted && !this.destroyed) {
        // A failure on the full tier steps down once and retries; a failure on the fallback is final.
        const retry = fallenBack === this.fallenBack && this.stepDown();
        if (!retry) this.failed.add(n);
      }
    } finally {
      if (this.pending.get(n) === controller) this.pending.delete(n);
      this.pump();
    }
  }

  private async decodeBlob(n: number, blob: Blob) {
    if (this.decoding.has(n) || this.frames.has(n) || !this.active || this.destroyed || !this.wantedSet.has(n)) return;
    this.decoding.add(n);
    try {
      const frame = await decodeImage(blob);
      if (this.destroyed || !this.active || !this.wantedSet.has(n)) {
        dispose(frame);
        return;
      }
      const old = this.frames.get(n);
      if (old) dispose(old);
      this.frames.set(n, frame);
      this.update();
    } catch {
      // Decode error: the preview keeps covering this frame.
    } finally {
      this.decoding.delete(n);
    }
  }

  private async loadPreview(n: number) {
    if (!this.previewPath) return;
    const controller = new AbortController();
    this.previewPending.set(n, controller);
    try {
      const blob = await fetchWithCacheStorage(media(this.previewPath(n)), controller.signal);
      if (this.destroyed || controller.signal.aborted) return;
      this.previewBlobs.set(n, blob);
      if (this.active) await this.decodePreview(n);
    } catch {
      if (!controller.signal.aborted) this.previewFailed.add(n);
    } finally {
      if (this.previewPending.get(n) === controller) this.previewPending.delete(n);
      this.pump();
    }
  }

  private async decodePreview(n: number) {
    const blob = this.previewBlobs.get(n);
    if (!blob || this.previewDecoding.has(n) || this.previewFrames.has(n) || Math.abs(n - this.target) > PREVIEW_RADIUS) return;
    this.previewDecoding.add(n);
    try {
      const frame = await decodeImage(blob);
      if (this.destroyed || !this.active || Math.abs(n - this.target) > PREVIEW_RADIUS) {
        dispose(frame);
        return;
      }
      this.previewFrames.set(n, frame);
      if (!this.frames.has(this.target)) this.update();
    } catch {
      this.previewFailed.add(n);
    } finally {
      this.previewDecoding.delete(n);
    }
  }

  // Sharp first: the exact full-quality frame, else one held within HOLD frames. Past that, distance first,
  // so a fast scrub keeps moving on previews.
  nearest(): { index: number; image: Frame } | undefined {
    const exact = this.frames.get(this.target);
    if (exact) return { index: this.target, image: exact };
    const sharp = this.closest(this.frames);
    if (sharp && Math.abs(sharp.index - this.target) <= HOLD) return sharp;
    // Before any sharp frame exists the poster is on screen; keep it rather than open on a preview.
    if (!sharp && this.target <= HOLD && !this.failed.has(this.target)) return undefined;
    const preview = this.previewFrames.get(this.target);
    if (preview) return { index: this.target, image: preview };
    const blurry = this.closest(this.previewFrames);
    if (!sharp) return blurry;
    if (!blurry) return sharp;
    return Math.abs(blurry.index - this.target) < Math.abs(sharp.index - this.target) ? blurry : sharp;
  }

  private closest(source: Map<number, Frame>) {
    let best = Infinity, result: { index: number; image: Frame } | undefined;
    for (const [n, image] of source) {
      // The last frame is black; never show it early as a stand-in.
      if (n === this.last && this.target < this.last) continue;
      const d = Math.abs(n - this.target);
      if (d < best) { best = d; result = { index: n, image }; }
    }
    return result;
  }

  pause() {
    this.active = false;
    for (const controller of this.pending.values()) controller.abort();
    for (const controller of this.previewPending.values()) controller.abort();
    this.pending.clear();
    this.previewPending.clear();
  }

  release() {
    this.pause();
    for (const frame of this.frames.values()) dispose(frame);
    this.frames.clear();
    for (const frame of this.previewFrames.values()) dispose(frame);
    this.previewFrames.clear();
    this.compressedBlobs.clear();
    this.wanted = [];
    this.wantedSet.clear();
  }

  setLimit(limit: number) {
    this.limit = limit;
  }

  stats() {
    return {
      decoded: this.frames.size,
      previewDecoded: this.previewFrames.size,
      previews: this.previewBlobs.size,
      blobs: this.compressedBlobs.size,
      pending: this.pending.size,
      failed: this.failed.size,
      fallenBack: this.fallenBack,
      target: this.target,
      limit: this.limit
    };
  }

  destroy() {
    this.destroyed = true;
    bulkWaiters.delete(this.wake);
    this.pause();
    for (const frame of this.frames.values()) dispose(frame);
    this.frames.clear();
    for (const frame of this.previewFrames.values()) dispose(frame);
    this.previewFrames.clear();
    this.previewBlobs.clear();
    this.compressedBlobs.clear();
  }
}
