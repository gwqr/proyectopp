"""Volcar los primeros bytes y estructura de BLOBs no identificados."""
from __future__ import annotations

import pyodbc

MDB = r"C:\Users\Mateo\Downloads\w\MODULO 1_MANTENIMIENTO OK último.mdb"
import os
PWD = os.environ.get("MDB_PWD", "")

CONN_STR = (
    r"DRIVER={Microsoft Access Driver (*.mdb, *.accdb)};"
    rf"DBQ={MDB};PWD={PWD};"
)


def hex_head(b: bytes, n: int = 96) -> str:
    return " ".join(f"{x:02x}" for x in b[:n])


def strings_head(b: bytes, n: int = 200) -> str:
    ascii_chars = bytes(c if 32 <= c < 127 else ord(".") for c in b[:n])
    return ascii_chars.decode("latin-1", errors="replace")


def main() -> None:
    conn = pyodbc.connect(CONN_STR, autocommit=True)
    conn.setdecoding(pyodbc.SQL_CHAR, encoding="latin-1")
    conn.setdecoding(pyodbc.SQL_WCHAR, encoding="latin-1")
    conn.setencoding(encoding="latin-1")
    cur = conn.cursor()

    # Un solo blob de MAQUINA que no salio
    rows = cur.execute(
        "SELECT [CODMAQ], [IMAGEN] FROM [1-001 MAQUINA] WHERE [IMAGEN] IS NOT NULL"
    ).fetchall()
    for k, b in rows[:3]:
        data = bytes(b)
        print(f"--- CODMAQ={k!r} len={len(data)} ---")
        print("head:", hex_head(data))
        print("ascii:", strings_head(data))
        # buscar todos los magic
        for name, magic in [
            ("JPG", b"\xff\xd8\xff"),
            ("PNG", b"\x89PNG"),
            ("BMP", b"BM"),
            ("PDF", b"%PDF"),
            ("WMF", b"\xd7\xcd\xc6\x9a"),
            ("EMF", b"\x01\x00\x00\x00"),
            ("DIB(BITMAPINFOHEADER=0x28)", b"\x28\x00\x00\x00"),
        ]:
            idx = data.find(magic)
            if idx != -1:
                print(f"  {name} at offset {idx}")
        print()


if __name__ == "__main__":
    main()
