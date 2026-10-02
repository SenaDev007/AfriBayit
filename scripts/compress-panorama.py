#!/usr/bin/env python3
"""Compresse un panorama équirectangulaire JPG vers 2048x1024 qualité 82."""
import sys
from PIL import Image


def main() -> None:
    src, dst = sys.argv[1], sys.argv[2]
    img = Image.open(src).convert("RGB")
    # Équirectangulaire : ratio 2:1 préservé, largeur cible 2048
    target_w = 2048
    if img.width > target_w:
        target_h = round(img.height * target_w / img.width)
        img = img.resize((target_w, target_h), Image.LANCZOS)
    img.save(dst, "JPEG", quality=82, optimize=True, progressive=True)
    print(f"{dst}: {img.width}x{img.height}")


if __name__ == "__main__":
    main()
