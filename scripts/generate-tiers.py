"""
Generate lightweight preview tiers and optimized WebP tiers for scroll sections.
- Hero: 384x216 WebP q=35 into public/media/frames-preview
- Crew: 384x216 WebP q=35 into public/media/business/crew-preview
- Crew WebP: 1280x720 WebP q=75 into public/media/business/crew-webp
"""
from pathlib import Path
import subprocess
from concurrent.futures import ThreadPoolExecutor
import os
import time

ROOT = Path(__file__).resolve().parents[1]
MEDIA = ROOT / 'public/media'

HERO_FRAMES = MEDIA / 'frames'
HERO_PREVIEW = MEDIA / 'frames-preview'
HERO_PREVIEW.mkdir(parents=True, exist_ok=True)

CREW_FRAMES = MEDIA / 'business/crew-frames'
CREW_PREVIEW = MEDIA / 'business/crew-preview'
CREW_PREVIEW.mkdir(parents=True, exist_ok=True)

CREW_WEBP = MEDIA / 'business/crew-webp'
CREW_WEBP.mkdir(parents=True, exist_ok=True)

def encode_hero_preview(src_path: Path):
    dest = HERO_PREVIEW / src_path.name
    if not dest.exists() or dest.stat().st_size == 0:
        subprocess.run(['cwebp', '-quiet', '-q', '35', '-resize', '384', '216', str(src_path), '-o', str(dest)], check=True)

def encode_crew_preview(src_path: Path):
    dest = CREW_PREVIEW / (src_path.stem + '.webp')
    if not dest.exists() or dest.stat().st_size == 0:
        subprocess.run(['cwebp', '-quiet', '-q', '35', '-resize', '384', '216', str(src_path), '-o', str(dest)], check=True)

def encode_crew_webp(src_path: Path):
    dest = CREW_WEBP / (src_path.stem + '.webp')
    if not dest.exists() or dest.stat().st_size == 0:
        subprocess.run(['cwebp', '-quiet', '-q', '75', str(src_path), '-o', str(dest)], check=True)

def main():
    workers = min(8, os.cpu_count() or 4)
    t0 = time.time()
    
    print(f"Generating Hero preview tier ({HERO_FRAMES} -> {HERO_PREVIEW})...")
    hero_files = sorted(HERO_FRAMES.glob('*.webp'))
    with ThreadPoolExecutor(max_workers=workers) as pool:
        list(pool.map(encode_hero_preview, hero_files))
    print(f"Hero preview tier completed: {len(hero_files)} frames in {time.time() - t0:.2f}s")

    t1 = time.time()
    print(f"Generating Crew preview tier ({CREW_FRAMES} -> {CREW_PREVIEW})...")
    crew_files = sorted(CREW_FRAMES.glob('*.jpg'))
    with ThreadPoolExecutor(max_workers=workers) as pool:
        list(pool.map(encode_crew_preview, crew_files))
    print(f"Crew preview tier completed: {len(crew_files)} frames in {time.time() - t1:.2f}s")

    t2 = time.time()
    print(f"Generating Crew WebP tier ({CREW_FRAMES} -> {CREW_WEBP})...")
    with ThreadPoolExecutor(max_workers=workers) as pool:
        list(pool.map(encode_crew_webp, crew_files))
    print(f"Crew WebP tier completed: {len(crew_files)} frames in {time.time() - t2:.2f}s")
    
    print(f"All tiers generated successfully in {time.time() - t0:.2f}s total.")

if __name__ == '__main__':
    main()
