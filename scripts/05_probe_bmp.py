"""Chequear el filesize declarado por cada BMP dentro de los BLOBs y ver si
podemos usarlo con una tolerancia razonable."""
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


def main() -> None:
    conn = pyodbc.connect(CONN_STR, autocommit=True)
    conn.setdecoding(pyodbc.SQL_CHAR, encoding="latin-1")
    conn.setdecoding(pyodbc.SQL_WCHAR, encoding="latin-1")
    conn.setencoding(encoding="latin-1")
    cur = conn.cursor()

    for tbl, col in [
        ("1-001 MAQUINA", "IMAGEN"),
        ("09-REGISTRO DE DEFINICION MANTENIM PREVENTIVOS", "GRAFICO"),
    ]:
        rows = cur.execute(f"SELECT [{col}] FROM [{tbl}] WHERE [{col}] IS NOT NULL").fetchall()
        print(f"\n### {tbl}.{col} (n={len(rows)})")
        for i, (b,) in enumerate(rows[:6]):
            data = bytes(b)
            # busco todos los "BM" y verifico consistencia
            reports = []
            start = 0
            while True:
                idx = data.find(b"BM", start)
                if idx == -1 or idx + 14 > len(data):
                    break
                size = struct.unpack_from("<I", data, idx + 2)[0]
                offbits = struct.unpack_from("<I", data, idx + 10)[0]
                # y el DIB header size que sigue
                if idx + 18 <= len(data):
                    dib_size = struct.unpack_from("<I", data, idx + 14)[0]
                else:
                    dib_size = -1
                reports.append((idx, size, offbits, dib_size, len(data) - idx))
                start = idx + 2
                if len(reports) >= 5:
                    break
            print(f"  blob#{i} len={len(data)} BMs={reports}")


if __name__ == "__main__":
    main()
