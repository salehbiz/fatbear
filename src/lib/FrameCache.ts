import { frameWindow } from './math.mjs';
import { media } from './media';

type Frame = ImageBitmap | HTMLImageElement;
function dispose(frame: Frame) { if ('close' in frame) frame.close(); }

const CACHE_NAME = 'fatbear-frame-cache-v3';

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

export class FrameCache {
  private frames = new Map<number, Frame>();
  private previewFrames = new Map<number, Frame>();
  private compressedBlobs = new Map<number, Blob>();

  private pending = new Map<number, AbortController>();
  private previewPending = new Map<number, AbortController>();
  private decoding = new Set<number>();

  private failed = new Set<number>();
  private previewFailed = new Set<number>();
  private wanted: number[] = [];
  private wantedSet = new Set<number>();
  private destroyed = false;
  private target = 0;
  private direction = 1;
  private active = true;
  private previewOrder: number[] = [];
  private previewIndex = 0;
  private hasShownFullRes = false;

  // Background preloader is unblocked either when target > 0 (user scrolled)
  // or after idle callback / timeout in the browser, leaving initial LCP unconstrained.
  private backgroundEnabled = false;

  constructor(
    private last: number,
    private limit: number,
    private update: () => void,
    private framePath: (index: number) => string = n => `frames/${String(n + 1).padStart(4, '0')}.webp`,
    private previewPath?: (index: number) => string
  ) {
    if (this.previewPath) {
      const seen = new Set<number>();
      const order: number[] = [];
      for (const stride of [8, 4, 2, 1]) {
        for (let i = 0; i <= this.last; i += stride) {
          if (!seen.has(i)) { seen.add(i); order.push(i); }
        }
      }
      this.previewOrder = order;
    }

    if (typeof window === 'undefined') {
      this.backgroundEnabled = true;
    } else {
      const enable = () => {
        this.enableBackground();
        window.removeEventListener('scroll', enable);
      };
      window.addEventListener('scroll', enable, { passive: true });
      setTimeout(enable, 2500);
    }
  }

  private enableBackground() {
    if (this.destroyed || this.backgroundEnabled) return;
    this.backgroundEnabled = true;
    this.pump();
  }

  request(target: number) {
    if (this.destroyed) return;
    if (target !== this.target) this.direction = target > this.target ? 1 : -1;
    this.target = target;
    this.active = true;

    if (target > 0 && !this.backgroundEnabled) {
      this.backgroundEnabled = true;
    }

    // Playhead-priority neighborhood window radiating outward from target:
    // local comes FIRST so adjacent frames load immediately, coarse frames at the end.
    const local = frameWindow(target, this.last, this.limit - 4, this.direction);
    const coarse = [0, Math.round(this.last / 3), Math.round(this.last * 2 / 3), this.last];
    this.wanted = [...new Set([...local, ...coarse])];
    this.wantedSet = new Set(this.wanted);

    // Abort fetches that are far from current playhead
    for (const [n, controller] of this.pending) {
      if (!this.wantedSet.has(n) && Math.abs(n - target) > this.limit) {
        controller.abort();
      }
    }
    this.evict();
    this.pump();
  }

  private evict() {
    // Evict decoded bitmaps outside wanted window to free GPU VRAM
    for (const [n, frame] of this.frames) {
      if (!this.wantedSet.has(n)) {
        dispose(frame);
        this.frames.delete(n);
      }
    }
    // Retain compressed blobs in memory for instant re-decode on reverse scrub
    const blobLimit = this.limit * 4;
    if (this.compressedBlobs.size > blobLimit) {
      const entries = [...this.compressedBlobs.keys()].sort((a, b) => Math.abs(b - this.target) - Math.abs(a - this.target));
      while (this.compressedBlobs.size > blobLimit && entries.length) {
        this.compressedBlobs.delete(entries.pop()!);
      }
    }
  }

  private pump() {
    if (this.destroyed || !this.active) return;

    // Concurrency limit: 6 concurrent full-res fetches
    while (this.pending.size < 6) {
      let n: number | undefined;

      // On initial page load before idle, only fetch target frame so LCP is unthrottled
      const candidates = this.backgroundEnabled ? this.wanted : [this.target];

      for (const w of candidates) {
        if (!this.frames.has(w) && !this.pending.has(w) && !this.failed.has(w) && !this.decoding.has(w)) {
          if (this.compressedBlobs.has(w)) {
            void this.decodeBlob(w, this.compressedBlobs.get(w)!);
            continue;
          }
          n = w;
          break;
        }
      }
      if (n === undefined) break;
      const controller = new AbortController();
      this.pending.set(n, controller);
      void this.loadReal(n, controller);
    }

    // Up to 2 concurrent preview fetches when background preloading is active
    if (this.previewPath && this.previewPending.size < 2 && this.backgroundEnabled) {
      while (this.previewPending.size < 2 && this.previewIndex < this.previewOrder.length) {
        const p = this.previewOrder[this.previewIndex++];
        if (!this.previewFrames.has(p) && !this.previewPending.has(p) && !this.previewFailed.has(p) && !this.frames.has(p)) {
          const controller = new AbortController();
          this.previewPending.set(p, controller);
          void this.loadPreview(p, controller);
        }
      }
    }
  }

  private async decodeBlob(n: number, blob: Blob) {
    if (this.decoding.has(n) || this.frames.has(n)) return;
    this.decoding.add(n);
    try {
      let frame: Frame;
      if (typeof createImageBitmap === 'function') {
        frame = await createImageBitmap(blob);
      } else {
        const url = URL.createObjectURL(blob);
        try {
          const img = new Image();
          img.src = url;
          await img.decode();
          frame = img;
        } finally {
          URL.revokeObjectURL(url);
        }
      }
      if (this.destroyed || !this.active || !this.wantedSet.has(n)) {
        dispose(frame);
        return;
      }
      this.frames.set(n, frame);
      this.hasShownFullRes = true;
      this.update();
    } catch {
      // Decode error
    } finally {
      this.decoding.delete(n);
    }
  }

  private async loadReal(n: number, controller: AbortController) {
    let frame: Frame | undefined;
    try {
      const blob = await fetchWithCacheStorage(media(this.framePath(n)), controller.signal);
      this.compressedBlobs.set(n, blob);

      if (typeof createImageBitmap === 'function') {
        frame = await createImageBitmap(blob);
      } else {
        const url = URL.createObjectURL(blob);
        try {
          const img = new Image();
          img.src = url;
          await img.decode();
          frame = img;
        } finally {
          URL.revokeObjectURL(url);
        }
      }
      if (this.destroyed || !this.active || controller.signal.aborted || !this.wantedSet.has(n)) {
        dispose(frame);
        return;
      }
      this.frames.set(n, frame);
      this.hasShownFullRes = true;
      this.update();
    } catch (error: any) {
      if (!controller.signal.aborted && !this.destroyed) {
        this.failed.add(n);
      }
    } finally {
      this.pending.delete(n);
      this.pump();
    }
  }

  private async loadPreview(n: number, controller: AbortController) {
    if (!this.previewPath) return;
    let frame: Frame | undefined;
    try {
      const blob = await fetchWithCacheStorage(media(this.previewPath(n)), controller.signal);
      if (typeof createImageBitmap === 'function') {
        frame = await createImageBitmap(blob);
      } else {
        const url = URL.createObjectURL(blob);
        try {
          const img = new Image();
          img.src = url;
          await img.decode();
          frame = img;
        } finally {
          URL.revokeObjectURL(url);
        }
      }
      if (this.destroyed || !this.active || controller.signal.aborted) {
        dispose(frame);
        return;
      }
      this.previewFrames.set(n, frame);
      if (!this.hasShownFullRes && !this.frames.has(this.target) && Math.abs(n - this.target) <= 8) {
        this.update();
      }
    } catch {
      this.previewFailed.add(n);
    } finally {
      this.previewPending.delete(n);
      this.pump();
    }
  }

  nearest(): { index: number; image: Frame } | undefined {
    // Exact match
    if (this.frames.has(this.target)) {
      return { index: this.target, image: this.frames.get(this.target)! };
    }

    // Find closest full-res frame
    let best = Infinity, result: { index: number; image: Frame } | undefined;
    for (const [n, image] of this.frames) {
      if (n === this.last && this.target < this.last) continue;
      const d = Math.abs(n - this.target);
      if (d < best) {
        best = d;
        result = { index: n, image };
      }
    }

    // Hybrid preview fallback per skill and user specification:
    // If the gap is <= 8 frames, hold the full-res frame (sharp, no blurry flicker!).
    // Only if gap > 8 frames during fast scrubs, use preview frame to avoid visual stutter/blank frames.
    if (best > 8 && this.previewFrames.size > 0) {
      for (const [n, image] of this.previewFrames) {
        if (n === this.last && this.target < this.last) continue;
        const d = Math.abs(n - this.target);
        if (d < best) {
          best = d;
          result = { index: n, image };
        }
      }
    }
    return result;
  }

  pause() {
    this.active = false;
    for (const controller of this.pending.values()) controller.abort();
    for (const controller of this.previewPending.values()) controller.abort();
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
    this.hasShownFullRes = false;
  }

  setLimit(limit: number) {
    this.limit = limit;
  }

  stats() {
    return {
      decoded: this.frames.size,
      previewDecoded: this.previewFrames.size,
      blobs: this.compressedBlobs.size,
      pending: this.pending.size,
      failed: this.failed.size,
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
    this.compressedBlobs.clear();
  }
}
