# GMAO Web — Módulo 1 · Mantenimiento

Migración a web del sistema GMAO original en Microsoft Access
(`MODULO 1_MANTENIMIENTO OK último.mdb`, 592 MB). Toda la estructura, datos y
fotos se extraen del `.mdb` original y se importan a una **app web moderna en
español rioplatense**.

## Estructura del proyecto

```
w/
├── MODULO 1_MANTENIMIENTO OK último.mdb   (original, NUNCA se toca)
├── esquema.md / esquema.json              (esquema completo del .mdb)
├── RELEVAMIENTO.md                        (análisis funcional y mapeo a web)
├── scripts/
│   ├── 01_schema.py                       (extrae esquema)
│   ├── 02_export.py                       (exporta CSVs y fotos OLE→JPG/BMP)
│   └── 07_optimize_photos.py              (comprime fotos para la web)
├── export/
│   ├── csv/                               (40 tablas exportadas)
│   ├── fotos/                             (102 imagenes originales, 264 MB)
│   ├── fotos_web/                         (versiones ≤1600 px, ~15 MB)
│   └── reporte.json                       (conteos por tabla y por columna binaria)
└── webapp/
    ├── requirements.txt
    ├── gmao.db                            (SQLite con datos reales)
    ├── app/main.py                        (FastAPI: KPIs, CRUD OT, planes, etc.)
    ├── scripts/load.py                    (importa CSVs → SQLite)
    ├── static/                            (CSS + JS + fotos servidas)
    └── templates/index.html               (SPA)
```

## Stack elegido y por qué

- **Backend**: FastAPI + SQLite. Fastapi porque es liviano, tipa el I/O y trae
  docs automáticos; SQLite porque el volumen es chico (~1 MB de datos + fotos
  ya extraídas) y no requiere servidor extra. Corre en cualquier máquina con
  Python.
- **Frontend**: HTML + JS vanilla (módulo ES2020) + Chart.js UMD local. Sin
  build step, sin npm, sin toolchain. Se edita y se ve en un F5.

## Cómo levantarla (primera vez)

Requiere Python 3.11+ y el **Access Database Engine 2016 x64**
([descarga oficial](https://www.microsoft.com/en-us/download/details.aspx?id=54920))
para poder correr Fase 1. Si sólo querés correr la app web, saltate a Fase 2 —
los CSVs y la SQLite ya están generados.

```bash
# instalar dependencias (fase 1 y fase 2)
pip install pyodbc pillow fastapi "uvicorn[standard]"

# --- FASE 1 (opcional: reextraer del .mdb) ---
python scripts/01_schema.py         # → esquema.md / esquema.json
python scripts/02_export.py         # → export/csv/*.csv + export/fotos/*
python scripts/07_optimize_photos.py# → export/fotos_web/*

# --- FASE 2 (siempre) ---
python webapp/scripts/load.py       # → webapp/gmao.db + fotos en /static
python -m uvicorn webapp.app.main:app --host 127.0.0.1 --port 8000 --reload
```

Abrí <http://localhost:8000> en el navegador.

## Módulos (v2.0)

- **Búsqueda global** — Barra en el topbar (atajo `/`) que busca en vivo
  equipos, OT, repuestos y técnicos, con miniaturas de foto y navegación directa.
- **Panel** — KPIs con progreso (equipos, OT abiertas/vencidas, cumplimiento
  preventivo, disponibilidad, MTBF/MTTR, repuestos bajo mínimo) + gráfico
  correctivo/preventivo por mes + torta de estados + carga por sector (barras) +
  próximos vencimientos (por SLA de prioridad) + feed de actividad reciente.
- **Órdenes de trabajo** — Kanban drag-and-drop con color-coding de prioridad y
  marca de vencidas + vista tabla + alta/edición/borrado en modal.
- **Preventivo** — 43 planes con filtro; botón *Generar OT* que instancia una OT
  preventiva del plan.
- **Equipos** — Grilla con foto real; ficha en drawer con **tabs**
  (Información / Motores / Historial en timeline / Preventivo).
- **Repuestos** — Stock y mínimos con marca *bajo mínimo* y filtro/buscador.
- **Técnicos** — Tarjetas con avatar por inicial + alta en modal.
- **Reportes** — Barras correctivo/preventivo por sector, horas por sector,
  tablas de MTBF/MTTR y detalle por sector.

### Mejoras de calidad de datos (en `load.py`)

- Normalización de **sectores** (arregla typos de encoding: `Torner_a` → Tornería,
  `Uni_n y confotmado` → Unión y conformado) y **tipos** de mantenimiento a
  Title Case.
- Vencimiento por **SLA de prioridad** (ALTA 3d, MEDIA 7d, BAJA 15d).
- Vinculación `equipo_id` por match exacto + LIKE (honesta: los CODMAQ de origen
  como `P-1`, `TCNC-1` son códigos de sistema sin equipo homónimo, así que no se
  fabrican relaciones; el detalle igual cruza por texto).
- Registro de **actividad** (timeline) en cada alta/edición/baja.

### Diseño (v2.0)

- Sistema de diseño con tokens en capas, glassmorphism en sidebar y topbar,
  sombras multinivel, tipografía Inter + JetBrains Mono.
- Iconografía SVG propia (sprite inline), micro-animaciones (fade-in escalonado
  en cards, hover-lift, drawer slide), skeletons de carga y empty states.
- Tema claro/oscuro con glow de marca, gráficos Chart.js con paleta y grillas
  sincronizadas al tema.

## Reglas cumplidas

- El `.mdb` original **nunca** se modifica; se abre en modo lectura vía ODBC
  y las escrituras solo pasan por SQLite (`webapp/gmao.db`).
- Toda la data en la app viene del `.mdb`; no hay registros inventados.
- Encoding manejado: se lee con `latin-1` de ODBC (compatible con cp1252 que
  usa Access) y se escribe UTF-8.
- OLE Object handling: se detectan `Paint.Picture` (OLE 2 con DIB embebido) y
  se reconstruye el `BITMAPFILEHEADER` para producir un BMP válido; los JPG
  embebidos se validan con PIL antes de guardarse.
- Español rioplatense (voseo) en toda la UI (“arrastrá para cambiar de estado”,
  “generá OT con un click”, “dado de alta”…).

## API resumida

| Método | Path | Descripción |
| --- | --- | --- |
| GET | `/api/panel` | KPIs y series para el panel |
| GET | `/api/equipos[?q=...&sector=...]` | Listado con búsqueda |
| GET | `/api/equipos/{id}` | Ficha + motores + historial + planes |
| GET | `/api/ordenes[?estado=&q=]` | Lista de OT |
| POST/PATCH/DELETE | `/api/ordenes[/{id}]` | CRUD OT |
| GET | `/api/planes` | Planes preventivos |
| POST | `/api/planes/{id}/generar-ot` | Instancia una OT preventiva |
| GET | `/api/repuestos[?bajo_min=true]` | Stock |
| GET/POST | `/api/tecnicos` | Listado / alta |
| GET | `/api/catalogos` | Sectores, tipos, prioridades, etc. |
| GET | `/api/reportes/mtbf` | MTBF/MTTR por equipo |
| GET | `/api/reportes/costos` | Horas por sector |

Docs interactivas: <http://localhost:8000/docs>.

## Diseño

- Identidad industrial (naranja quemado + azules eléctricos), sin decoración
  excesiva.
- Tema claro/oscuro con toggle en el sidebar (se guarda en `localStorage`).
- Tipografías **Inter** (UI) y **JetBrains Mono** (códigos y fechas).
- Layout con sidebar fijo a la izquierda, cards con sombras suaves y drawer
  modal para las fichas.
- Responsive: en < 900 px el sidebar pasa arriba y las columnas del Kanban
  se apilan.

## Notas técnicas

- **Access sin instalar**: se resuelve instalando solo el runtime
  *Access Database Engine 2016 x64* (no requiere Office). El bitness debe
  coincidir con el de Python.
- **pyodbc encoding**: Access devuelve strings con codificación mixta; se
  necesitó `conn.setdecoding(pyodbc.SQL_CHAR/SQL_WCHAR, encoding="latin-1")`
  y `conn.setencoding("latin-1")` para evitar errores UTF-16.
- **DIB → BMP**: los BLOBs OLE de Access almacenan la imagen como
  `BITMAPINFOHEADER` sin el file header “BM”. El extractor reconstruye el
  header (`BM` + filesize + offset a pixels) buscando el DIB en los primeros
  1 MB del BLOB.
- **Python 3.14 + Jinja2**: hay un bug conocido con `Jinja2Templates` y la
  caché LRU en 3.14 (rechaza el dict `globals`). Como no hay variables de
  template, se sirve `index.html` directamente con `FileResponse`.
