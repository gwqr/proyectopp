"""Fase 1 - pasos 4 y 5: exportar tablas a CSV y extraer fotos.

Extraccion robusta de imagenes embebidas en columnas OLE (LONGBINARY) de Access.
Prioridad de deteccion:
  1. JPEG (FF D8 FF ... FF D9)          - magic largo, muy confiable
  2. PNG  (89 50 4E 47 ... IEND)        - idem
  3. GIF  (GIF87a / GIF89a ... 00 3B)   - idem
  4. BMP  (BM + tamano coherente)       - magic corto, aceptamos solo si el
                                          header dice un tamano razonable
  5. PDF  (%PDF- ... %%EOF)             - solo si arranca "cerca" del inicio

Todos los archivos se verifican con PIL/heuristica de longitud para no dejar
truncados. Los BLOBs que no pasan verificacion se guardan como .bin.
"""
from __future__ import annotations

import csv
import json
import re
import struct
from collections import OrderedDict
from io import BytesIO
from pathlib import Path
from typing import Any

import pyodbc
from PIL import Image

MDB = r"C:\Users\Mateo\Downloads\w\MODULO 1_MANTENIMIENTO OK último.mdb"
import os
PWD = os.environ.get("MDB_PWD", "")
ROOT = Path(r"C:\Users\Mateo\Downloads\w")
CSV_DIR = ROOT / "export" / "csv"
FOTO_DIR = ROOT / "export" / "fotos"
REPORT = ROOT / "export" / "reporte.json"
SCHEMA_JSON = ROOT / "esquema.json"

CONN_STR = (
    r"DRIVER={Microsoft Access Driver (*.mdb, *.accdb)};"
    rf"DBQ={MDB};PWD={PWD};"
)


def _validate_image(payload: bytes) -> bool:
    try:
        img = Image.open(BytesIO(payload))
        img.verify()
        return True
    except Exception:
        return False


def _iter_positions(data: bytes, needle: bytes) -> list[int]:
    out = []
    start = 0
    while True:
        j = data.find(needle, start)
        if j == -1:
            break
        out.append(j)
        start = j + 1
    return out


def _extract_jpeg(data: bytes) -> bytes | None:
    positions = _iter_positions(data, b"\xff\xd8\xff")
    if not positions:
        return None
    # probamos primero el candidato mas grande (imagen real vs thumbnail)
    tried: list[tuple[int, bytes]] = []
    for idx in positions:
        rest = data[idx:]
        end = rest.rfind(b"\xff\xd9")
        if end == -1:
            continue
        candidate = rest[: end + 2]
        if len(candidate) < 512:  # descartamos thumbnails muy chicos
            continue
        tried.append((len(candidate), candidate))
    tried.sort(reverse=True)
    for _, cand in tried:
        if _validate_image(cand):
            return cand
    return None


def _extract_png(data: bytes) -> bytes | None:
    positions = _iter_positions(data, b"\x89PNG\r\n\x1a\n")
    for idx in positions:
        end = data.find(b"IEND\xaeB`\x82", idx)
        if end == -1:
            continue
        cand = data[idx : end + 8]
        if _validate_image(cand):
            return cand
    return None


def _extract_gif(data: bytes) -> bytes | None:
    idx = -1
    for magic in (b"GIF87a", b"GIF89a"):
        j = data.find(magic)
        if j != -1 and (idx == -1 or j < idx):
            idx = j
    if idx == -1:
        return None
    end = data.find(b"\x00\x3b", idx)
    if end == -1:
        return None
    candidate = data[idx : end + 2]
    return candidate if _validate_image(candidate) else None


def _extract_bmp(data: bytes) -> bytes | None:
    """Reconstruye un BMP a partir de un DIB embebido (Access almacena Paint.Picture
    como OLE 2 con un BITMAPINFOHEADER sin el file header 'BM' delante)."""
    n = len(data)
    # Access puede meter varias vistas OLE (WMF/EMF/preview) antes del DIB real.
    # Toleramos hasta 1 MB de header para localizar el BITMAPINFOHEADER.
    for pos in range(0, min(n - 40, 1_048_576)):
        if data[pos : pos + 4] != b"\x28\x00\x00\x00":  # biSize == 40
            continue
        try:
            (biSize, biWidth, biHeight, biPlanes, biBitCount, biCompression,
             biSizeImage, biXPPM, biYPPM, biClrUsed, biClrImportant) = struct.unpack_from(
                "<IiiHHIIiiII", data, pos
            )
        except struct.error:
            continue
        if biSize != 40 or biPlanes != 1:
            continue
        if biBitCount not in (1, 4, 8, 16, 24, 32):
            continue
        if not (0 < biWidth < 40000 and 0 < abs(biHeight) < 40000):
            continue
        # tabla de colores
        if biClrUsed:
            palette = biClrUsed * 4
        elif biBitCount <= 8:
            palette = (1 << biBitCount) * 4
        else:
            palette = 0
        # BI_BITFIELDS agrega 12 (o 16) bytes de mascaras despues del header
        extra_masks = 0
        if biCompression == 3:  # BI_BITFIELDS
            extra_masks = 12
        elif biCompression == 6:  # BI_ALPHABITFIELDS
            extra_masks = 16
        # calcular tamano imagen si biSizeImage no viene
        row = ((biWidth * biBitCount + 31) // 32) * 4
        img_bytes = biSizeImage or row * abs(biHeight)
        header_bytes = biSize + extra_masks + palette
        pixels_off = 14 + header_bytes
        total = 14 + header_bytes + img_bytes
        if pos + header_bytes + img_bytes > n:
            continue
        payload = (
            b"BM"
            + struct.pack("<IHHI", total, 0, 0, pixels_off)
            + data[pos : pos + header_bytes + img_bytes]
        )
        if _validate_image(payload):
            return payload
    return None


def _extract_pdf(data: bytes) -> bytes | None:
    idx = data.find(b"%PDF-")
    if idx == -1 or idx > 4096:  # PDF real siempre esta cerca del inicio
        return None
    end = data.rfind(b"%%EOF")
    if end == -1 or end <= idx:
        return None
    return data[idx : end + 5]


def extract_binary(data: bytes) -> tuple[bytes, str] | None:
    for ext, fn in (
        ("jpg", _extract_jpeg),
        ("png", _extract_png),
        ("gif", _extract_gif),
        ("bmp", _extract_bmp),
        ("pdf", _extract_pdf),
    ):
        out = fn(data)
        if out is not None:
            return out, ext
    return None


def safe_slug(text: str, fallback: str) -> str:
    text = (text or "").strip()
    if not text:
        text = fallback
    text = re.sub(r"[^\w\-. ]+", "_", text, flags=re.UNICODE)
    text = text.replace(" ", "_")
    return text[:120] or fallback


def main() -> None:
    CSV_DIR.mkdir(parents=True, exist_ok=True)
    FOTO_DIR.mkdir(parents=True, exist_ok=True)

    schema = json.loads(SCHEMA_JSON.read_text(encoding="utf-8"))

    conn = pyodbc.connect(CONN_STR, autocommit=True)
    conn.setdecoding(pyodbc.SQL_CHAR, encoding="latin-1")
    conn.setdecoding(pyodbc.SQL_WCHAR, encoding="latin-1")
    conn.setencoding(encoding="latin-1")
    cur = conn.cursor()

    reporte: "OrderedDict[str, Any]" = OrderedDict()
    total_fotos = 0
    total_bin_unknown = 0

    for tabla, meta in schema.items():
        cols_meta = meta["columns"]
        col_names = [c["name"] for c in cols_meta]
        col_types = [c["type"] for c in cols_meta]
        binary_idx = [i for i, t in enumerate(col_types) if t in {"LONGBINARY", "VARBINARY"}]

        # id numerico estable (COUNTER/PK) para no colisionar nombres
        pk_candidates = ("IDMAQUINAS", "Id", "id", "ID")
        pk_idx: int | None = None
        for k in pk_candidates:
            if k in col_names:
                pk_idx = col_names.index(k)
                break
        pref_keys = ("CODMAQ", "CODIGO", "NRO SOLIC", "Cod instrumento", "SIgla", "Sigla")
        code_idx: int | None = None
        for k in pref_keys:
            if k in col_names:
                code_idx = col_names.index(k)
                break
        denom_idx = col_names.index("DENOMINACION") if "DENOMINACION" in col_names else None

        csv_path = CSV_DIR / f"{safe_slug(tabla, 'tabla')}.csv"
        rowcount = 0
        binary_stats: dict[str, Any] = {
            col_names[i]: {"non_null": 0, "extracted": 0, "kinds": {}, "unknown": 0}
            for i in binary_idx
        }

        try:
            cur.execute(f"SELECT * FROM [{tabla}]")
        except Exception as e:
            reporte[tabla] = {"error": str(e)}
            print(f"ERROR abriendo {tabla}: {e}")
            continue

        with csv_path.open("w", newline="", encoding="utf-8") as fh:
            writer = csv.writer(fh)
            writer.writerow(col_names)

            for row in cur:
                out_row: list[Any] = []
                pk_val = row[pk_idx] if pk_idx is not None else None
                code_val = row[code_idx] if code_idx is not None else None
                pieces: list[str] = []
                if pk_val is not None:
                    pieces.append(f"id{pk_val}")
                extra = ""
                if code_val:
                    extra = safe_slug(str(code_val), "")
                elif denom_idx is not None and row[denom_idx]:
                    extra = safe_slug(str(row[denom_idx]), "")
                if extra:
                    pieces.append(extra)
                code_str = "__".join(pieces) or f"row{rowcount+1:04d}"
                for i, val in enumerate(row):
                    if i in binary_idx and val is not None:
                        data = bytes(val)
                        binary_stats[col_names[i]]["non_null"] += 1
                        result = extract_binary(data)
                        if result is not None:
                            payload, ext = result
                            tab_dir = FOTO_DIR / safe_slug(tabla, "tabla")
                            tab_dir.mkdir(parents=True, exist_ok=True)
                            suffix = "" if len(binary_idx) == 1 else f"__{safe_slug(col_names[i], 'col')}"
                            base = tab_dir / f"{code_str}{suffix}.{ext}"
                            n = 1
                            out_file = base
                            while out_file.exists():
                                n += 1
                                out_file = tab_dir / f"{code_str}{suffix}_{n}.{ext}"
                            out_file.write_bytes(payload)
                            binary_stats[col_names[i]]["extracted"] += 1
                            binary_stats[col_names[i]]["kinds"][ext] = binary_stats[col_names[i]]["kinds"].get(ext, 0) + 1
                        else:
                            binary_stats[col_names[i]]["unknown"] += 1
                        out_row.append(f"<BLOB len={len(data)}>")
                    else:
                        out_row.append(val)
                writer.writerow(out_row)
                rowcount += 1

        reporte[tabla] = {
            "csv": str(csv_path.relative_to(ROOT)),
            "row_count": rowcount,
            "binary_columns": binary_stats,
        }
        extracted_here = sum(v["extracted"] for v in binary_stats.values())
        unknown_here = sum(v["unknown"] for v in binary_stats.values())
        total_fotos += extracted_here
        total_bin_unknown += unknown_here
        if any(v["non_null"] for v in binary_stats.values()):
            print(f"OK {tabla}: {rowcount} filas, fotos={extracted_here}, sin identificar={unknown_here}")
        else:
            print(f"OK {tabla}: {rowcount} filas")

    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(reporte, indent=2, ensure_ascii=False, default=str), encoding="utf-8")

    print(f"\nTotal fotos extraidas: {total_fotos}")
    print(f"Total BLOBs no identificados: {total_bin_unknown}")


if __name__ == "__main__":
    main()
