"""Vuelca la SQLite gmao.db a un data.js con las fotos embebidas como data URIs
(reducidas) para la versión estática / artifact."""
from __future__ import annotations

import base64
import io
import json
import sqlite3
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(r"C:\Users\Mateo\Downloads\w")
DB = ROOT / "webapp" / "gmao.db"
STATIC = ROOT / "webapp" / "static"
OUT = ROOT / "proyecto_web_estatica" / "data.js"


def foto_data_uri(rel: str | None, max_side: int, quality: int) -> str | None:
    if not rel:
        return None
    # rel viene como /static/fotos/equipos/110.jpg
    p = STATIC / rel.replace("/static/", "").replace("/", "\\")
    if not p.exists():
        return None
    try:
        with Image.open(p) as im:
            im = ImageOps.exif_transpose(im).convert("RGB")
            w, h = im.size
            m = max(w, h)
            if m > max_side:
                s = max_side / m
                im = im.resize((int(w * s), int(h * s)), Image.LANCZOS)
            buf = io.BytesIO()
            im.save(buf, "JPEG", quality=quality, optimize=True)
            b64 = base64.b64encode(buf.getvalue()).decode("ascii")
            return "data:image/jpeg;base64," + b64
    except Exception:
        return None


def rows(cur, sql):
    cur.execute(sql)
    cols = [c[0] for c in cur.description]
    return [dict(zip(cols, r)) for r in cur.fetchall()]


def main() -> None:
    con = sqlite3.connect(DB)
    cur = con.cursor()

    equipos = rows(cur, "SELECT * FROM equipos")
    for e in equipos:
        e["foto"] = foto_data_uri(e.get("foto"), 760, 72)

    motores = rows(cur, "SELECT * FROM motores")
    ordenes = rows(cur, "SELECT * FROM ordenes")
    for o in ordenes:
        o["foto"] = foto_data_uri(o.get("foto"), 900, 74)
    planes = rows(cur, "SELECT * FROM planes_preventivos")
    for pl in planes:
        pl["grafico"] = foto_data_uri(pl.get("grafico"), 640, 68)
    repuestos = rows(cur, "SELECT * FROM repuestos")
    tecnicos = rows(cur, "SELECT * FROM tecnicos")
    proveedores = rows(cur, "SELECT * FROM proveedores")
    sectores = rows(cur, "SELECT * FROM sectores")
    tipos_mant = rows(cur, "SELECT * FROM tipos_mant")
    caracteres_mant = rows(cur, "SELECT * FROM caracteres_mant")
    acciones_mant = rows(cur, "SELECT * FROM acciones_mant")
    ejecutantes = rows(cur, "SELECT * FROM ejecutantes")
    actividad = rows(cur, "SELECT tipo, entidad, entidad_id, detalle, ts FROM actividad ORDER BY id DESC")

    data = {
        "equipos": equipos,
        "motores": motores,
        "ordenes": ordenes,
        "planes": planes,
        "repuestos": repuestos,
        "tecnicos": tecnicos,
        "proveedores": proveedores,
        "sectores": sectores,
        "tipos_mant": tipos_mant,
        "caracteres_mant": caracteres_mant,
        "acciones_mant": acciones_mant,
        "ejecutantes": ejecutantes,
        "actividad": actividad,
    }
    con.close()

    payload = "window.GMAO_DATA = " + json.dumps(data, ensure_ascii=False) + ";"
    OUT.write_text(payload, encoding="utf-8")
    size_mb = OUT.stat().st_size / (1024 * 1024)
    con_foto_eq = sum(1 for e in equipos if e["foto"])
    print(f"data.js: {size_mb:.2f} MB")
    print(f"equipos: {len(equipos)} ({con_foto_eq} con foto)")
    print(f"ordenes: {len(ordenes)}, planes: {len(planes)}, repuestos: {len(repuestos)}, tecnicos: {len(tecnicos)}")


if __name__ == "__main__":
    main()
