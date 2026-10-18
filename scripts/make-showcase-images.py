"""
Small square WebP copies of the homepage carousel photos (public/showcase/<id>.webp).

The carousel shows 54 gift photos at about 160 px. Loading each brand's
full-size photo made the tiles sit white for a second or two, so this
fetches each photo once, crops it to a centered square, and saves a
320 px WebP (sharp on 2x screens, a few KB each) that the site serves
itself. Re-run after changing SHOWCASE_IDS in src/data/showcase.ts:

    python3 scripts/make-showcase-images.py

Needs Pillow. A photo that won't download is skipped; its tile falls back
to the original URL.
"""
import io, json, re, sys, urllib.request
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "showcase"
SIZE = 320
UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"

ids = re.findall(r'"(r\d+)"', (ROOT / "src" / "data" / "showcase.ts").read_text().split("SHOWCASE_IDS")[1].split("];")[0])
req = urllib.request.Request("https://giftpicker.io/api/gifts", headers={"User-Agent": UA})
rows = {str(r.get("row_id")): r for r in json.load(urllib.request.urlopen(req, timeout=60))["data"]}

OUT.mkdir(parents=True, exist_ok=True)
made, failed = 0, []
for gid in ids:
    url = str(rows.get(gid, {}).get("PhotoAddress") or "")
    if not url:
        failed.append((gid, "no photo or not live"))
        continue
    try:
        data = urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA, "Referer": "https://giftpicker.io/"}), timeout=30).read()
        im = Image.open(io.BytesIO(data))
        im = im.convert("RGBA") if im.mode in ("P", "LA") else im
        if im.mode == "RGBA":
            bg = Image.new("RGB", im.size, (255, 255, 255))
            bg.paste(im, mask=im.split()[-1])
            im = bg
        im = im.convert("RGB")
        w, h = im.size
        s = min(w, h)
        im = im.crop(((w - s) // 2, (h - s) // 2, (w - s) // 2 + s, (h - s) // 2 + s)).resize((SIZE, SIZE), Image.LANCZOS)
        im.save(OUT / f"{gid}.webp", "WEBP", quality=80, method=6)
        made += 1
    except Exception as e:  # keep going; the tile falls back to the original photo
        failed.append((gid, str(e)[:80]))

print(f"{made} of {len(ids)} saved to {OUT.relative_to(ROOT)}")
for gid, why in failed:
    print("  skipped", gid, why)
