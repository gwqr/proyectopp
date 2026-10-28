"""API de la app GMAO Web.

- Se apoya en la SQLite generada por scripts/load.py (webapp/gmao.db).
- Sirve el frontend estatico como SPA en /.
- Endpoints REST bajo /api/*.
- Registra actividad (timeline) en cada mutacion.
"""
from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from datetime import date, datetime
from pathlib import Path
from typing import Any, Iterator

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

BASE = Path(__file__).resolve().parents[1]
DB = BASE / "gmao.db"
STATIC = BASE / "static"
INDEX_HTML = BASE / "templates" / "index.html"

app = FastAPI(title="GMAO Web", version="2.0.0")
app.mount("/static", StaticFiles(directory=str(STATIC)), name="static")


@contextmanager
def get_db() -> Iterator[sqlite3.Connection]:
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA foreign_keys = ON")
    try:
        yield con
    finally:
        con.close()


def rows_to_list(rows) -> list[dict]:
    return [dict(r) for r in rows]


def log_activity(cur: sqlite3.Cursor, tipo: str, entidad: str, entidad_id: int | None, detalle: str) -> None:
    cur.execute(
        "INSERT INTO actividad (tipo, entidad, entidad_id, detalle) VALUES (?,?,?,?)",
        (tipo, entidad, entidad_id, detalle),
    )


HORAS_OPERACION_ANUAL = 2112  # 8h * 22d * 12m, base para MTBF


# ------------------------- KPIs / panel --------------------------------------


def _months_range(n: int = 6) -> list[str]:
    today = date.today().replace(day=1)
    out = []
    for i in range(n - 1, -1, -1):
        y, m = today.year, today.month - i
        while m <= 0:
            m += 12
            y -= 1
        out.append(f"{y:04d}-{m:02d}")
    return out


@app.get("/api/panel")
def panel() -> dict[str, Any]:
    with get_db() as con:
        cur = con.cursor()
        totales = {
            "equipos": cur.execute("SELECT COUNT(*) FROM equipos").fetchone()[0],
            "ordenes": cur.execute("SELECT COUNT(*) FROM ordenes").fetchone()[0],
            "planes": cur.execute("SELECT COUNT(*) FROM planes_preventivos").fetchone()[0],
            "repuestos": cur.execute("SELECT COUNT(*) FROM repuestos").fetchone()[0],
            "tecnicos": cur.execute("SELECT COUNT(*) FROM tecnicos").fetchone()[0],
        }
        estados = rows_to_list(cur.execute(
            "SELECT estado, COUNT(*) AS c FROM ordenes GROUP BY estado ORDER BY c DESC"
        ))
        abiertas = cur.execute(
            "SELECT COUNT(*) FROM ordenes WHERE estado IN ('pendiente','en_proceso')"
        ).fetchone()[0]
        vencidas = cur.execute(
            """SELECT COUNT(*) FROM ordenes
                 WHERE estado IN ('pendiente','en_proceso')
                   AND vence IS NOT NULL AND date(vence) < date('now')"""
        ).fetchone()[0]

        total_planes = cur.execute("SELECT COUNT(*) FROM planes_preventivos").fetchone()[0]
        cumplidos = cur.execute(
            """SELECT COUNT(DISTINCT p.id) FROM planes_preventivos p
                 JOIN ordenes o ON o.codmaq = p.codmaq
                 WHERE o.tipo_mant LIKE 'Prevent%'"""
        ).fetchone()[0]
        cumplimiento_prev = round((cumplidos / total_planes) * 100, 1) if total_planes else 0.0

        r = cur.execute(
            """SELECT AVG(hs_hom) AS ttr FROM ordenes
                 WHERE tipo_mant LIKE 'Correct%' AND hs_hom IS NOT NULL"""
        ).fetchone()
        mttr = round(r["ttr"] or 0, 2)
        fallas = cur.execute(
            "SELECT COUNT(*) FROM ordenes WHERE tipo_mant LIKE 'Correct%' AND fecha_solic IS NOT NULL"
        ).fetchone()[0]
        mtbf = round(HORAS_OPERACION_ANUAL / fallas, 2) if fallas else None
        disponibilidad = round(mtbf / (mtbf + mttr) * 100, 2) if (mtbf and mttr) else (100.0 if mtbf else None)

        repuestos_bajo_min = rows_to_list(cur.execute(
            """SELECT id, nro, marca, parte, especificacion, cant_requerida, cant_stock_min, proveedor
                 FROM repuestos WHERE bajo_min = 1 ORDER BY parte"""
        ))

        meses = _months_range(6)
        serie = []
        for m in meses:
            corr = cur.execute(
                "SELECT COUNT(*) FROM ordenes WHERE substr(fecha_solic,1,7)=? AND tipo_mant LIKE 'Correct%'", (m,)
            ).fetchone()[0]
            prev = cur.execute(
                "SELECT COUNT(*) FROM ordenes WHERE substr(fecha_solic,1,7)=? AND tipo_mant LIKE 'Prevent%'", (m,)
            ).fetchone()[0]
            serie.append({"mes": m, "correctivo": corr, "preventivo": prev})

        por_sector = rows_to_list(cur.execute(
            """SELECT COALESCE(sector,'Sin sector') AS sector, COUNT(*) c
                 FROM ordenes GROUP BY sector ORDER BY c DESC LIMIT 8"""
        ))
        por_prioridad = rows_to_list(cur.execute(
            """SELECT COALESCE(prioridad,'MEDIA') prioridad, COUNT(*) c
                 FROM ordenes WHERE estado IN ('pendiente','en_proceso')
                 GROUP BY prioridad"""
        ))
        equipos_por_sector = rows_to_list(cur.execute(
            """SELECT COALESCE(sector,'Sin sector') sector, COUNT(*) c
                 FROM equipos GROUP BY sector ORDER BY c DESC"""
        ))

        top_equipos = rows_to_list(cur.execute(
            """SELECT e.id, e.denominacion, e.codigo, e.foto,
                      COUNT(o.id) AS n_ot
                 FROM equipos e
                 LEFT JOIN ordenes o ON o.equipo_id = e.id
                      OR o.codmaq = e.codigo OR o.codmaq = e.denominacion
                 GROUP BY e.id HAVING n_ot > 0
                 ORDER BY n_ot DESC LIMIT 5"""
        ))

        proximos = rows_to_list(cur.execute(
            """SELECT id, nro_solic, codmaq, prioridad, vence, estado
                 FROM ordenes
                 WHERE estado IN ('pendiente','en_proceso') AND vence IS NOT NULL
                 ORDER BY date(vence) ASC LIMIT 6"""
        ))

        actividad = rows_to_list(cur.execute(
            "SELECT tipo, entidad, entidad_id, detalle, ts FROM actividad ORDER BY id DESC LIMIT 8"
        ))

    return {
        "totales": totales,
        "ordenes_abiertas": abiertas,
        "ordenes_vencidas": vencidas,
        "cumplimiento_preventivo": cumplimiento_prev,
        "mtbf": mtbf,
        "mttr": mttr,
        "disponibilidad": disponibilidad,
        "estados": estados,
        "repuestos_bajo_min": repuestos_bajo_min,
        "serie_mensual": serie,
        "por_sector": por_sector,
        "por_prioridad": por_prioridad,
        "equipos_por_sector": equipos_por_sector,
        "top_equipos": top_equipos,
        "proximos_vencimientos": proximos,
        "actividad": actividad,
    }


# ------------------------- Busqueda global -----------------------------------


@app.get("/api/buscar")
def buscar(q: str) -> dict[str, list[dict]]:
    like = f"%{q.strip()}%"
    with get_db() as con:
        equipos = rows_to_list(con.execute(
            """SELECT id, denominacion, codigo, sector, foto FROM equipos
                 WHERE denominacion LIKE ? OR codigo LIKE ? OR marca LIKE ? OR modelo LIKE ?
                 LIMIT 6""", (like, like, like, like)))
        ordenes = rows_to_list(con.execute(
            """SELECT id, nro_solic, codmaq, estado, tipo_mant FROM ordenes
                 WHERE nro_solic LIKE ? OR codmaq LIKE ? OR solicita LIKE ? OR tipo_desperfecto LIKE ?
                 LIMIT 6""", (like, like, like, like)))
        repuestos = rows_to_list(con.execute(
            """SELECT id, nro, parte, marca, especificacion FROM repuestos
                 WHERE parte LIKE ? OR marca LIKE ? OR especificacion LIKE ? OR nro LIKE ?
                 LIMIT 6""", (like, like, like, like)))
        tecnicos = rows_to_list(con.execute(
            "SELECT id, nombre, funcion, sector FROM tecnicos WHERE nombre LIKE ? OR funcion LIKE ? LIMIT 6",
            (like, like)))
    return {"equipos": equipos, "ordenes": ordenes, "repuestos": repuestos, "tecnicos": tecnicos}


# ------------------------- Equipos -------------------------------------------


@app.get("/api/equipos")
def listar_equipos(q: str | None = None, sector: str | None = None, orden: str = "denominacion") -> list[dict]:
    ordenes_validos = {"denominacion": "denominacion COLLATE NOCASE", "sector": "sector", "id": "id"}
    order_sql = ordenes_validos.get(orden, "denominacion COLLATE NOCASE")
    with get_db() as con:
        sql = """SELECT e.*,
                        (SELECT COUNT(*) FROM ordenes o WHERE o.equipo_id=e.id
                            OR o.codmaq=e.codigo OR o.codmaq=e.denominacion) AS n_ot,
                        (SELECT COUNT(*) FROM planes_preventivos p WHERE p.equipo_id=e.id
                            OR p.codmaq=e.codigo OR p.codmaq=e.denominacion) AS n_planes
                   FROM equipos e WHERE 1=1"""
        params: list[Any] = []
        if q:
            sql += " AND (e.denominacion LIKE ? OR e.codigo LIKE ? OR e.marca LIKE ? OR e.modelo LIKE ?)"
            like = f"%{q}%"
            params += [like, like, like, like]
        if sector:
            sql += " AND e.sector = ?"
            params.append(sector)
        sql += f" ORDER BY {order_sql}"
        return rows_to_list(con.execute(sql, params))


@app.get("/api/equipos/{eid}")
def detalle_equipo(eid: int) -> dict:
    with get_db() as con:
        eq = con.execute("SELECT * FROM equipos WHERE id=?", (eid,)).fetchone()
        if not eq:
            raise HTTPException(404, "Equipo no encontrado")
        motores = con.execute(
            "SELECT * FROM motores WHERE equipo_id=? OR codigo=? OR codigo=?",
            (eid, eq["codigo"], eq["denominacion"]),
        ).fetchall()
        ots = con.execute(
            """SELECT * FROM ordenes WHERE equipo_id=? OR codmaq=? OR codmaq=?
                 ORDER BY (fecha_solic IS NULL), fecha_solic DESC""",
            (eid, eq["codigo"], eq["denominacion"]),
        ).fetchall()
        planes = con.execute(
            "SELECT * FROM planes_preventivos WHERE equipo_id=? OR codmaq=? OR codmaq=?",
            (eid, eq["codigo"], eq["denominacion"]),
        ).fetchall()
    return {
        "equipo": dict(eq),
        "motores": rows_to_list(motores),
        "ordenes": rows_to_list(ots),
        "planes": rows_to_list(planes),
    }


# ------------------------- Ordenes -------------------------------------------


class OrdenPayload(BaseModel):
    nro_solic: str | None = None
    tipo_mant: str | None = None
    fecha_solic: str | None = None
    sector: str | None = None
    solicita: str | None = None
    prioridad: str | None = None
    estado: str | None = "pendiente"
    codmaq: str | None = None
    tipo_desperfecto: str | None = None
    accion_realizada: str | None = None
    ejecuta: str | None = None
    caracter: str | None = None
    observ_generales: str | None = None
    fecha_ini: str | None = None
    fecha_fin: str | None = None
    hs_hom: float | None = None


@app.get("/api/ordenes")
def listar_ordenes(estado: str | None = None, q: str | None = None, tipo: str | None = None) -> list[dict]:
    with get_db() as con:
        sql = "SELECT * FROM ordenes WHERE 1=1"
        params: list[Any] = []
        if estado:
            sql += " AND estado = ?"
            params.append(estado)
        if tipo:
            sql += " AND tipo_mant LIKE ?"
            params.append(f"{tipo}%")
        if q:
            sql += " AND (nro_solic LIKE ? OR codmaq LIKE ? OR sector LIKE ? OR solicita LIKE ? OR tipo_desperfecto LIKE ?)"
            like = f"%{q}%"
            params += [like, like, like, like, like]
        sql += " ORDER BY (fecha_solic IS NULL), fecha_solic DESC, id DESC"
        rows = rows_to_list(con.execute(sql, params))
    today = date.today().isoformat()
    for r in rows:
        r["vencida"] = bool(r.get("vence") and r["vence"] < today and r["estado"] in ("pendiente", "en_proceso"))
    return rows


@app.get("/api/ordenes/{oid}")
def detalle_orden(oid: int) -> dict:
    with get_db() as con:
        r = con.execute("SELECT * FROM ordenes WHERE id=?", (oid,)).fetchone()
        if not r:
            raise HTTPException(404, "OT no encontrada")
        d = dict(r)
        if d.get("equipo_id"):
            eq = con.execute("SELECT id, denominacion, codigo, foto FROM equipos WHERE id=?", (d["equipo_id"],)).fetchone()
            d["equipo"] = dict(eq) if eq else None
    return d


@app.post("/api/ordenes")
def crear_orden(p: OrdenPayload) -> dict:
    with get_db() as con:
        cur = con.cursor()
        eid = None
        if p.codmaq:
            row = cur.execute(
                "SELECT id FROM equipos WHERE codigo=? OR denominacion=? LIMIT 1", (p.codmaq, p.codmaq)
            ).fetchone()
            eid = row[0] if row else None
        cur.execute(
            """INSERT INTO ordenes (nro_solic,tipo_mant,fecha_solic,sector,solicita,prioridad,estado,
                     equipo_id,codmaq,tipo_desperfecto,accion_realizada,ejecuta,caracter,observ_generales,
                     fecha_ini,fecha_fin,hs_hom,fuente)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (p.nro_solic, p.tipo_mant, p.fecha_solic, p.sector, p.solicita, p.prioridad,
             p.estado or "pendiente", eid, p.codmaq, p.tipo_desperfecto, p.accion_realizada,
             p.ejecuta, p.caracter, p.observ_generales, p.fecha_ini, p.fecha_fin, p.hs_hom, "manual"),
        )
        new_id = cur.lastrowid
        log_activity(cur, "alta", "orden", new_id, f"OT {p.nro_solic or '#'+str(new_id)} creada")
        con.commit()
    return detalle_orden(new_id)


@app.patch("/api/ordenes/{oid}")
def actualizar_orden(oid: int, p: OrdenPayload) -> dict:
    campos = p.model_dump(exclude_unset=True)
    if not campos:
        return detalle_orden(oid)
    with get_db() as con:
        cur = con.cursor()
        prev = cur.execute("SELECT estado, nro_solic FROM ordenes WHERE id=?", (oid,)).fetchone()
        if not prev:
            raise HTTPException(404, "OT no encontrada")
        if campos.get("estado") == "cerrada" and not campos.get("fecha_fin"):
            campos["fecha_fin"] = date.today().isoformat()
        sets = ", ".join(f"{k}=?" for k in campos)
        cur.execute(f"UPDATE ordenes SET {sets} WHERE id=?", (*campos.values(), oid))
        if "estado" in campos and campos["estado"] != prev["estado"]:
            log_activity(cur, "estado", "orden", oid,
                         f"OT {prev['nro_solic'] or '#'+str(oid)}: {prev['estado']} → {campos['estado']}")
        else:
            log_activity(cur, "edicion", "orden", oid, f"OT {prev['nro_solic'] or '#'+str(oid)} editada")
        con.commit()
    return detalle_orden(oid)


@app.delete("/api/ordenes/{oid}")
def borrar_orden(oid: int) -> dict:
    with get_db() as con:
        cur = con.cursor()
        row = cur.execute("SELECT nro_solic FROM ordenes WHERE id=?", (oid,)).fetchone()
        cur.execute("DELETE FROM ordenes WHERE id=?", (oid,))
        if row:
            log_activity(cur, "baja", "orden", oid, f"OT {row['nro_solic'] or '#'+str(oid)} eliminada")
        con.commit()
    return {"ok": True}


# ------------------------- Preventivo ----------------------------------------


@app.get("/api/planes")
def listar_planes(q: str | None = None) -> list[dict]:
    with get_db() as con:
        sql = "SELECT * FROM planes_preventivos WHERE 1=1"
        params: list[Any] = []
        if q:
            like = f"%{q}%"
            sql += " AND (codmaq LIKE ? OR parte LIKE ? OR tarea LIKE ? OR detalle LIKE ?)"
            params += [like, like, like, like]
        sql += " ORDER BY codmaq, tarea"
        return rows_to_list(con.execute(sql, params))


@app.post("/api/planes/{pid}/generar-ot")
def generar_ot(pid: int) -> dict:
    with get_db() as con:
        cur = con.cursor()
        plan = cur.execute("SELECT * FROM planes_preventivos WHERE id=?", (pid,)).fetchone()
        if not plan:
            raise HTTPException(404, "Plan no encontrado")
        nro = f"PREV-{datetime.now().strftime('%y%m%d%H%M')}"
        cur.execute(
            """INSERT INTO ordenes (nro_solic,tipo_mant,fecha_solic,solicita,prioridad,estado,
                     equipo_id,codmaq,tipo_desperfecto,accion_realizada,ejecuta,caracter,observ_generales,vence,fuente)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (nro, "Preventivo", date.today().isoformat(), "Sistema (plan preventivo)", "MEDIA",
             "pendiente", plan["equipo_id"], plan["codmaq"], plan["parte"], plan["detalle"],
             plan["ejecuta"], "PROGRAMADO", plan["observ"], date.today().isoformat(), "preventivo"),
        )
        new_id = cur.lastrowid
        log_activity(cur, "alta", "orden", new_id, f"OT preventiva {nro} generada del plan #{pid}")
        con.commit()
    return detalle_orden(new_id)


# ------------------------- Repuestos / catalogos ----------------------------


@app.get("/api/repuestos")
def listar_repuestos(bajo_min: bool = False, q: str | None = None) -> list[dict]:
    with get_db() as con:
        sql = "SELECT * FROM repuestos WHERE 1=1"
        params: list[Any] = []
        if bajo_min:
            sql += " AND bajo_min = 1"
        if q:
            like = f"%{q}%"
            sql += " AND (parte LIKE ? OR marca LIKE ? OR especificacion LIKE ? OR proveedor LIKE ?)"
            params += [like, like, like, like]
        sql += " ORDER BY bajo_min DESC, parte, marca"
        return rows_to_list(con.execute(sql, params))


@app.get("/api/tecnicos")
def listar_tecnicos() -> list[dict]:
    with get_db() as con:
        return rows_to_list(con.execute(
            """SELECT t.*, (SELECT COUNT(*) FROM ordenes o WHERE o.ejecuta LIKE '%'||t.nombre||'%') AS n_ot
                 FROM tecnicos t ORDER BY nombre"""))


class TecnicoPayload(BaseModel):
    nombre: str
    sector: str | None = None
    funcion: str | None = None
    email: str | None = None


@app.post("/api/tecnicos")
def crear_tecnico(p: TecnicoPayload) -> dict:
    with get_db() as con:
        cur = con.cursor()
        cur.execute(
            "INSERT INTO tecnicos (nombre, sector, funcion, email, fecha_alta) VALUES (?,?,?,?,?)",
            (p.nombre, p.sector, p.funcion, p.email, date.today().isoformat()),
        )
        new_id = cur.lastrowid
        log_activity(cur, "alta", "tecnico", new_id, f"Técnico {p.nombre} dado de alta")
        con.commit()
        r = cur.execute("SELECT * FROM tecnicos WHERE id=?", (new_id,)).fetchone()
    return dict(r)


@app.get("/api/proveedores")
def listar_proveedores() -> list[dict]:
    with get_db() as con:
        return rows_to_list(con.execute("SELECT * FROM proveedores ORDER BY proveedor"))


@app.get("/api/catalogos")
def catalogos() -> dict[str, list[dict]]:
    with get_db() as con:
        return {
            "sectores": rows_to_list(con.execute("SELECT * FROM sectores ORDER BY sector")),
            "tipos_mant": rows_to_list(con.execute("SELECT * FROM tipos_mant ORDER BY nombre")),
            "caracteres_mant": rows_to_list(con.execute("SELECT * FROM caracteres_mant")),
            "acciones_mant": rows_to_list(con.execute("SELECT * FROM acciones_mant")),
            "ejecutantes": rows_to_list(con.execute("SELECT * FROM ejecutantes")),
            "prioridades": [
                {"id": 1, "nombre": "ALTA"},
                {"id": 2, "nombre": "MEDIA"},
                {"id": 3, "nombre": "BAJA"},
            ],
        }


# ------------------------- Reportes ------------------------------------------


@app.get("/api/reportes/mtbf")
def reporte_mtbf() -> list[dict]:
    with get_db() as con:
        rows = con.execute(
            """SELECT COALESCE(NULLIF(codmaq,''), '(sin equipo)') AS equipo,
                      COUNT(*) AS fallas, AVG(hs_hom) AS ttr, SUM(COALESCE(hs_hom,0)) horas
                 FROM ordenes WHERE tipo_mant LIKE 'Correct%'
                 GROUP BY equipo ORDER BY fallas DESC"""
        ).fetchall()
    return [
        {
            "equipo": r["equipo"], "fallas": r["fallas"],
            "mttr": round(r["ttr"] or 0, 2),
            "mtbf": round(HORAS_OPERACION_ANUAL / r["fallas"], 2) if r["fallas"] else None,
            "horas": round(r["horas"] or 0, 1),
        }
        for r in rows
    ]


@app.get("/api/reportes/costos")
def reporte_costos() -> list[dict]:
    with get_db() as con:
        rows = con.execute(
            """SELECT COALESCE(sector,'(sin sector)') sector, COUNT(*) ots,
                       SUM(COALESCE(hs_hom,0)) horas,
                       SUM(CASE WHEN tipo_mant LIKE 'Correct%' THEN 1 ELSE 0 END) correctivas,
                       SUM(CASE WHEN tipo_mant LIKE 'Prevent%' THEN 1 ELSE 0 END) preventivas
                  FROM ordenes GROUP BY sector ORDER BY horas DESC"""
        ).fetchall()
    return [dict(r) for r in rows]


@app.get("/api/actividad")
def actividad(limit: int = 30) -> list[dict]:
    with get_db() as con:
        return rows_to_list(con.execute(
            "SELECT tipo, entidad, entidad_id, detalle, ts FROM actividad ORDER BY id DESC LIMIT ?", (limit,)))


# ------------------------- SPA -----------------------------------------------


@app.get("/")
def index():
    return FileResponse(INDEX_HTML)


@app.get("/health")
def health() -> dict:
    return {"ok": True}
