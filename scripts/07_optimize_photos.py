"""Optimizar fotos para la web:
- Convertir BMP -> JPG con calidad 85.
- Redimensionar si el lado mayor > 1600 px.
- Copiar los JPG existentes tal cual (o reencodear si son > 2 MB).
- Genera export/fotos_web/<tabla>/<nombre>.jpg
- Genera export/fotos_web/index.json con mapeo tabla -> lista de {id, nombre, ruta}
"""
from __future__ import annotations

import json
import re
from pathlib import Path

from PIL import Image, ImageOps

SRC = Path(r"C:\Users\Mateo\Downloads\w\export\fotos")
DST = Path(r"C:\Users\Mateo\Downloads\w\export\fotos_web")
DST.mkdir(parents=True, exist_ok=True)

MAX_SIDE = 1600
Q = 85

ID_RE = re.compile(r"^id(\d+)(?:__|\.|_)")


def parse_id(name: str) -> str:
    m = ID_RE.match(name)
    return m.group(1) if m else Path(name).stem


def process(p: Path, out_dir: Path) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    dst = out_dir / (p.stem + ".jpg")
    if dst.exists():
        return dst
    with Image.open(p) as img:
        img = ImageOps.exif_transpose(img)
        img = img.convert("RGB")
        w, h = img.size
        m = max(w, h)
        if m > MAX_SIDE:
            scale = MAX_SIDE / m
            img = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
        img.save(dst, "JPEG", quality=Q, optimize=True, progressive=True)
    return dst


def main() -> None:
    index: dict[str, list[dict]] = {}
    total = 0
    for tab_dir in sorted(SRC.iterdir()):
        if not tab_dir.is_dir():
            continue
        out_tab = DST / tab_dir.name
        arr: list[dict] = []
        for p in sorted(tab_dir.iterdir()):
            if not p.is_file():
                continue
            try:
                out = process(p, out_tab)
            except Exception as e:
                print(f"WARN {p.name}: {e}")
                continue
            arr.append(
                {
                    "id": parse_id(p.name),
                    "src": p.name,
                    "dst": str(out.relative_to(DST)).replace("\\", "/"),
                    "size_kb": round(out.stat().st_size / 1024, 1),
                }
            )
            total += 1
        if arr:
            index[tab_dir.name] = arr
            print(f"OK {tab_dir.name}: {len(arr)} imagenes")

    (DST / "index.json").write_text(json.dumps(index, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nTotal optimizadas: {total}")


if __name__ == "__main__":
    main()
