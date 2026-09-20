import { frameWindow } from './math.mjs';
import { media } from './media';

type Frame = ImageBitmap | HTMLImageElement;
function dispose(frame: Frame) { if ('close' in frame) frame.close(); }

const CACHE_NAME = 'fatbear-frame-cache-v1';

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
  private previewBlobs = new Map<number, Blob>();
  
  private pending = new Map<number, AbortController>();
  private previewPending = new Map<number, AbortController>();
  private decoding = new Set<number>();
  
  private failed = new Set<number>();
  private previewFailed = new Set<number>();
  private wanted: number[] = [];
  private destroyed = false;
  private target = 0;
  private direction = 1;
  private active = true;
  private previewOrder: number[] = [];
  private previewIndex = 0;

  constructor(
    private last: number,
    private limit: number,
    private update: () => void,
    private framePath: (index: number) => string = n => `frames/${String(n + 1).padStart(4, '0')}.webp`,
    private previewPath?: (index: number) => string
  ) {
    if (this.previewPath) {
      const order: number[] = [];
      for (const stride of [8, 4, 2, 1]) {
        for (let i = 0; i <= this.last; i += stride) {
          if (!order.includes(i)) order.push(i);
        }
      }
      this.previewOrder = order;
    }
  }

  request(target: number) {
    if (this.destroyed) return;
    if (target !== this.target) this.direction = target > this.target ? 1 : -1;
    this.target = target;
    this.active = true;
    const local = frameWindow(target, this.last, this.limit - 4, this.direction);
    const coarse = [0, Math.round(this.last / 3), Math.round(this.last * 2 / 3), this.last];
    this.wanted = [...new Set([target, ...coarse, ...local])];
    
    for (const [n, controller] of this.pending) {
      if (!this.wanted.includes(n)) controller.abort();
    }
    this.evict();
    this.pump();
  }

  private evict() {
    for (const [n, frame] of this.frames) {
      if (!this.wanted.includes(n)) {
        dispose(frame);
        this.frames.delete(n);
      }
    }
    const maxPreview = Math.max(12, Math.floor(this.limit / 2));
    if (this.previewFrames.size > maxPreview) {
      for (const [n, frame] of this.previewFrames) {
        if (!this.wanted.includes(n)) {
          dispose(frame);
          this.previewFrames.delete(n);
          if (this.previewFrames.size <= maxPreview) break;
        }
      }
    }
  }

  private pump() {
    if (this.destroyed || !this.active) return;
    
    while (this.pending.size < 4) {
      const n = this.wanted.find(n => !this.frames.has(n) && !this.pending.has(n) && !this.failed.has(n));
      if (n === undefined) break;
      const controller = new AbortController();
      this.pending.set(n, controller);
      void this.loadReal(n, controller);
    }

    if (this.previewPath && this.previewPending.size < 2) {
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
      if (this.destroyed || !this.wanted.includes(n)) {
        dispose(frame);
        return;
      }
      this.frames.set(n, frame);
      this.update();
    } catch {
      // Decode failed
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
      if (this.destroyed || controller.signal.aborted || !this.wanted.includes(n)) {
        dispose(frame);
        return;
      }
      this.frames.set(n, frame);
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
      this.previewBlobs.set(n, blob);
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
      if (this.destroyed || controller.signal.aborted) {
        dispose(frame);
        return;
      }
      this.previewFrames.set(n, frame);
      if (!this.frames.has(this.target) && Math.abs(n - this.target) <= 6) {
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
    if (this.frames.has(this.target)) {
      return { index: this.target, image: this.frames.get(this.target)! };
    }
    let best = Infinity, result: { index: number; image: Frame } | undefined;
    for (const [n, image] of this.frames) {
      if (n === this.last && this.target < this.last) continue;
      const d = Math.abs(n - this.target);
      if (d < best) {
        best = d;
        result = { index: n, image };
      }
    }
    if (best > 4 && this.previewFrames.size > 0) {
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
    this.previewBlobs.clear();
    this.wanted = [];
  }

  setLimit(limit: number) {
    this.limit = limit;
  }

  stats() {
    return {
      decoded: this.frames.size,
      previewDecoded: this.previewFrames.size,
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
    this.previewBlobs.clear();
  }
}
