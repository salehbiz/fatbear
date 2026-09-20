#!/usr/bin/env python3
"""
Ultra-HD 4K Tier Generation Script (3840x2160)
Strictly adheres to:
- /scrub-section-pipeline: Exact integer cadence (k = round(i * 1.25)), unsharp (0.6) and noise (4) bake pass.
- /canvas-preloader-decoder: 182 frames Hero, 252 frames Crew.
- /resilient-hero-scrub: 4K posters & stills.
"""

from pathlib import Path
import subprocess
import tempfile
import os
import time
from concurrent.futures import ThreadPoolExecutor

ROOT = Path(__file__).resolve().parents[1]
MEDIA = ROOT / 'public/media'
SEC1_8K = Path('/Users/apple/Downloads/Section 1 - 8k .mp4')
SEC2_8K = Path('/Users/apple/Downloads/Upscaled 8K - Section 2.mp4')

HERO_4K = MEDIA / 'frames-4k'
CREW_4K = MEDIA / 'business/crew-4k'

HERO_4K.mkdir(parents=True, exist_ok=True)
CREW_4K.mkdir(parents=True, exist_ok=True)

WORKERS = min(10, os.cpu_count() or 4)

def run(cmd):
    subprocess.run(cmd, check=True)

def encode_webp(src: Path, dest: Path, q: int = 70):
    cmd = ['cwebp', '-quiet', '-q', str(q), '-m', '4', str(src), '-o', str(dest)]
    run(cmd)

def main():
    start_total = time.time()
    print("=== Starting 4K (3840x2160) Tier Generation ===")

    # 1. Section 1 (Hero)
    print("\n--- Section 1: Hero 4K (182 frames) ---")
    with tempfile.TemporaryDirectory() as tmpdir:
        tmppath = Path(tmpdir)
        print("Extracting 4K frames with unsharp (0.6) and noise (4) filter...")
        run([
            'ffmpeg', '-y', '-i', str(SEC1_8K),
            '-vf', 'scale=3840:2160,unsharp=5:5:0.6:5:5:0.0,noise=alls=4:allf=t',
            '-q:v', '2',
            str(tmppath / '%04d.jpg')
        ])

        # Map 182 frames: k = min(224, round(i * 1.25))
        tasks = []
        for i in range(182):
            k = min(224, round(i * 1.25))
            src = tmppath / f"{k + 1:04d}.jpg"
            dest = HERO_4K / f"{i + 1:04d}.webp"
            tasks.append((src, dest, 70))

        print(f"Encoding 182 4K frames to WebP with {WORKERS} workers...")
        with ThreadPoolExecutor(max_workers=WORKERS) as pool:
            futures = [pool.submit(encode_webp, s, d, q) for s, d, q in tasks]
            for f in futures:
                f.result()
        print(f"Section 1 4K completed: {len(list(HERO_4K.glob('*.webp')))} frames generated.")

        # Update 4K Poster and Poolside Post
        print("Updating 4K Posters...")
        poster_src = tmppath / "0001.jpg"
        run(['cwebp', '-quiet', '-q', '85', '-m', '4', str(poster_src), '-o', str(MEDIA / 'poster.webp')])
        run(['cwebp', '-quiet', '-q', '85', '-m', '4', str(poster_src), '-o', str(MEDIA / 'poolside-post.webp')])

    # 2. Section 2 (Crew)
    print("\n--- Section 2: Crew 4K (252 frames) ---")
    with tempfile.TemporaryDirectory() as tmpdir:
        tmppath = Path(tmpdir)
        print("Extracting 4K frames with unsharp (0.6) and noise (4) filter...")
        run([
            'ffmpeg', '-y', '-i', str(SEC2_8K),
            '-vf', 'scale=3840:2160,unsharp=5:5:0.6:5:5:0.0,noise=alls=4:allf=t',
            '-q:v', '2',
            str(tmppath / '%04d.jpg')
        ])

        tasks = []
        for i in range(252):
            k = min(313, round(i * 1.25))
            src = tmppath / f"{k + 1:04d}.jpg"
            dest = CREW_4K / f"{i + 1:04d}.webp"
            tasks.append((src, dest, 70))

        print(f"Encoding 252 4K frames to WebP with {WORKERS} workers...")
        with ThreadPoolExecutor(max_workers=WORKERS) as pool:
            futures = [pool.submit(encode_webp, s, d, q) for s, d, q in tasks]
            for f in futures:
                f.result()
        print(f"Section 2 4K completed: {len(list(CREW_4K.glob('*.webp')))} frames generated.")

        # Update 4K Crew Poster & End still
        print("Updating 4K Business stills...")
        run(['cp', str(tmppath / "0001.jpg"), str(MEDIA / 'business/crew-poster.jpg')])
        end_src = tmppath / f"{min(313, round(251 * 1.25)) + 1:04d}.jpg"
        run(['cp', str(end_src), str(MEDIA / 'business/end.jpg')])

    elapsed = time.time() - start_total
    print(f"\nAll 4K tiers successfully generated in {elapsed:.1f}s!")

if __name__ == '__main__':
    main()
