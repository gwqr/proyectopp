"""Inspeccionar los primeros bytes de los BLOBs que no pudimos identificar."""
from __future__ import annotations

import pyodbc

MDB = r"C:\Users\Mateo\Downloads\w\MODULO 1_MANTENIMIENTO OK último.mdb"
import os
PWD = os.environ.get("MDB_PWD", "")

CONN_STR = (
    r"DRIVER={Microsoft Access Driver (*.mdb, *.accdb)};"
    rf"DBQ={MDB};PWD={PWD};"
)

TARGETS = [
    ("1-001 MAQUINA", "IMAGEN", "CODMAQ"),
    ("09-REGISTRO DE DEFINICION MANTENIM PREVENTIVOS", "GRAFICO", "CODMAQ"),
    ("33-ACTIVIDADES DE TALLER", "IMAGENES", "Id"),
    ("Copia de 10-REGISTRO DE LOS MANTENIMIENTOS", "Imagen om", "NRO SOLIC"),
]

MAGIC = [
    (b"\xff\xd8\xff", "jpg"),
    (b"\x89PNG\r\n\x1a\n", "png"),
    (b"GIF87a", "gif"),
    (b"GIF89a", "gif"),
    (b"BM", "bmp"),
    (b"%PDF-", "pdf"),
]


def find_magic(data: bytes) -> tuple[int, str] | None:
    for magic, ext in MAGIC:
        idx = data.find(magic)
        if idx != -1:
            return idx, ext
    return None


def sniff(data: bytes) -> str:
    if data.startswith(b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1"):
        return "OLE compound (StorageFile)"
    if data.startswith(b"\x15\x1c\x2f\x00"):
        return "Access-legacy OLE header"
    if data[:2] == b"\x01\x05":
        return "OLE 1.0 stream"
    if b"Package" in data[:200]:
        return "OLE Package"
    return "unknown"


def main() -> None:
    conn = pyodbc.connect(CONN_STR, autocommit=True)
    conn.setdecoding(pyodbc.SQL_CHAR, encoding="latin-1")
    conn.setdecoding(pyodbc.SQL_WCHAR, encoding="latin-1")
    conn.setencoding(encoding="latin-1")
    cur = conn.cursor()

    for tabla, col, key in TARGETS:
        print(f"\n=== {tabla} :: {col} ===")
        try:
            rows = cur.execute(f"SELECT [{key}], [{col}] FROM [{tabla}] WHERE [{col}] IS NOT NULL").fetchall()
        except Exception as e:
            print("  ERR:", e)
            continue
        misses = 0
        for k, b in rows:
            data = bytes(b)
            found = find_magic(data)
            if not found:
                misses += 1
                if misses <= 6:
                    head = data[:64].hex()
                    print(f"  key={k!r} len={len(data)} head={head}  ({sniff(data)})")
        print(f"  total_no_null={len(rows)}  no_magic={misses}")


if __name__ == "__main__":
    main()
