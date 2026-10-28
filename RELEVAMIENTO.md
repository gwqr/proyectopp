# Relevamiento del GMAO (Access → Web)

Base analizada: `MODULO 1_MANTENIMIENTO OK último.mdb` (592 MB, contraseña
`(no incluida en el repo; se pasa por la variable MDB_PWD)`). Contiene el **Módulo 1 – Mantenimiento** del GMAO institucional
(taller de una escuela técnica / industria educativa), con 40 tablas y ~733
registros de negocio + 102 imágenes embebidas (OLE 2 / Paint.Picture).

## 1. Módulos detectados

El Access mezcla **maestros de negocio**, **tablas transaccionales** y
**catálogos parametrizables**. Los agrupo por dominio funcional:

| Dominio | Tablas |
| --- | --- |
| Activos / equipos | `1-001 MAQUINA`, `1-003 MAQUINAS-MOTORES`, `26-TIPO DE MAQUINAS`, `25-MARCA DE MOTORES` |
| Órdenes de trabajo (OT/OM) | `1-006 REGISTRO DE LOS MANTENIMIENTOS`, `Copia de 10-...` (histórico), `30-COSTOS DE LOS OM` |
| Preventivo | `09-REGISTRO DE DEFINICION MANTENIM PREVENTIVOS`, `14-TAREA MANTPREV`, `07-FREC MANTPREV`, `08-RECOMENDACIONES` |
| Repuestos / compras | `1-002 DATOS DE REPUESTOS`, `16-TIPO DE REPUESTOS`, `35-Compras` |
| Personas | `1-005 EQUIPO DE TRABAJO`, `20-funciones Habilitaciones`, `11-RESP DEFINICION MANTENIMIENTO` |
| Proveedores | `1-004 Proveedores`, `Copia de 1-004 Proveedores` |
| Catálogos maestros | `13-Sectores`, `15-TIPO DE MANTENIM`, `17-CARACTER DEL MANTENIM`, `04-ACCION DE MANTENIM`, `04-...2024`, `05-CONDICION EXISTENTE`, `05-..._2024`, `06-EJECUTA MANTENIM`, `12-RUBRO DESPERFECTO`, `18-CONDICIONES DE SEGURIDAD` |
| Documentación / recursos | `21-REGISTR DE INSTRUMENTOS`, `22-Normas`, `23-Asignaturas`, `28-Tabla Capacitación`, `29-Aplicaciones web`, `27-CAMBIOS MEJORAS DE LA TABLA` |
| Actividades taller (educativo) | `24-Rotaciones Taller`, `32- Rotaciones Taller`, `33-ACTIVIDADES DE TALLER`, `34-Ingresos` |
| Infra Access legacy | `Switchboard Items` |

## 2. Tablas clave y para qué sirven

### `1-001 MAQUINA` (65 filas, IMAGEN 65 fotos)
Ficha de cada equipo del taller. Campos: `IDMAQUINAS` (PK autonumérica),
`CODMAQ` (código legible – frecuentemente vacío en registros nuevos),
`DENOMINACION`, `SECTOR`, `MAQASOC`, `MARCA`, `MODELO`, `MANT-PREV` (bandera),
`FECHA DE INSTALACION`, `IMAGEN` (LONGBINARY con foto DIB/JPG),
`costo del activo`, `valor residual`, `vida útil`.

### `1-003 MAQUINAS-MOTORES` (66 filas)
Ficha técnica extendida de los motores/actuadores asociados a máquinas: `CODIGO`
(clave con `1-001.CODMAQ`), `SECCION`, `POTENCIA`, `TENSION`, `AMPERAJE`, `RPM`,
`IP`, `SERVICIO`, `CLASE`, etc. Es un “datasheet” eléctrico y mecánico.

### `1-006 REGISTRO DE LOS MANTENIMIENTOS` (5 filas, OT)
Es la **orden de trabajo (OT)**. Campos relevantes: `NRO SOLIC` (`000-0001`…),
`TIPO MANTENIM`, `FECHASOLIC`, `SECTOR`, `SOLICITA`, `PRIORIDAD`,
`Estado de la OM`, `CODMAQ`, `TIPO DESPERFECTO`, `PARTE DEL EQUIPO`,
`ACCION REALIZADA`, `EJECUTA`, `FECHA INI/FIN`, `HS INI/FIN/MIN INI/MIN FIN`,
`HS HOM`, `HS MAQ`, `Imagen om` (LONGBINARY con foto).

### `Copia de 10-REGISTRO DE LOS MANTENIMIENTOS` (2 filas)
Histórico previo con casi las mismas columnas → lo tratamos como snapshot
adicional y lo cargamos junto con la anterior.

### `09-REGISTRO DE DEFINICION MANTENIM PREVENTIVOS` (43 filas, GRAFICO 31)
Define los **planes de mantenimiento preventivo** por máquina/parte, tarea,
frecuencia, tiempo estimado y gráfico ilustrativo (LONGBINARY).

### `1-002 DATOS DE REPUESTOS` (85 filas)
Stock de repuestos con `PARTE/COMPONENTE`, `ESPECIFIC REPUESTO`,
`CANT REQUERIDA`, `CANT STOCK MIN`, `PROVEEDOR`, `CONTACTO`, `TELEFONO`.

### `1-005 EQUIPO DE TRABAJO` (10 filas)
Técnicos / personal (`NOMBRE Y APELLIDO`, `SECTOR`, `FUNCION`, `E-MAIL`).

### `1-004 Proveedores` (7 filas)
Proveedores con `RUBRO`, `PROVEEDOR`, `CONTACTO`, `TELEFONO`, `DIRECCION`,
`e-mail`, `Pagina WEb`.

### `30-COSTOS DE LOS OM` (1 fila)
Desglose de costos por OT (mano de obra + repuestos 1..6). Poco poblada pero
define el esquema de costos.

### `13-Sectores` / `15-TIPO DE MANTENIM` / `17-CARACTER DEL MANTENIM` / `04-ACCION` / `05-CONDICION EXISTENTE`
Tablas de dominio / catálogo. La app web las expone como *select* editables.

## 3. Relaciones

Access no tiene FK declaradas (`cur.foreignKeys` devolvió vacío). Las
relaciones son **por convención de nombre y valor** (típico de bases Access
maduras). Las que detecto en los datos:

- `1-001 MAQUINA.CODMAQ`  ↔  `1-003 MAQUINAS-MOTORES.CODIGO`  (equipo → motor).
  Sin embargo el 78 % de máquinas tienen `CODMAQ` vacío, así que en la web la
  ficha usa `IDMAQUINAS` como PK y el `CODMAQ` es un alias legible opcional.
- `1-001 MAQUINA.SECTOR`  ↔  `13-Sectores.SECTOR`   (texto libre).
- `1-006 REG.MANT.CODMAQ`  ↔  `1-001 MAQUINA.CODMAQ` (texto libre; muchas OTs
  usan la denominación de la máquina, no el código).
- `1-006 REG.MANT.TIPO MANTENIM`  ↔  `15-TIPO DE MANTENIM.TIPO DE MANTENIM`.
- `1-006 REG.MANT.CARACTER DEL MANTENIM`  ↔  `17-CARACTER DEL MANTENIM`.
- `1-006 REG.MANT.SECTOR`  ↔  `13-Sectores.SECTOR`.
- `1-006 REG.MANT.EJECUTA` ↔ `06-EJECUTA MANTENIM.EJECUTA` o `1-005 EQUIPO DE TRABAJO.NOMBRE Y APELLIDO`.
- `09-... PREVENTIVOS.CODMAQ` ↔ `1-001 MAQUINA.CODMAQ` (plan → máquina).
- `1-002 DATOS DE REPUESTOS.PROVEEDOR` ↔ `1-004 Proveedores.PROVEEDOR`.

**Regla de calidad**: los `CODMAQ` en OT y en definición preventiva incluyen
variantes (“Torno 1”, “Cortadora Bianchi”, “T-01”). En la app web hago
*matching* laxo por prefijo + búsqueda por denominación.

## 4. Fotos y OLE

- Fotos totales extraídas: **102** (todas verificadas con PIL).
  - `1-001 MAQUINA.IMAGEN` — 65 imágenes (BMP+JPG). 41 son DIB embebidas en OLE
    2 Paint.Picture (reconstruidas prependiendo un BITMAPFILEHEADER), 24 son
    JPG comprimidos dentro del OLE.
  - `09-... PREVENTIVOS.GRAFICO` — 31 imágenes.
  - `1-006 REG.MANT.Imagen om` — 3 imágenes.
  - `Copia de 10-REG.MANT.Imagen om` — 2 imágenes.
  - `33-ACTIVIDADES DE TALLER.IMAGENES` — 1 imagen.
- Los BLOBs originales sin recorte quedaron a la vista como marcador `<BLOB len=N>` en el CSV.
- Post-extracción, todo se optimizó a JPG progressive ≤ 1600 px (`export/fotos_web/`, ≈ 15 MB en total contra 264 MB originales).

## 5. Mapeo al sistema web

| GMAO Access | App web (rutas / modelos)                                  |
| --- | --- |
| `1-001 MAQUINA` + `1-003 MAQUINAS-MOTORES` + foto | `/equipos` – lista + ficha técnica con foto + tab “Datos eléctricos” |
| `1-006 REG. MANTENIMIENTOS` + `Copia de 10-...` | `/ordenes` – Kanban (Pendiente / En proceso / Cerrada) + lista + edición + foto de OT |
| `09-DEFINICION PREVENTIVOS` + `07-FREC` + `14-TAREA MANTPREV` | `/preventivo` – planes por calendario/horómetro, generación de OT |
| `1-002 DATOS DE REPUESTOS` + `16-TIPO DE REPUESTOS` | `/repuestos` – stock, mínimo, alerta bajo mínimo |
| `1-005 EQUIPO DE TRABAJO` | `/tecnicos` – alta/edición |
| `1-004 Proveedores` | `/proveedores` (embebido en repuestos y OT) |
| `13-Sectores`, `15-`, `17-`, `04-`, `05-`, `06-`, `08-`, `11-`, `12-`, `18-` | Tablas de catálogos (selects); expuestos por endpoints `/catalogos/*`. |
| `30-COSTOS DE LOS OM` | `/reportes/costos` |
| KPIs derivados (MTBF, MTTR, cumplimiento) | `/panel` |
| `27-CAMBIOS MEJORAS DE LA TABLA` | Auditoría de cambios – solo lectura |
| `24-`, `32-`, `33-`, `34-Ingresos`, `35-Compras` | Módulo educativo aparte – **fuera de alcance** del módulo mantenimiento |

## 6. Limpieza pendiente

- Muchos `CODMAQ` vacíos: la web hace fallback a `IDMAQUINAS` para vincular
  fotos y OT.
- Duplicados `04-ACCION..._2024`, `05-CONDICION_2024`, `Copia de 1-004`,
  `Copia de 10-...`: se importan “tal cual” pero no aparecen en la UI.
- Los tipos de mantenimiento vienen escritos en mayúsculas y minúsculas
  (`CORRECTIVO`, `Correctivo`) — la app normaliza a título capitalizado.
- Los `SECTOR` tienen typos (`Torneria`, `Torner_a`, `Uni_n y confotmado`).
  La normalización se hace en la carga (ver `webapp/scripts/load.py`).
