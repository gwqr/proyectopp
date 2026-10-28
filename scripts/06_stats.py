"""Stats de contenido de cada BLOB de 1-001 MAQUINA."""
from __future__ import annotations

import struct
import pyodbc

MDB = r"C:\Users\Mateo\Downloads\w\MODULO 1_MANTENIMIENTO OK último.mdb"
import os
PWD = os.environ.get("MDB_PWD", "")

CONN_STR = (
    r"DRIVER={Microsoft Access Driver (*.mdb, *.accdb)};"
    rf"DBQ={MDB};PWD={PWD};"
)


def probe(data: bytes) -> dict:
    n = len(data)
    out = {"len": n}
    # busco DIB (BITMAPINFOHEADER=40) valido
    dib_offsets = []
    limit = min(n - 40, 1_000_000)
    for pos in range(limit):
        if data[pos : pos + 4] != b"\x28\x00\x00\x00":
            continue
        try:
            biSize, biWidth, biHeight, biPlanes, biBitCount = struct.unpack_from(
                "<IiiHH", data, pos
            )
        except struct.error:
            continue
        if biSize == 40 and biPlanes == 1 and biBitCount in (1,4,8,16,24,32) \
                and 0 < biWidth < 40000 and 0 < abs(biHeight) < 40000:
            dib_offsets.append((pos, biWidth, biHeight, biBitCount))
            if len(dib_offsets) >= 4:
                break
    out["dibs"] = dib_offsets
    out["jpg"] = data.find(b"\xff\xd8\xff")
    out["png"] = data.find(b"\x89PNG")
    # header OLE Access
    out["header_ole"] = data[:20].hex()
    return out


def main() -> None:
    conn = pyodbc.connect(CONN_STR, autocommit=True)
    conn.setdecoding(pyodbc.SQL_CHAR, encoding="latin-1")
    conn.setdecoding(pyodbc.SQL_WCHAR, encoding="latin-1")
    conn.setencoding(encoding="latin-1")
    cur = conn.cursor()

    rows = cur.execute("SELECT [CODMAQ], [DENOMINACION], [IMAGEN] FROM [1-001 MAQUINA] WHERE [IMAGEN] IS NOT NULL").fetchall()
    print(f"n={len(rows)}")
    kinds = {"dib":0,"jpg":0,"png":0,"other":0}
    for cod, den, b in rows:
        data = bytes(b)
        info = probe(data)
        if info["jpg"] != -1: kind="jpg"
        elif info["png"] != -1: kind="png"
        elif info["dibs"]: kind="dib"
        else: kind="other"
        kinds[kind]+=1
        if kind=="other":
            print(f"  OTHER cod={cod!r} den={den!r} len={info['len']} head={info['header_ole']}")
    print("stats:", kinds)


if __name__ == "__main__":
    main()
