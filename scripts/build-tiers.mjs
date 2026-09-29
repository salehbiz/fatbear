#!/usr/bin/env node
// Landscape frame tiers for both films, encoded clean (no baked grain) straight from the 8K masters.
// Sizes follow the Vaultfy hero (vaultfy.ai), whose frames stay light enough to stream the whole film:
//   *-2560     2560×1440 q72  high-density screens on fast connections
//   *-1920     1920×1080 q72  everything else on desktop, and the fallback for 2560
//   *-preview   preview pyramid shown until the full frame for a position arrives
// Grain is not baked in: it roughly doubles WebP size and the page already draws its own grain overlay.
//
//   node scripts/build-tiers.mjs
//
// Phones use the portrait tier from scripts/build-portrait-tier.mjs.
import { execFileSync, execFile } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir, cpus } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);
const MEDIA = join(resolve(dirname(fileURLToPath(import.meta.url)), '..'), 'public/media');
const SECTIONS = [
  {
    source: '/Users/apple/Downloads/Section 1 - 8k .mp4', frames: 182, maxSource: 224,
    tiers: [['frames-2560', 2560, 1440, 72], ['frames-1920', 1920, 1080, 72], ['frames-preview-hd', 960, 540, 60]]
  },
  {
    source: '/Users/apple/Downloads/Upscaled 8K - Section 2.mp4', frames: 252, maxSource: 313,
    tiers: [['business/crew-2560', 2560, 1440, 72], ['business/crew-1920', 1920, 1080, 72], ['business/crew-preview-hd', 800, 450, 55]]
  }
];

for (const { source, frames, maxSource, tiers } of SECTIONS) {
  const tmp = mkdtempSync(join(tmpdir(), 'fatbear-tiers-'));
  try {
    console.log(source);
    // One decode of the 8K master, split into one Lanczos-scaled PNG sequence per tier.
    const split = `[0]split=${tiers.length}${tiers.map((_, t) => `[s${t}]`).join('')};` +
      tiers.map(([, w, h], t) => `[s${t}]scale=${w}:${h}:flags=lanczos[o${t}]`).join(';');
    const outputs = tiers.flatMap((_, t) => {
      mkdirSync(join(tmp, String(t)));
      return ['-map', `[o${t}]`, '-start_number', '0', join(tmp, String(t), '%d.png')];
    });
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', source, '-filter_complex', split, ...outputs]);

    // Same cadence as every other tier: output frame i is source frame round(i * 1.25).
    const jobs = tiers.flatMap(([dir, , , q], t) => {
      mkdirSync(join(MEDIA, dir), { recursive: true });
      return Array.from({ length: frames }, (_, i) => () => run('cwebp', ['-quiet', '-q', String(q), '-m', '6', '-sharp_yuv',
        join(tmp, String(t), `${Math.min(maxSource, Math.round(i * 1.25))}.png`), '-o', join(MEDIA, dir, `${String(i + 1).padStart(4, '0')}.webp`)]));
    });
    let next = 0;
    await Promise.all(Array.from({ length: Math.max(2, cpus().length - 2) }, async () => { while (next < jobs.length) await jobs[next++](); }));
    for (const [dir] of tiers) console.log(`  ${dir}: ${readdirSync(join(MEDIA, dir)).length} frames`);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}
