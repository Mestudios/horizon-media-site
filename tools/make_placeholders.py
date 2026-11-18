#!/usr/bin/env python3
"""Gives every photo tile on the portfolio and car pages a tiny, blurry preview.

The preview is a very small copy of the photo (about 300 bytes), written into the
tile itself as --ph, so it shows the instant the page arrives and the real photo
fades in over it. Run after adding or replacing a photo (after
make_photo_variants.py):

    python3 tools/make_placeholders.py           # update the pages
    python3 tools/make_placeholders.py --check   # change nothing; exit 1 if out of date
"""

import argparse
import base64
import io
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAGES = [ROOT / "portfolio.html", ROOT / "cars.html"]
SOURCES = ROOT / "photos"
WIDTH = 10  # pixels; the browser stretches it smoothly, which is what blurs it
QUALITY = 40

SHOT = re.compile(r'<button class="shot"(?P<attrs>[^>]*)>(?P<inner><img src="(?P<thumb>img/[^"]+)")')
STYLE = re.compile(r' style="--ph:url\(data:image/jpeg;base64,[A-Za-z0-9+/=]+\)"')


def tiny(thumb):
    from PIL import Image, ImageOps

    source = SOURCES / thumb[len("img/"):].replace("/thumb/", "/")
    with Image.open(source) as opened:
        image = ImageOps.exif_transpose(opened).convert("RGB")
    image = image.resize((WIDTH, max(1, round(image.height * WIDTH / image.width))), Image.LANCZOS)
    buffer = io.BytesIO()
    image.save(buffer, "JPEG", quality=QUALITY, optimize=True)
    return base64.b64encode(buffer.getvalue()).decode("ascii")


def updated(html):
    def one(match):
        attrs = STYLE.sub("", match.group("attrs"))
        return f'<button class="shot"{attrs} style="--ph:url(data:image/jpeg;base64,{tiny(match.group("thumb"))})">{match.group("inner")}'

    return SHOT.sub(one, html)


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--check", action="store_true", help="change nothing; exit 1 if out of date")
    args = parser.parse_args()
    stale = []
    for page in PAGES:
        html = page.read_text(encoding="utf-8")
        new = updated(html)
        if new != html:
            stale.append(page.name)
            if not args.check:
                page.write_text(new, encoding="utf-8")
    if args.check and stale:
        print("Photo previews are out of date in: " + ", ".join(stale) + ". Fix with: python3 tools/make_placeholders.py")
        return 1
    print(("Updated previews in: " + ", ".join(stale)) if stale and not args.check else "Photo previews are up to date.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
