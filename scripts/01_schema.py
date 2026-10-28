"""Fase 1 - paso 3: extraer esquema del MDB a esquema.md y esquema.json."""
from __future__ import annotations

import json
from collections import OrderedDict
from pathlib import Path

import pyodbc

MDB = r"C:\Users\Mateo\Downloads\w\MODULO 1_MANTENIMIENTO OK último.mdb"
import os
PWD = os.environ.get("MDB_PWD", "")
OUT_DIR = Path(r"C:\Users\Mateo\Downloads\w")
OUT_JSON = OUT_DIR / "esquema.json"
OUT_MD = OUT_DIR / "esquema.md"

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

    tables: list[str] = []
    for row in cur.tables(tableType="TABLE"):
        name = row.table_name
        if name.startswith("MSys") or name.startswith("~"):
            continue
        tables.append(name)
    tables.sort()

    schema: "OrderedDict[str, dict]" = OrderedDict()

    for t in tables:
        cols = []
        for c in cur.columns(table=t):
            cols.append(
                {
                    "name": c.column_name,
                    "type": c.type_name,
                    "size": c.column_size,
                    "nullable": bool(c.nullable),
                    "default": c.column_def,
                    "ordinal": c.ordinal_position,
                }
            )
        cols.sort(key=lambda x: x["ordinal"] or 0)

        pks = []
        try:
            for p in cur.primaryKeys(table=t):
                pks.append({"column": p.column_name, "key_seq": p.key_seq})
        except pyodbc.Error:
            pass

        fks = []
        try:
            for f in cur.foreignKeys(table=t):
                fks.append(
                    {
                        "fk_column": f.fkcolumn_name,
                        "pk_table": f.pktable_name,
                        "pk_column": f.pkcolumn_name,
                    }
                )
        except pyodbc.Error:
            pass

        try:
            cnt = cur.execute(f"SELECT COUNT(*) FROM [{t}]").fetchone()[0]
        except Exception as e:  # pragma: no cover
            cnt = f"ERROR: {e}"

        schema[t] = {
            "columns": cols,
            "primary_keys": pks,
            "foreign_keys": fks,
            "row_count": cnt,
        }

    OUT_JSON.write_text(json.dumps(schema, indent=2, ensure_ascii=False, default=str), encoding="utf-8")

    lines = ["# Esquema de la base MDB", ""]
    lines.append(f"Tablas: **{len(schema)}**  ")
    total = sum((v["row_count"] if isinstance(v["row_count"], int) else 0) for v in schema.values())
    lines.append(f"Registros totales: **{total:,}**")
    lines.append("")

    lines.append("## Resumen por tabla")
    lines.append("")
    lines.append("| Tabla | Columnas | Registros | PK |")
    lines.append("| --- | ---: | ---: | --- |")
    for t, meta in schema.items():
        pk = ", ".join(p["column"] for p in meta["primary_keys"]) or "-"
        lines.append(f"| {t} | {len(meta['columns'])} | {meta['row_count']} | {pk} |")
    lines.append("")

    for t, meta in schema.items():
        lines.append(f"### `{t}`  ({meta['row_count']} filas)")
        lines.append("")
        lines.append("| # | Columna | Tipo | Tam | Null | Default |")
        lines.append("| ---: | --- | --- | ---: | :---: | --- |")
        for c in meta["columns"]:
            null = "SI" if c["nullable"] else "NO"
            lines.append(
                f"| {c['ordinal']} | {c['name']} | {c['type']} | {c['size']} | {null} | {c['default'] or ''} |"
            )
        if meta["primary_keys"]:
            lines.append("")
            lines.append("**PK:** " + ", ".join(p["column"] for p in meta["primary_keys"]))
        if meta["foreign_keys"]:
            lines.append("")
            lines.append("**FK:**")
            for f in meta["foreign_keys"]:
                lines.append(f"- {f['fk_column']} -> {f['pk_table']}({f['pk_column']})")
        lines.append("")

    OUT_MD.write_text("\n".join(lines), encoding="utf-8")

    print(f"Tablas: {len(schema)}")
    print(f"Registros totales: {total}")
    print(f"esquema.json y esquema.md escritos en {OUT_DIR}")


if __name__ == "__main__":
    main()
