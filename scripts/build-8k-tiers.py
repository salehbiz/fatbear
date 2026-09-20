#!/usr/bin/env python3
"""
Build Resilient Hero Scrub Multi-Tier Assets from 8K Source Videos.
- Section 1 (Hero): 182 frames, 1920x1080 WebP (q=80), 480x270 preview (q=35), posters and avatar.
- Section 2 (Crew): 252 frames, 1920x1080 WebP (q=80), 480x270 preview (q=35), 1920x1080 JPEG (q=88).
- Multi-threaded cwebp encoding.
- Automatic 0ms base64 LQIP calculation.
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

HERO_FRAMES = MEDIA / 'frames'
HERO_PREVIEW = MEDIA / 'frames-preview'
CREW_WEBP = MEDIA / 'business/crew-webp'
CREW_PREVIEW = MEDIA / 'business/crew-preview'
CREW_FRAMES = MEDIA / 'business/crew-frames'

for d in [HERO_FRAMES, HERO_PREVIEW, CREW_WEBP, CREW_PREVIEW, CREW_FRAMES]:
    d.mkdir(parents=True, exist_ok=True)

WORKERS = min(8, os.cpu_count() or 4)

def encode_webp(src: Path, dest: Path, q: int = 80, resize: tuple = None):
    cmd = ['cwebp', '-quiet', '-q', str(q)]
    if resize:
        cmd.extend(['-resize', str(resize[0]), str(resize[1])])
    cmd.extend([str(src), '-o', str(dest)])
    subprocess.run(cmd, check=True)

def encode_jpeg(src: Path, dest: Path, q: int = 88):
    cmd = ['ffmpeg', '-v', 'error', '-y', '-i', str(src), '-q:v', '2', str(dest)]
    subprocess.run(cmd, check=True)

def process_section_1():
    print("=== Processing Section 1 (Hero) from 8K ===")
    t0 = time.time()
    with tempfile.TemporaryDirectory(prefix='fatbear-s1-') as tmp:
        tmp_dir = Path(tmp)
        # Extract 182 frames at 1920x1080 Lanczos
        print("Extracting 182 frames @ 1920x1080...")
        extract_cmd = [
            'ffmpeg', '-v', 'error', '-y',
            '-i', str(SEC1_8K),
            '-vf', 'scale=1920:1080:flags=lanczos,fps=182/7.5',
            '-frames:v', '182',
            str(tmp_dir / '%04d.png')
        ]
        subprocess.run(extract_cmd, check=True)
        png_files = sorted(tmp_dir.glob('*.png'))
        print(f"Extracted {len(png_files)} PNG frames in {time.time() - t0:.2f}s")
        assert len(png_files) == 182, f"Expected 182 frames, got {len(png_files)}"

        # 1. Main 1080p WebP frames
        print(f"Encoding main 1080p WebP tier ({HERO_FRAMES})...")
        def enc_main(p):
            encode_webp(p, HERO_FRAMES / (p.stem + '.webp'), q=80)
        with ThreadPoolExecutor(max_workers=WORKERS) as pool:
            list(pool.map(enc_main, png_files))

        # 2. Preview tier (480x270 WebP q=35)
        print(f"Encoding preview tier 480x270 ({HERO_PREVIEW})...")
        def enc_preview(p):
            encode_webp(p, HERO_PREVIEW / (p.stem + '.webp'), q=35, resize=(480, 270))
        with ThreadPoolExecutor(max_workers=WORKERS) as pool:
            list(pool.map(enc_preview, png_files))

        # 3. Posters & Avatar
        print("Generating crisp posters and avatar from Frame 0001...")
        frame1 = png_files[0]
        encode_webp(frame1, MEDIA / 'poster.webp', q=90)
        encode_webp(frame1, MEDIA / 'poolside-post.webp', q=90)
        
        # Avatar crop from 1920x1080 (proportional to original 260:260:520:10 on 1280x720)
        # 520 / 1280 * 1920 = 780, 10 / 720 * 1080 = 15, size 390x390
        avatar_png = tmp_dir / 'avatar.png'
        subprocess.run([
            'ffmpeg', '-v', 'error', '-y', '-i', str(frame1),
            '-vf', 'crop=390:390:780:15,scale=192:192',
            str(avatar_png)
        ], check=True)
        encode_webp(avatar_png, MEDIA / 'avatar.webp', q=90)

        # 4. Generate 20x11 micro-WebP Base64 LQIP
        lqip_raw = subprocess.check_output([
            'cwebp', '-quiet', '-q', '10', '-resize', '20', '11', str(frame1), '-o', '-'
        ])
        lqip_b64 = base64.b64encode(lqip_raw).decode('ascii')
        print(f"Section 1 completed in {time.time() - t0:.2f}s")
        return lqip_b64

def process_section_2():
    print("=== Processing Section 2 (Creator Business Crew) from 8K ===")
    t0 = time.time()
    with tempfile.TemporaryDirectory(prefix='fatbear-s2-') as tmp:
        tmp_dir = Path(tmp)
        # Extract 252 frames at 1920x1080 Lanczos
        print("Extracting 252 frames @ 1920x1080...")
        extract_cmd = [
            'ffmpeg', '-v', 'error', '-y',
            '-i', str(SEC2_8K),
            '-vf', 'scale=1920:1080:flags=lanczos,fps=252/10.466667',
            '-frames:v', '252',
            str(tmp_dir / '%04d.png')
        ]
        subprocess.run(extract_cmd, check=True)
        png_files = sorted(tmp_dir.glob('*.png'))
        print(f"Extracted {len(png_files)} PNG frames in {time.time() - t0:.2f}s")
        assert len(png_files) == 252, f"Expected 252 frames, got {len(png_files)}"

        # 1. Main 1080p WebP tier
        print(f"Encoding main 1080p WebP tier ({CREW_WEBP})...")
        def enc_crew_webp(p):
            encode_webp(p, CREW_WEBP / (p.stem + '.webp'), q=80)
        with ThreadPoolExecutor(max_workers=WORKERS) as pool:
            list(pool.map(enc_crew_webp, png_files))

        # 2. Preview tier (480x270 WebP q=35)
        print(f"Encoding preview tier 480x270 ({CREW_PREVIEW})...")
        def enc_crew_prev(p):
            encode_webp(p, CREW_PREVIEW / (p.stem + '.webp'), q=35, resize=(480, 270))
        with ThreadPoolExecutor(max_workers=WORKERS) as pool:
            list(pool.map(enc_crew_prev, png_files))

        # 3. High quality JPEG frames (crew-frames)
        print(f"Encoding 1080p JPEG tier ({CREW_FRAMES})...")
        def enc_crew_jpg(p):
            encode_jpeg(p, CREW_FRAMES / (p.stem + '.jpg'), q=88)
        with ThreadPoolExecutor(max_workers=WORKERS) as pool:
            list(pool.map(enc_crew_jpg, png_files))

        # 4. Posters
        print("Generating crew posters...")
        encode_jpeg(png_files[0], MEDIA / 'business/crew-poster.jpg', q=90)
        encode_jpeg(png_files[-1], MEDIA / 'business/end.jpg', q=90)

        print(f"Section 2 completed in {time.time() - t0:.2f}s")

def update_manifests():
    # Keep width/height in manifest as the base coordinate space (1280x720) or updated dimensions
    # Keeping 1280x720 maintains backwards compatibility with focal/coverRect calculations
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
    print("Manifests updated.")

def update_index_lqip(lqip_b64: str):
    index_html = ROOT / 'index.html'
    content = index_html.read_text()
    import re
    new_content = re.sub(
        r"data:image/webp;base64,[A-Za-z0-9+/=]+",
        f"data:image/webp;base64,{lqip_b64}",
        content
    )
    index_html.write_text(new_content)
    print(f"Updated index.html with new 0ms LQIP base64 (length {len(lqip_b64)})")

def main():
    t_start = time.time()
    lqip_b64 = process_section_1()
    process_section_2()
    update_manifests()
    update_index_lqip(lqip_b64)
    print(f"\n✨ All tiers generated successfully in {time.time() - t_start:.2f}s total.")

if __name__ == '__main__':
    main()
