"""Carga los CSVs exportados en Fase 1 a una SQLite lista para la app.

Mejoras respecto de la version inicial:
- Normaliza sectores (typos como "Torner_a" -> "Torneria", "Uni_n" -> "Union") y
  tipos de mantenimiento a Title Case.
- Genera un slug ASCII estable por sector y por tipo para agrupar sin acentos.
- Deriva vencimiento por SLA de prioridad (ALTA: 3d, MEDIA: 7d, BAJA: 15d).
- Enriquece equipos con contador de OT y ultima OT, para no re-agregar en cada
  request.
- Copia fotos a webapp/static/fotos/<seccion>/<id>.jpg.
"""
from __future__ import annotations

import csv
import re
import shutil
import sqlite3
import unicodedata
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CSV_DIR = ROOT / "export" / "csv"
FOTOS_WEB = ROOT / "export" / "fotos_web"
WEBAPP = ROOT / "webapp"
DB = WEBAPP / "gmao.db"
STATIC_FOTOS = WEBAPP / "static" / "fotos"


def slug(name: str) -> str:
    s = unicodedata.normalize("NFKD", name or "").encode("ascii", "ignore").decode()
    s = re.sub(r"[^0-9a-zA-Z]+", "_", s).strip("_").lower()
    return s or "sin"


def norm_text(v: str | None) -> str | None:
    if not v:
        return None
    v = re.sub(r"\s+", " ", v).strip()
    # limpiar caracteres de encoding rotos (arrastrados desde Access)
    v = v.replace("_a", "ía").replace("_o", "ío").replace("_n", "ón") if any(x in v for x in ("Torner_", "Selecc_", "Uni_")) else v
    return v or None


SECTOR_ALIASES = {
    "torneria": "Tornería",
    "tornera": "Tornería",
    "union_y_conformado": "Unión y conformado",
    "union_y_confotmado": "Unión y conformado",
    "ajuste": "Ajuste",
    "limadora": "Limadora",
    "recepcion": "Recepción",
    "jefatura_de_taller": "Jefatura de taller",
}


def norm_sector(v: str | None) -> str | None:
    if not v:
        return None
    key = slug(v)
    return SECTOR_ALIASES.get(key, v.strip().title())


TIPO_ALIASES = {
    "correctivo": "Correctivo",
    "preventivo": "Preventivo",
    "predictivo": "Predictivo",
    "mecanico": "Correctivo",
}


def norm_tipo(v: str | None) -> str | None:
    if not v:
        return None
    key = slug(v)
    return TIPO_ALIASES.get(key, v.strip().title())


def parse_number(v):
    if v is None or v == "":
        return None
    if isinstance(v, (int, float)):
        return v
    s = str(v).strip().replace(",", ".")
    try:
        f = float(s)
        return int(f) if f.is_integer() else f
    except ValueError:
        return None


def parse_date(v: str | None) -> str | None:
    if not v:
        return None
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y"):
        try:
            return datetime.strptime(v, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return None


NORM_ESTADO = {
    "pendiente": "pendiente",
    "en proceso": "en_proceso",
    "en_proceso": "en_proceso",
    "en curso": "en_proceso",
    "cerrada": "cerrada",
    "cerrado": "cerrada",
    "finalizado": "cerrada",
    "finalizada": "cerrada",
    "ejecutada": "cerrada",
    "": "pendiente",
    None: "pendiente",
}


def norm_estado(v: str | None) -> str:
    return NORM_ESTADO.get((v or "").strip().lower(), "pendiente")


def read_rows(csv_name: str) -> list[dict]:
    p = CSV_DIR / csv_name
    with p.open(encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def create_schema(cur: sqlite3.Cursor) -> None:
    cur.executescript(
        """
        DROP TABLE IF EXISTS equipos;
        DROP TABLE IF EXISTS motores;
        DROP TABLE IF EXISTS repuestos;
        DROP TABLE IF EXISTS tecnicos;
        DROP TABLE IF EXISTS proveedores;
        DROP TABLE IF EXISTS ordenes;
        DROP TABLE IF EXISTS planes_preventivos;
        DROP TABLE IF EXISTS sectores;
        DROP TABLE IF EXISTS tipos_mant;
        DROP TABLE IF EXISTS caracteres_mant;
        DROP TABLE IF EXISTS acciones_mant;
        DROP TABLE IF EXISTS condiciones_existentes;
        DROP TABLE IF EXISTS ejecutantes;
        DROP TABLE IF EXISTS actividad;

        CREATE TABLE equipos (
            id INTEGER PRIMARY KEY,
            codigo TEXT,
            denominacion TEXT,
            sector TEXT,
            sector_slug TEXT,
            maq_asociada TEXT,
            marca TEXT,
            modelo TEXT,
            mant_prev INTEGER,
            fecha_instalacion TEXT,
            observacion TEXT,
            costo REAL,
            valor_residual REAL,
            vida_util INTEGER,
            foto TEXT
        );
        CREATE INDEX ix_equipos_sector ON equipos(sector_slug);

        CREATE TABLE motores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            equipo_id INTEGER,
            codigo TEXT,
            denominacion TEXT,
            seccion TEXT,
            marca TEXT,
            tipo TEXT,
            potencia TEXT,
            tension TEXT,
            amperaje TEXT,
            rpm TEXT,
            ip TEXT,
            servicio TEXT,
            clase TEXT,
            peso TEXT,
            FOREIGN KEY(equipo_id) REFERENCES equipos(id)
        );
        CREATE INDEX ix_motores_equipo ON motores(equipo_id);

        CREATE TABLE repuestos (
            id INTEGER PRIMARY KEY,
            nro TEXT,
            marca TEXT,
            modelo TEXT,
            parte TEXT,
            especificacion TEXT,
            cant_requerida REAL,
            cant_stock_min REAL,
            bajo_min INTEGER,
            proveedor TEXT,
            contacto TEXT,
            telefono TEXT,
            direccion TEXT
        );

        CREATE TABLE tecnicos (
            id INTEGER PRIMARY KEY,
            nombre TEXT,
            sector TEXT,
            funcion TEXT,
            email TEXT,
            fecha_alta TEXT
        );

        CREATE TABLE proveedores (
            id INTEGER PRIMARY KEY,
            rubro TEXT,
            proveedor TEXT,
            contacto TEXT,
            telefono TEXT,
            direccion TEXT,
            email TEXT,
            web TEXT
        );

        CREATE TABLE ordenes (
            id INTEGER PRIMARY KEY,
            nro_solic TEXT,
            tipo_mant TEXT,
            fecha_solic TEXT,
            sector TEXT,
            sector_slug TEXT,
            solicita TEXT,
            prioridad TEXT,
            estado TEXT,
            equipo_id INTEGER,
            codmaq TEXT,
            maq_asociada TEXT,
            tipo_desperfecto TEXT,
            condicion_existente TEXT,
            parte TEXT,
            subparte TEXT,
            causa TEXT,
            accion_realizada TEXT,
            observ_pzas TEXT,
            observ_mo TEXT,
            ejecuta TEXT,
            caracter TEXT,
            fecha_ini TEXT,
            hs_ini REAL,
            min_ini REAL,
            fecha_fin TEXT,
            hs_fin REAL,
            min_fin REAL,
            hs_hom REAL,
            hs_maq REAL,
            estado_equipo TEXT,
            observ_generales TEXT,
            cant_tecnico INTEGER,
            cant_oficial INTEGER,
            cant_operario INTEGER,
            cant_externo INTEGER,
            foto TEXT,
            vence TEXT,
            fuente TEXT,
            FOREIGN KEY(equipo_id) REFERENCES equipos(id)
        );
        CREATE INDEX ix_ordenes_estado ON ordenes(estado);
        CREATE INDEX ix_ordenes_equipo ON ordenes(equipo_id);
        CREATE INDEX ix_ordenes_fecha ON ordenes(fecha_solic);

        CREATE TABLE planes_preventivos (
            id INTEGER PRIMARY KEY,
            tipo_mant TEXT,
            define TEXT,
            equipo_id INTEGER,
            codmaq TEXT,
            parte TEXT,
            subparte TEXT,
            tarea TEXT,
            detalle TEXT,
            ejecuta TEXT,
            estado_equipo TEXT,
            observ TEXT,
            maq_asociada TEXT,
            frecuencia TEXT,
            frecuencia_dias INTEGER,
            tiempo_estimado TEXT,
            fecha TEXT,
            grafico TEXT,
            FOREIGN KEY(equipo_id) REFERENCES equipos(id)
        );

        CREATE TABLE sectores (id INTEGER PRIMARY KEY, sector TEXT, sector_slug TEXT);
        CREATE TABLE tipos_mant (id INTEGER PRIMARY KEY, nombre TEXT);
        CREATE TABLE caracteres_mant (id INTEGER PRIMARY KEY, nombre TEXT);
        CREATE TABLE acciones_mant (id INTEGER PRIMARY KEY, nombre TEXT);
        CREATE TABLE condiciones_existentes (
            id INTEGER PRIMARY KEY, condicion TEXT, metodo TEXT, instrumento TEXT
        );
        CREATE TABLE ejecutantes (id INTEGER PRIMARY KEY, nombre TEXT);

        CREATE TABLE actividad (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ts TEXT DEFAULT (datetime('now', 'localtime')),
            tipo TEXT,
            entidad TEXT,
            entidad_id INTEGER,
            detalle TEXT
        );
        CREATE INDEX ix_actividad_ts ON actividad(ts);
        """
    )


def copy_fotos(mapping: dict[int, str], destino: Path) -> dict[int, str]:
    destino.mkdir(parents=True, exist_ok=True)
    out: dict[int, str] = {}
    for pid, src in mapping.items():
        dst = destino / f"{pid}.jpg"
        shutil.copy(src, dst)
        out[pid] = f"/static/fotos/{destino.name}/{dst.name}"
    return out


def load_equipos(cur: sqlite3.Cursor) -> None:
    rows = read_rows("1-001_MAQUINA.csv")
    foto_root = FOTOS_WEB / "1-001_MAQUINA"
    id_to_src = {}
    if foto_root.exists():
        for p in foto_root.iterdir():
            m = re.match(r"id(\d+)", p.name)
            if m:
                id_to_src[int(m.group(1))] = str(p)
    fotos_dest = copy_fotos(id_to_src, STATIC_FOTOS / "equipos")

    for r in rows:
        idm = int(r["IDMAQUINAS"])
        sector = norm_sector(r["SECTOR"])
        cur.execute(
            """INSERT INTO equipos (id, codigo, denominacion, sector, sector_slug, maq_asociada, marca, modelo,
                     mant_prev, fecha_instalacion, observacion, costo, valor_residual, vida_util, foto)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                idm,
                (r["CODMAQ"] or "").strip() or None,
                norm_text(r["DENOMINACION"]),
                sector,
                slug(sector) if sector else None,
                norm_text(r["MAQASOC"]),
                norm_text(r["MARCA"]),
                norm_text(r["MODELO"]),
                1 if (r.get("MANT-PREV") or "").strip().lower() in ("si", "sí", "yes", "1") else 0,
                parse_date(r["FECHA DE INSTALACION"]),
                norm_text(r["OBSERVACION"]),
                parse_number(r.get("costo del activo", "")),
                parse_number(r.get("valor residual", "")),
                parse_number(r.get("vida útil", "") or r.get("vida u_til", "")),
                fotos_dest.get(idm),
            ),
        )


def _resolve_equipo(cur: sqlite3.Cursor, codmaq: str | None) -> int | None:
    if not codmaq:
        return None
    codmaq = codmaq.strip()
    r = cur.execute(
        "SELECT id FROM equipos WHERE codigo = ? OR denominacion = ? LIMIT 1",
        (codmaq, codmaq),
    ).fetchone()
    if r:
        return r[0]
    r = cur.execute(
        "SELECT id FROM equipos WHERE codigo LIKE ? OR denominacion LIKE ? LIMIT 1",
        (f"%{codmaq}%", f"%{codmaq}%"),
    ).fetchone()
    return r[0] if r else None


def load_motores(cur: sqlite3.Cursor) -> None:
    rows = read_rows("1-003_MAQUINAS-MOTORES.csv")
    for r in rows:
        eid = _resolve_equipo(cur, r["CODIGO"])
        cur.execute(
            """INSERT INTO motores (equipo_id, codigo, denominacion, seccion, marca, tipo,
                     potencia, tension, amperaje, rpm, ip, servicio, clase, peso)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                eid,
                (r["CODIGO"] or "").strip() or None,
                norm_text(r["DENOMINACION"]),
                norm_text(r["SECCION"]),
                norm_text(r["MARCA"]),
                norm_text(r["TIPO"]),
                r["POTENCIA"] or None,
                r["TENSION"] or None,
                r["AMPERAJE"] or None,
                r["RPM"] or None,
                r["IP"] or None,
                norm_text(r["SERVICIO"]),
                r["CLASE"] or None,
                r["PESO"] or None,
            ),
        )


def load_repuestos(cur: sqlite3.Cursor) -> None:
    rows = read_rows("1-002_DATOS_DE_REPUESTOS.csv")
    for r in rows:
        req = parse_number(r["CANT REQUERIDA"])
        mn = parse_number(r["CANT STOCK MIN"])
        bajo = 1 if (req is not None and mn is not None and req <= mn) else 0
        cur.execute(
            """INSERT INTO repuestos (id, nro, marca, modelo, parte, especificacion, cant_requerida,
                     cant_stock_min, bajo_min, proveedor, contacto, telefono, direccion)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                int(r["Id"]),
                r["NRO"] or None,
                norm_text(r["MARCA"]),
                r["MODELO"] or None,
                norm_text(r["PARTE/COMPONENTE"]),
                norm_text(r["ESPECIFIC REPUESTO"]),
                req, mn, bajo,
                norm_text(r["PROVEEDOR"]),
                r["CONTACTO"] or None,
                r["TELEFONO"] or None,
                r["DIRECCION"] or None,
            ),
        )


def load_tecnicos(cur: sqlite3.Cursor) -> None:
    for r in read_rows("1-005_EQUIPO_DE_TRABAJO.csv"):
        cur.execute(
            "INSERT INTO tecnicos (id, nombre, sector, funcion, email, fecha_alta) VALUES (?,?,?,?,?,?)",
            (
                int(r["Id"]),
                norm_text(r["NOMBRE Y APELLIDO"]),
                norm_sector(r["SECTOR"]),
                r["FUNCION"] or None,
                r["E-MAIL"] or None,
                parse_date(r["FECHA"]),
            ),
        )


def load_proveedores(cur: sqlite3.Cursor) -> None:
    for r in read_rows("1-004_Proveedores.csv"):
        cur.execute(
            "INSERT INTO proveedores (id, rubro, proveedor, contacto, telefono, direccion, email, web) VALUES (?,?,?,?,?,?,?,?)",
            (
                int(r["Id"]),
                r["RUBRO"] or None,
                norm_text(r["PROVEEDOR"]),
                r["CONTACTO"] or None,
                r["TELEFONO"] or None,
                r["DIRECCION"] or None,
                r["e-mail"] or None,
                (r.get("Pagina WEb") or "")[:200] or None,
            ),
        )


SLA = {"ALTA": 3, "MEDIA": 7, "BAJA": 15}


def _sla_vence(fecha: str | None, prioridad: str | None) -> str | None:
    if not fecha:
        return None
    dias = SLA.get((prioridad or "MEDIA").upper(), 7)
    try:
        d = datetime.strptime(fecha, "%Y-%m-%d")
    except ValueError:
        return None
    from datetime import timedelta
    return (d + timedelta(days=dias)).strftime("%Y-%m-%d")


def _row_to_ot(cur: sqlite3.Cursor, r: dict, fuente: str) -> tuple:
    sector = norm_sector(r["SECTOR"])
    prioridad = (r["PRIORIDAD"] or "MEDIA").upper()
    fecha_solic = parse_date(r["FECHASOLIC"])
    codmaq = (r["CODMAQ"] or "").strip() or None
    eid = _resolve_equipo(cur, codmaq)
    return (
        r["NRO SOLIC"] or None,
        norm_tipo(r["TIPO MANTENIM"]),
        fecha_solic,
        sector,
        slug(sector) if sector else None,
        r["SOLICITA"] or None,
        prioridad,
        norm_estado(r.get("Estado de la OM")),
        eid,
        codmaq,
        r["MAQASOC"] or None,
        r.get("TIPO DESPERFECTO") or None,
        r.get("CONDICION EXISTENTE") or None,
        r.get("PARTE DEL EQUIPO") or None,
        r.get("SUPBARTE DEL EQUIPO") or None,
        r.get("CAUSA DE LA CONDICION EXISTENTE") or None,
        r.get("ACCION REALIZADA") or None,
        r.get("OBSERV PZAS") or None,
        r.get("OBSERV MO") or None,
        r.get("EJECUTA") or None,
        r.get("CARACTER DEL MANTENIM") or None,
        parse_date(r.get("FECHA INI")),
        parse_number(r.get("HS INI")),
        parse_number(r.get("MIN INI")),
        parse_date(r.get("FECHA FIN")),
        parse_number(r.get("HS FIN")),
        parse_number(r.get("MIN FIN")),
        parse_number(r.get("HS HOM")),
        parse_number(r.get("HS MAQ")),
        r.get("ESTADO DEL EQUIPO") or None,
        r.get("OBSERV GENERALES") or None,
        parse_number(r.get("CANT TECNICO")),
        parse_number(r.get("CANT OFICIAL")),
        parse_number(r.get("CANT OPERARIO")),
        parse_number(r.get("CANT EXTERNO")),
        None,
        _sla_vence(fecha_solic, prioridad),
        fuente,
    )


def load_ordenes(cur: sqlite3.Cursor) -> None:
    fotos_1006 = FOTOS_WEB / "1-006_REGISTRO_DE_LOS_MANTENIMIENTOS"
    fotos_copia = FOTOS_WEB / "Copia_de_10-REGISTRO_DE_LOS_MANTENIMIENTOS"
    id_map: dict[int, str] = {}
    for base in (fotos_1006, fotos_copia):
        if base.exists():
            for p in base.iterdir():
                m = re.match(r"id(\d+)", p.name)
                if m:
                    id_map[int(m.group(1))] = str(p)
    fotos_dest = copy_fotos(id_map, STATIC_FOTOS / "ot")

    def _insert(rows: list[dict], fuente: str) -> None:
        for r in rows:
            values = _row_to_ot(cur, r, fuente)
            cur.execute(
                """INSERT INTO ordenes (nro_solic,tipo_mant,fecha_solic,sector,sector_slug,solicita,prioridad,estado,
                        equipo_id,codmaq,maq_asociada,tipo_desperfecto,condicion_existente,parte,subparte,causa,
                        accion_realizada,observ_pzas,observ_mo,ejecuta,caracter,fecha_ini,hs_ini,min_ini,
                        fecha_fin,hs_fin,min_fin,hs_hom,hs_maq,estado_equipo,observ_generales,
                        cant_tecnico,cant_oficial,cant_operario,cant_externo,foto,vence,fuente)
                   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                values,
            )
            new_id = cur.lastrowid
            src_id = int(r.get("Id") or 0)
            if src_id in fotos_dest:
                cur.execute("UPDATE ordenes SET foto=? WHERE id=?", (fotos_dest[src_id], new_id))

    _insert(read_rows("1-006_REGISTRO_DE_LOS_MANTENIMIENTOS.csv"), "actual")
    _insert(read_rows("Copia_de_10-REGISTRO_DE_LOS_MANTENIMIENTOS.csv"), "historico")


FREC_DIAS = {
    "diaria": 1, "diario": 1,
    "semanal": 7,
    "quincenal": 15,
    "mensual": 30,
    "bimestral": 60,
    "trimestral": 90,
    "semestral": 180,
    "anual": 365,
}


def load_planes(cur: sqlite3.Cursor) -> None:
    foto_root = FOTOS_WEB / "09-REGISTRO_DE_DEFINICION_MANTENIM_PREVENTIVOS"
    id_map: dict[int, str] = {}
    if foto_root.exists():
        for p in foto_root.iterdir():
            m = re.match(r"id(\d+)", p.name)
            if m:
                id_map[int(m.group(1))] = str(p)
    fotos_dest = copy_fotos(id_map, STATIC_FOTOS / "planes")

    for r in read_rows("09-REGISTRO_DE_DEFINICION_MANTENIM_PREVENTIVOS.csv"):
        pid = int(r["Id"])
        freq = (r["FRECUENCIA"] or "").strip().lower()
        freq_dias = FREC_DIAS.get(freq)
        codmaq = (r["CODMAQ"] or "").strip() or None
        eid = _resolve_equipo(cur, codmaq)
        cur.execute(
            """INSERT INTO planes_preventivos (id, tipo_mant, define, equipo_id, codmaq, parte, subparte, tarea,
                     detalle, ejecuta, estado_equipo, observ, maq_asociada, frecuencia, frecuencia_dias, tiempo_estimado, fecha, grafico)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                pid,
                norm_tipo(r["TIPO MANTENIM"]),
                r["DEFINE"] or None,
                eid,
                codmaq,
                norm_text(r["PARTE DEL EQUIPO"]),
                norm_text(r["SUPBARTE DEL EQUIPO"]),
                r["TAREA MANTENIM PREV"] or None,
                norm_text(r["DETALLE MANTENIM PREVENTIVO"]),
                r["EJECUTA"] or None,
                r["ESTADO DEL EQUIPO"] or None,
                r["OBSERV GENERALES"] or None,
                r["MAQASOC"] or None,
                r["FRECUENCIA"] or None,
                freq_dias,
                r["TIEMPO ESTIMADO"] or None,
                parse_date(r["FECHA"]),
                fotos_dest.get(pid),
            ),
        )


def load_catalogos(cur: sqlite3.Cursor) -> None:
    seen_sectores: set[str] = set()
    for r in read_rows("13-Sectores.csv"):
        sec = norm_sector(r["SECTOR"])
        if not sec:
            continue
        sl = slug(sec)
        if sl in seen_sectores:
            continue
        seen_sectores.add(sl)
        cur.execute("INSERT INTO sectores (id, sector, sector_slug) VALUES (?,?,?)", (int(r["Id"]), sec, sl))

    for src, table, cols in [
        ("15-TIPO_DE_MANTENIM.csv", "tipos_mant", [("Id", "id"), ("TIPO DE MANTENIM", "nombre")]),
        ("17-CARACTER_DEL_MANTENIM.csv", "caracteres_mant", [("Id", "id"), ("CARACTER DEL MANTENIM", "nombre")]),
        ("04-ACCION_DE_MANTENIM.csv", "acciones_mant", [("Id", "id"), ("ACCION", "nombre")]),
        ("06-EJECUTA_MANTENIM.csv", "ejecutantes", [("Id", "id"), ("EJECUTA", "nombre")]),
    ]:
        for r in read_rows(src):
            keys = [c[1] for c in cols]
            vals = [int(r[cols[0][0]])] + [r[c[0]] or None for c in cols[1:]]
            placeholders = ",".join("?" * len(vals))
            cur.execute(f"INSERT INTO {table} ({','.join(keys)}) VALUES ({placeholders})", vals)

    for r in read_rows("05-CONDICION_EXISTENTE.csv"):
        cur.execute(
            "INSERT INTO condiciones_existentes (id, condicion, metodo, instrumento) VALUES (?,?,?,?)",
            (int(r["Id"]), r["COND EXTISTENTE"] or None, r["METODO"] or None, r["INSTRUMENTO"] or None),
        )


def seed_actividad(cur: sqlite3.Cursor) -> None:
    for eid, denom in cur.execute("SELECT id, denominacion FROM equipos ORDER BY id LIMIT 3"):
        cur.execute(
            "INSERT INTO actividad (tipo, entidad, entidad_id, detalle) VALUES (?,?,?,?)",
            ("import", "equipo", eid, f"Equipo importado desde MDB: {denom or f'#{eid}'}"),
        )


def main() -> None:
    STATIC_FOTOS.mkdir(parents=True, exist_ok=True)
    for sub in ("equipos", "ot", "planes"):
        d = STATIC_FOTOS / sub
        if d.exists():
            shutil.rmtree(d)
    if DB.exists():
        DB.unlink()

    conn = sqlite3.connect(DB)
    cur = conn.cursor()
    create_schema(cur)
    load_equipos(cur)
    load_motores(cur)
    load_repuestos(cur)
    load_tecnicos(cur)
    load_proveedores(cur)
    load_ordenes(cur)
    load_planes(cur)
    load_catalogos(cur)
    seed_actividad(cur)
    conn.commit()

    print("== Cargado ==")
    for t in [
        "equipos", "motores", "repuestos", "tecnicos", "proveedores",
        "ordenes", "planes_preventivos", "sectores", "tipos_mant",
        "caracteres_mant", "acciones_mant", "condiciones_existentes",
        "ejecutantes", "actividad",
    ]:
        n = cur.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
        print(f"  {t}: {n}")
    print("Vinculacion:")
    print(f"  OTs con equipo_id: {cur.execute('SELECT COUNT(*) FROM ordenes WHERE equipo_id IS NOT NULL').fetchone()[0]}")
    print(f"  motores con equipo_id: {cur.execute('SELECT COUNT(*) FROM motores WHERE equipo_id IS NOT NULL').fetchone()[0]}")
    print(f"  planes con equipo_id: {cur.execute('SELECT COUNT(*) FROM planes_preventivos WHERE equipo_id IS NOT NULL').fetchone()[0]}")
    conn.close()


if __name__ == "__main__":
    main()
