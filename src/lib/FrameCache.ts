import { frameWindow } from './math.mjs';
import { media } from './media';

// Resilient two-phase frame loader (resilient-hero-scrub):
//   Phase A — small preview frames for the whole film in stride-pyramid order (8 → 4 → 2 → 1), so the film
//             scrubs end to end after a few hundred KB.
//   Phase B — full-quality frames only in a window around the playhead, nearest first, biased toward the
//             scroll direction. The film is never streamed in full quality in the background.
// One addition: the exact playhead frame always gets a full-quality slot, even during Phase A, so whatever
// the viewer is resting on sharpens first. The opening never shows a preview: until a full-quality frame
// is ready the poster stays up, and a sharp frame up to HOLD frames away is held over a nearer preview.
// A full-quality tier that errors or is too slow for the connection steps down to the fallback tier once.

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
const PREVIEW_SLOTS = coarse ? 6 : 8;
const REAL_SLOTS = coarse ? 4 : 6;
const REAL_WINDOW = coarse ? 25 : 40;

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
  private fallenBack = false;

  constructor(
    private last: number,
    private limit: number,
    private update: () => void,
    private framePath: (index: number) => string = n => `frames/${String(n + 1).padStart(4, '0')}.webp`,
    private previewPath?: (index: number) => string,
    private fallbackPath?: (index: number) => string
  ) {
    const seen = new Set<number>();
    for (const stride of [8, 4, 2, 1]) {
      for (let i = 0; i <= last; i += stride) {
        if (!seen.has(i)) { seen.add(i); this.previewOrder.push(i); }
      }
    }
    if (!seen.has(last)) this.previewOrder.push(last);
  }

  private get previewsDone() {
    return !this.previewPath || this.previewBlobs.size + this.previewFailed.size >= this.previewOrder.length;
  }

  request(target: number) {
    if (this.destroyed) return;
    if (target !== this.target) this.direction = target > this.target ? 1 : -1;
    this.target = target;
    this.active = true;

    // Decode window: bitmaps held around the playhead, weighted toward the scroll direction.
    this.wanted = frameWindow(target, this.last, this.limit, this.direction);
    this.wantedSet = new Set(this.wanted);

    // Free full-quality slots held by frames the playhead has left behind.
    for (const [n, controller] of this.pending) {
      if (n !== target && Math.abs(n - target) > REAL_WINDOW) {
        controller.abort();
        this.pending.delete(n);
      }
    }

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
    // Compressed full-quality frames are kept for instant re-decode, bounded around the playhead.
    const blobLimit = Math.max(this.limit * 4, REAL_WINDOW * 2 + 1);
    if (this.compressedBlobs.size > blobLimit) {
      const far = [...this.compressedBlobs.keys()].sort((a, b) => Math.abs(a - this.target) - Math.abs(b - this.target));
      while (this.compressedBlobs.size > blobLimit && far.length) this.compressedBlobs.delete(far.pop()!);
    }
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

    // The frame on screen always gets full quality first, and the next few ahead of it stay sharp while previews load.
    if (this.needsReal(this.target)) this.loadReal(this.target);
    for (let d = 1; d <= HOLD && this.pending.size < 3; d++) {
      const n = this.target + d * this.direction;
      if (n >= 0 && n <= this.last && this.needsReal(n)) this.loadReal(n);
    }

    // Phase A: preview pyramid.
    if (this.previewPath) {
      for (const p of this.previewOrder) {
        if (this.previewPending.size >= PREVIEW_SLOTS) break;
        if (!this.previewBlobs.has(p) && !this.previewPending.has(p) && !this.previewFailed.has(p)) this.loadPreview(p);
      }
    }

    // Phase B: full quality around the playhead once the whole film is scrubbable.
    if (!this.previewsDone) return;
    const lo = Math.max(0, this.target - REAL_WINDOW), hi = Math.min(this.last, this.target + REAL_WINDOW);
    const candidates: number[] = [];
    for (let n = lo; n <= hi; n++) if (this.needsReal(n)) candidates.push(n);
    const cost = (n: number) => Math.abs(n - this.target) * (Math.sign(n - this.target) === this.direction ? .7 : 1);
    candidates.sort((a, b) => cost(a) - cost(b));
    for (const n of candidates) {
      if (this.pending.size >= REAL_SLOTS) break;
      this.loadReal(n);
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
    this.pause();
    for (const frame of this.frames.values()) dispose(frame);
    this.frames.clear();
    for (const frame of this.previewFrames.values()) dispose(frame);
    this.previewFrames.clear();
    this.previewBlobs.clear();
    this.compressedBlobs.clear();
  }
}
