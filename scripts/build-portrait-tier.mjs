#!/usr/bin/env node
// Portrait hero tiers for phones, cut straight from the 8K master.
//
// Phones show the film full-screen in portrait, so a 16:9 frame is cropped to a thin vertical slice:
// a 960×540 frame leaves ~250×540 real pixels stretched across the screen. Here each frame is cropped
// to 9:16 at 8K along the same focal path the renderer follows (focalAt), then downscaled, so a phone
// gets ~1080×1920 real pixels for about the bytes of a 1080p landscape frame.
//
//   node scripts/build-portrait-tier.mjs ["/path/to/Section 1 - 8k .mp4"]
//
// Writes public/media/frames-portrait (1080×1920) and frames-portrait-preview (432×768).
import { execFileSync, execFile } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir, cpus } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { focalAt, portraitCrop, PORTRAIT } from '../src/lib/math.mjs';

const run = promisify(execFile);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MEDIA = join(ROOT, 'public/media');
const SOURCE = process.argv[2] || '/Users/apple/Downloads/Section 1 - 8k .mp4';
const FRAMES = 182;
const FULL = join(MEDIA, 'frames-portrait');
const PREVIEW = join(MEDIA, 'frames-portrait-preview');

const [sw, sh] = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', SOURCE]).toString().trim().split(',').map(Number);
if (sw < 3840) throw new Error(`Source is ${sw}×${sh}; the portrait tier needs the 8K (or at least 4K) master.`);

mkdirSync(FULL, { recursive: true });
mkdirSync(PREVIEW, { recursive: true });
const tmp = mkdtempSync(join(tmpdir(), 'fatbear-portrait-'));

try {
  // Same cadence as the existing tiers: output frame i is source frame round(i * 1.25), capped at 224.
  const picks = Array.from({ length: FRAMES }, (_, i) => Math.min(224, Math.round(i * 1.25)));
  console.log(`Extracting source frames at ${sw}×${sh}…`);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', SOURCE, '-start_number', '0', join(tmp, 'src_%d.png')]);

  const jobs = picks.map((k, i) => async () => {
    const crop = portraitCrop(sw, sh, focalAt(i).x);
    const name = `${String(i + 1).padStart(4, '0')}`;
    const png = join(tmp, `p_${name}.png`), small = join(tmp, `s_${name}.png`);
    await run('ffmpeg', ['-v', 'error', '-y', '-i', join(tmp, `src_${k}.png`), '-vf', `crop=${crop.w}:${crop.h}:${crop.x}:0,scale=${PORTRAIT.w}:${PORTRAIT.h}:flags=lanczos`, png]);
    await run('ffmpeg', ['-v', 'error', '-y', '-i', png, '-vf', `scale=${PORTRAIT.previewW}:${PORTRAIT.previewH}:flags=lanczos`, small]);
    await run('cwebp', ['-quiet', '-q', '80', '-m', '6', '-sharp_yuv', png, '-o', join(FULL, `${name}.webp`)]);
    await run('cwebp', ['-quiet', '-q', '62', '-m', '6', '-sharp_yuv', small, '-o', join(PREVIEW, `${name}.webp`)]);
  });

  const workers = Math.max(2, cpus().length - 2);
  let next = 0, done = 0;
  await Promise.all(Array.from({ length: workers }, async () => {
    while (next < jobs.length) {
      await jobs[next++]();
      if (++done % 20 === 0) console.log(`  ${done}/${FRAMES}`);
    }
  }));

  const size = dir => readdirSync(dir).length;
  console.log(`Done: ${size(FULL)} portrait frames, ${size(PREVIEW)} previews`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
