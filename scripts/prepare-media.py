"""Reproducible, non-destructive media preparation. Pass a matching replacement edit as argv[1]."""
from pathlib import Path
import json
import re
import shutil
import subprocess
import sys
import tempfile
from concurrent.futures import ThreadPoolExecutor

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT.parent / 'Fatbear-Standing-To-Eye-Faster-720p.mp4'
MEDIA = ROOT / 'public/media'
FRAMES = MEDIA / 'frames'
FRAMES.mkdir(parents=True, exist_ok=True)
shutil.copy2(SOURCE, MEDIA / 'opening.mp4')

def ffmpeg(*args):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(SOURCE), *args], check=True)

# Native 24fps; never upscale the supplied 720p footage.
with tempfile.TemporaryDirectory(prefix='fatbear-frames-') as tmp:
    ffmpeg('-vf', 'fps=24,scale=1280:720', str(Path(tmp) / '%04d.png'))
    def encode(p):
        subprocess.run(['cwebp', '-quiet', '-q', '80', str(p), '-o', str(FRAMES / (p.stem + '.webp'))], check=True)
    with ThreadPoolExecutor(max_workers=4) as pool:
        list(pool.map(encode, sorted(Path(tmp).glob('*.png'))))
    subprocess.run(['cwebp', '-quiet', '-q', '88', str(Path(tmp) / '0001.png'), '-o', str(MEDIA / 'poster.webp')], check=True)
    ffmpeg('-vf', 'crop=260:260:520:10,scale=192:192', '-frames:v', '1', str(Path(tmp) / 'avatar.png'))
    subprocess.run(['cwebp', '-quiet', '-q', '86', str(Path(tmp) / 'avatar.png'), '-o', str(MEDIA / 'avatar.webp')], check=True)
shutil.copy2(MEDIA / 'poster.webp', MEDIA / 'poolside-post.webp')

probe = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=nb_frames,width,height:format=duration', '-of', 'json', str(SOURCE)]))
black = subprocess.run(['ffmpeg', '-hide_banner', '-i', str(SOURCE), '-vf', 'blackdetect=d=0.1:pix_th=0.02', '-an', '-f', 'null', '-'], capture_output=True, text=True, check=True)
matches = re.findall(r'black_start:([\d.]+)', black.stderr)
count = int(probe['streams'][0]['nb_frames'])
black_frame = round(float(matches[-1]) * 24) if matches else count - 1
manifest = {'fps': 24, 'frameCount': count, 'lastFrame': min(black_frame, count - 1), 'width': 1280, 'height': 720, 'duration': float(probe['format']['duration'])}
(MEDIA / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(json.dumps(manifest))
