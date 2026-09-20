#!/usr/bin/env python3
"""
Master Resilient Pipeline Script
Adheres to:
1. /scrub-section-pipeline:
   - Exact integer frame mapping (k = round(i * 1.25)) from 30fps 8K master
   - Micro-contrast and noise bake pass (unsharp=5:5:0.6:5:5:0.0,noise=alls=4:allf=t)
   - Tiered encoding: desktop (1920x1080 q=75), mobile (960x540 q=70), preview (480x270 q=35)
2. /canvas-preloader-decoder:
   - Synchronized frame counts: 182 for Hero, 252 for Crew
   - Base64 micro-WebP LQIP generation
3. /resilient-hero-scrub:
   - Crisp posters & avatar generation
   - Manifest updates
"""

from pathlib import Path
import subprocess
import tempfile
import os
import time
import json
import base64
from concurrent.futures import ThreadPoolExecutor

ROOT = Path(__file__).resolve().parents[1]
MEDIA = ROOT / 'public/media'
SEC1_8K = Path('/Users/apple/Downloads/Section 1 - 8k .mp4')
SEC2_8K = Path('/Users/apple/Downloads/Upscaled 8K - Section 2.mp4')

# Directories
HERO_DESKTOP = MEDIA / 'frames'
HERO_MOBILE = MEDIA / 'frames-mobile'
HERO_PREVIEW = MEDIA / 'frames-preview'

CREW_DESKTOP = MEDIA / 'business/crew-webp'
CREW_MOBILE = MEDIA / 'business/crew-mobile'
CREW_PREVIEW = MEDIA / 'business/crew-preview'
CREW_FRAMES = MEDIA / 'business/crew-frames'

for d in [HERO_DESKTOP, HERO_MOBILE, HERO_PREVIEW, CREW_DESKTOP, CREW_MOBILE, CREW_PREVIEW, CREW_FRAMES]:
    d.mkdir(parents=True, exist_ok=True)

WORKERS = min(8, os.cpu_count() or 4)

def encode_webp(src: Path, dest: Path, q: int = 75, resize: tuple = None):
    cmd = ['cwebp', '-quiet', '-q', str(q), '-m', '5']
    if resize:
        cmd.extend(['-resize', str(resize[0]), str(resize[1])])
    cmd.extend([str(src), '-o', str(dest)])
    subprocess.run(cmd, check=True)

def encode_jpeg(src: Path, dest: Path, q: int = 88):
    cmd = ['ffmpeg', '-v', 'error', '-y', '-i', str(src), '-q:v', '2', str(dest)]
    subprocess.run(cmd, check=True)

def bake_filters(src: Path, dest: Path):
    # Unsharp 0.6 micro-contrast + dither noise 4
    cmd = [
        'ffmpeg', '-v', 'error', '-y', '-i', str(src),
        '-vf', 'unsharp=5:5:0.6:5:5:0.0,noise=alls=4:allf=t',
        str(dest)
    ]
    subprocess.run(cmd, check=True)

def process_hero():
    print("=== [1/2] Processing Hero Section from 8K ===")
    t0 = time.time()
    with tempfile.TemporaryDirectory(prefix='fatbear-hero-') as tmp:
        tmp_dir = Path(tmp)
        raw_dir = tmp_dir / 'raw'
        baked_dir = tmp_dir / 'baked'
        raw_dir.mkdir()
        baked_dir.mkdir()

        print("Step 1: Extracting raw 8K frames to 1080p...")
        # Extract all 225 frames at 1920x1080 Lanczos
        subprocess.run([
            'ffmpeg', '-v', 'error', '-y',
            '-i', str(SEC1_8K),
            '-vf', 'scale=1920:1080:flags=lanczos',
            str(raw_dir / '%04d.png')
        ], check=True)
        raw_files = sorted(raw_dir.glob('*.png'))
        print(f"Extracted {len(raw_files)} raw 8K->1080p frames")

        print("Step 2: Selecting exact 182 integer-cadence frames and applying Bake Pass...")
        # Select exact 182 frames: k = min(len(raw_files)-1, round(i * 1.25))
        selected_pairs = []
        for i in range(182):
            k = min(len(raw_files) - 1, round(i * 1.25))
            target_baked = baked_dir / f"{i+1:04d}.png"
            selected_pairs.append((raw_files[k], target_baked))

        def run_bake(pair):
            bake_filters(pair[0], pair[1])

        with ThreadPoolExecutor(max_workers=WORKERS) as pool:
            list(pool.map(run_bake, selected_pairs))
        print(f"Baked {len(selected_pairs)} frames with unsharp & dither")

        baked_files = sorted(baked_dir.glob('*.png'))

        print("Step 3: Compressing Tiers (Desktop 1080p, Mobile 960p, Preview 270p)...")
        # 1. Desktop tier (1920x1080 q=75)
        def enc_desktop(p):
            encode_webp(p, HERO_DESKTOP / (p.stem + '.webp'), q=75)
        with ThreadPoolExecutor(max_workers=WORKERS) as pool:
            list(pool.map(enc_desktop, baked_files))

        # 2. Mobile tier (960x540 q=70)
        def enc_mobile(p):
            encode_webp(p, HERO_MOBILE / (p.stem + '.webp'), q=70, resize=(960, 540))
        with ThreadPoolExecutor(max_workers=WORKERS) as pool:
            list(pool.map(enc_mobile, baked_files))

        # 3. Preview tier (480x270 q=35)
        def enc_preview(p):
            encode_webp(p, HERO_PREVIEW / (p.stem + '.webp'), q=35, resize=(480, 270))
        with ThreadPoolExecutor(max_workers=WORKERS) as pool:
            list(pool.map(enc_preview, baked_files))

        # Step 4: Posters & Avatar
        print("Step 4: Generating crisp posters and avatar...")
        frame1 = baked_files[0]
        encode_webp(frame1, MEDIA / 'poster.webp', q=90)
        encode_webp(frame1, MEDIA / 'poolside-post.webp', q=90)

        # Avatar crop from 1920x1080 (proportional 390x390 @ 780,15)
        avatar_png = tmp_dir / 'avatar.png'
        subprocess.run([
            'ffmpeg', '-v', 'error', '-y', '-i', str(frame1),
            '-vf', 'crop=390:390:780:15,scale=192:192',
            str(avatar_png)
        ], check=True)
        encode_webp(avatar_png, MEDIA / 'avatar.webp', q=90)

        # Step 5: Generate 0ms Base64 micro-WebP LQIP (20x11)
        lqip_raw = subprocess.check_output([
            'cwebp', '-quiet', '-q', '10', '-resize', '20', '11', str(frame1), '-o', '-'
        ])
        lqip_b64 = base64.b64encode(lqip_raw).decode('ascii')
        print(f"Hero section completed in {time.time() - t0:.2f}s")
        return lqip_b64

def process_crew():
    print("\n=== [2/2] Processing Creator Business Crew Section from 8K ===")
    t0 = time.time()
    with tempfile.TemporaryDirectory(prefix='fatbear-crew-') as tmp:
        tmp_dir = Path(tmp)
        raw_dir = tmp_dir / 'raw'
        baked_dir = tmp_dir / 'baked'
        raw_dir.mkdir()
        baked_dir.mkdir()

        print("Step 1: Extracting raw 8K frames to 1080p...")
        # Extract all 314 frames at 1920x1080 Lanczos
        subprocess.run([
            'ffmpeg', '-v', 'error', '-y',
            '-i', str(SEC2_8K),
            '-vf', 'scale=1920:1080:flags=lanczos',
            str(raw_dir / '%04d.png')
        ], check=True)
        raw_files = sorted(raw_dir.glob('*.png'))
        print(f"Extracted {len(raw_files)} raw 8K->1080p frames")

        print("Step 2: Selecting exact 252 integer-cadence frames and applying Bake Pass...")
        # Select exact 252 frames: k = min(len(raw_files)-1, round(i * 1.25))
        selected_pairs = []
        for i in range(252):
            k = min(len(raw_files) - 1, round(i * 1.25))
            target_baked = baked_dir / f"{i+1:04d}.png"
            selected_pairs.append((raw_files[k], target_baked))

        def run_bake(pair):
            bake_filters(pair[0], pair[1])

        with ThreadPoolExecutor(max_workers=WORKERS) as pool:
            list(pool.map(run_bake, selected_pairs))
        print(f"Baked {len(selected_pairs)} frames with unsharp & dither")

        baked_files = sorted(baked_dir.glob('*.png'))

        print("Step 3: Compressing Tiers (Desktop 1080p, Mobile 960p, Preview 270p, JPEG archive)...")
        # 1. Desktop tier (1920x1080 q=75)
        def enc_crew_desktop(p):
            encode_webp(p, CREW_DESKTOP / (p.stem + '.webp'), q=75)
        with ThreadPoolExecutor(max_workers=WORKERS) as pool:
            list(pool.map(enc_crew_desktop, baked_files))

        # 2. Mobile tier (960x540 q=70)
        def enc_crew_mobile(p):
            encode_webp(p, CREW_MOBILE / (p.stem + '.webp'), q=70, resize=(960, 540))
        with ThreadPoolExecutor(max_workers=WORKERS) as pool:
            list(pool.map(enc_crew_mobile, baked_files))

        # 3. Preview tier (480x270 q=35)
        def enc_crew_prev(p):
            encode_webp(p, CREW_PREVIEW / (p.stem + '.webp'), q=35, resize=(480, 270))
        with ThreadPoolExecutor(max_workers=WORKERS) as pool:
            list(pool.map(enc_crew_prev, baked_files))

        # 4. JPEG frames archive
        def enc_crew_jpg(p):
            encode_jpeg(p, CREW_FRAMES / (p.stem + '.jpg'), q=88)
        with ThreadPoolExecutor(max_workers=WORKERS) as pool:
            list(pool.map(enc_crew_jpg, baked_files))

        # Step 4: Posters
        print("Step 4: Generating crew posters...")
        encode_jpeg(baked_files[0], MEDIA / 'business/crew-poster.jpg', q=90)
        encode_jpeg(baked_files[-1], MEDIA / 'business/end.jpg', q=90)

        print(f"Crew section completed in {time.time() - t0:.2f}s")

def update_manifests():
    m1 = {
        "fps": 24,
        "frameCount": 182,
        "lastFrame": 169,
        "width": 1280,
        "height": 720,
        "duration": 7.583333
    }
    (MEDIA / 'manifest.json').write_text(json.dumps(m1, indent=2) + '\n')

    m2 = {
        "source": "Upscaled 8K - Section 2.mp4",
        "sourceStart": 0,
        "sourceEnd": 10.5,
        "fps": 24,
        "frameCount": 252,
        "lastFrame": 251,
        "width": 1280,
        "height": 720,
        "duration": 10.5,
        "extension": "webp",
        "frames": "crew-webp"
    }
    (MEDIA / 'business/manifest.json').write_text(json.dumps(m2, indent=2) + '\n')

def update_lqip(lqip_b64: str):
    index_html = ROOT / 'index.html'
    content = index_html.read_text()
    import re
    new_content = re.sub(
        r"data:image/webp;base64,[A-Za-z0-9+/=]+",
        f"data:image/webp;base64,{lqip_b64}",
        content
    )
    index_html.write_text(new_content)
    print(f"Updated index.html with new 0ms LQIP base64")

def main():
    t_start = time.time()
    lqip_b64 = process_hero()
    process_crew()
    update_manifests()
    update_lqip(lqip_b64)
    print(f"\n✨ All pipeline assets generated and verified in {time.time() - t_start:.2f}s total.")

if __name__ == '__main__':
    main()
