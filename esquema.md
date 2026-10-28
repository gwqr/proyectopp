# Esquema de la base MDB

Tablas: **40**  
Registros totales: **733**

## Resumen por tabla

| Tabla | Columnas | Registros | PK |
| --- | ---: | ---: | --- |
| 04-ACCION DE MANTENIM | 2 | 15 | - |
| 04-ACCION DE MANTENIM_2024 | 2 | 15 | - |
| 05-CONDICION EXISTENTE | 4 | 37 | - |
| 05-CONDICION EXISTENTE_2024 | 4 | 37 | - |
| 06-EJECUTA MANTENIM | 2 | 6 | - |
| 07-FREC MANTPREV | 2 | 10 | - |
| 08-RECOMENDACIONES | 2 | 5 | - |
| 09-REGISTRO DE DEFINICION MANTENIM PREVENTIVOS | 18 | 43 | - |
| 1-001 MAQUINA | 21 | 65 | - |
| 1-002 DATOS DE REPUESTOS | 12 | 85 | - |
| 1-003 MAQUINAS-MOTORES | 36 | 66 | - |
| 1-004 Proveedores | 12 | 7 | - |
| 1-005 EQUIPO DE TRABAJO | 6 | 10 | - |
| 1-006 REGISTRO DE LOS MANTENIMIENTOS | 49 | 5 | - |
| 11-RESP DEFINICION MANTENIMIENTO | 2 | 3 | - |
| 12-RUBRO DESPERFECTO | 2 | 4 | - |
| 13-Sectores | 2 | 11 | - |
| 14-TAREA MANTPREV | 3 | 11 | - |
| 15-TIPO DE MANTENIM | 2 | 3 | - |
| 16-TIPO DE REPUESTOS | 2 | 63 | - |
| 17-CARACTER DEL MANTENIM | 2 | 2 | - |
| 18-CONDICIONES DE SEGURIDAD | 3 | 33 | - |
| 20-funciones Habilitaciones | 4 | 3 | - |
| 21-REGISTR DE INSTRUMENTOS | 8 | 6 | - |
| 22-Normas | 8 | 6 | - |
| 23-Asignaturas | 3 | 47 | - |
| 24-Rotaciones Taller | 3 | 3 | - |
| 25-MARCA DE MOTORES | 1 | 26 | - |
| 26-TIPO DE MAQUINAS | 1 | 27 | - |
| 27-CAMBIOS MEJORAS DE LA TABLA | 6 | 4 | - |
| 28-Tabla Capacitación | 7 | 3 | - |
| 29-Aplicaciones web | 4 | 33 | - |
| 30-COSTOS DE LOS OM | 45 | 1 | - |
| 32- Rotaciones Taller | 3 | 16 | - |
| 33-ACTIVIDADES DE TALLER | 8 | 6 | - |
| 34-Ingresos | 5 | 3 | - |
| 35-Compras | 8 | 10 | - |
| Copia de 1-004 Proveedores | 8 | 0 | - |
| Copia de 10-REGISTRO DE LOS MANTENIMIENTOS | 49 | 2 | - |
| Switchboard Items | 5 | 1 | - |

### `04-ACCION DE MANTENIM`  (15 filas)

| # | Columna | Tipo | Tam | Null | Default |
| ---: | --- | --- | ---: | :---: | --- |
| 1 | Id | COUNTER | 10 | NO |  |
| 2 | ACCION | VARCHAR | 50 | SI |  |

### `04-ACCION DE MANTENIM_2024`  (15 filas)

| # | Columna | Tipo | Tam | Null | Default |
| ---: | --- | --- | ---: | :---: | --- |
| 1 | Id | COUNTER | 10 | NO |  |
| 2 | ACCION | VARCHAR | 50 | SI |  |

### `05-CONDICION EXISTENTE`  (37 filas)

| # | Columna | Tipo | Tam | Null | Default |
| ---: | --- | --- | ---: | :---: | --- |
| 1 | Id | COUNTER | 10 | NO |  |
| 2 | COND EXTISTENTE | VARCHAR | 50 | SI |  |
| 3 | METODO | VARCHAR | 50 | SI |  |
| 4 | INSTRUMENTO | VARCHAR | 50 | SI |  |

### `05-CONDICION EXISTENTE_2024`  (37 filas)

| # | Columna | Tipo | Tam | Null | Default |
| ---: | --- | --- | ---: | :---: | --- |
| 1 | Id | COUNTER | 10 | NO |  |
| 2 | COND EXTISTENTE | VARCHAR | 50 | SI |  |
| 3 | METODO | VARCHAR | 50 | SI |  |
| 4 | INSTRUMENTO | VARCHAR | 50 | SI |  |

### `06-EJECUTA MANTENIM`  (6 filas)

| # | Columna | Tipo | Tam | Null | Default |
| ---: | --- | --- | ---: | :---: | --- |
| 1 | Id | COUNTER | 10 | NO |  |
| 2 | EJECUTA | VARCHAR | 50 | SI |  |

### `07-FREC MANTPREV`  (10 filas)

| # | Columna | Tipo | Tam | Null | Default |
| ---: | --- | --- | ---: | :---: | --- |
| 1 | Id | COUNTER | 10 | NO |  |
| 2 | FREC MANTPREV | VARCHAR | 255 | SI |  |

### `08-RECOMENDACIONES`  (5 filas)

| # | Columna | Tipo | Tam | Null | Default |
| ---: | --- | --- | ---: | :---: | --- |
| 1 | Id | COUNTER | 10 | NO |  |
| 2 | RECOMENDACIONES | VARCHAR | 50 | SI |  |

### `09-REGISTRO DE DEFINICION MANTENIM PREVENTIVOS`  (43 filas)

| # | Columna | Tipo | Tam | Null | Default |
| ---: | --- | --- | ---: | :---: | --- |
| 1 | Id | COUNTER | 10 | NO |  |
| 2 | TIPO MANTENIM | VARCHAR | 50 | SI |  |
| 3 | DEFINE | VARCHAR | 255 | SI |  |
| 4 | CODMAQ | VARCHAR | 50 | SI |  |
| 5 | TIPO DESPERFECTO | VARCHAR | 255 | SI |  |
| 6 | PARTE DEL EQUIPO | VARCHAR | 255 | SI |  |
| 7 | SUPBARTE DEL EQUIPO | VARCHAR | 255 | SI |  |
| 8 | SUBSUBPARTE DEL EQUIPO | VARCHAR | 255 | SI |  |
| 9 | TAREA MANTENIM PREV | VARCHAR | 255 | SI |  |
| 10 | DETALLE MANTENIM PREVENTIVO | VARCHAR | 255 | SI |  |
| 11 | EJECUTA | VARCHAR | 255 | SI |  |
| 12 | ESTADO DEL EQUIPO | VARCHAR | 255 | SI |  |
| 13 | OBSERV GENERALES | VARCHAR | 255 | SI |  |
| 14 | MAQASOC | VARCHAR | 255 | SI |  |
| 15 | FRECUENCIA | VARCHAR | 255 | SI |  |
| 16 | TIEMPO ESTIMADO | VARCHAR | 50 | SI |  |
| 17 | GRAFICO | LONGBINARY | 1073741823 | SI |  |
| 18 | FECHA | DATETIME | 19 | SI |  |

### `1-001 MAQUINA`  (65 filas)

| # | Columna | Tipo | Tam | Null | Default |
| ---: | --- | --- | ---: | :---: | --- |
| 1 | IDMAQUINAS | COUNTER | 10 | NO |  |
| 2 | CODMAQ | VARCHAR | 50 | SI |  |
| 3 | DENOMINACION | VARCHAR | 255 | SI |  |
| 4 | SECTOR | VARCHAR | 50 | SI |  |
| 5 | MAQASOC | VARCHAR | 50 | SI |  |
| 6 | MARCA | VARCHAR | 50 | SI |  |
| 7 | MODELO | VARCHAR | 50 | SI |  |
| 8 | MANT-PREV | VARCHAR | 50 | SI |  |
| 9 | FECHA DE INSTALACION | DATETIME | 19 | SI |  |
| 10 | OBSERVACION | VARCHAR | 50 | SI |  |
| 11 | FILTRO MEJORA | VARCHAR | 50 | SI |  |
| 12 | DESCRIPCION DE LA MEJORA | VARCHAR | 255 | SI |  |
| 13 | OBJETIVO DE LA MEJORA | VARCHAR | 255 | SI |  |
| 14 | ACCIONES TOMADAS | VARCHAR | 255 | SI |  |
| 15 | PERSONAL | VARCHAR | 50 | SI |  |
| 16 | FECHA DE LA MEJORA | DATETIME | 19 | SI |  |
| 17 | IMAGEN | LONGBINARY | 1073741823 | SI |  |
| 18 | gg | REAL | 24 | SI |  |
| 19 | costo del activo | INTEGER | 10 | SI |  |
| 20 | valor residual | INTEGER | 10 | SI |  |
| 21 | vida útil | INTEGER | 10 | SI |  |

### `1-002 DATOS DE REPUESTOS`  (85 filas)

| # | Columna | Tipo | Tam | Null | Default |
| ---: | --- | --- | ---: | :---: | --- |
| 1 | Id | COUNTER | 10 | NO |  |
| 2 | NRO | VARCHAR | 50 | SI |  |
| 3 | MARCA | VARCHAR | 50 | SI |  |
| 4 | MODELO | VARCHAR | 50 | SI |  |
| 5 | PARTE/COMPONENTE | VARCHAR | 50 | SI |  |
| 6 | ESPECIFIC REPUESTO | VARCHAR | 255 | SI |  |
| 7 | CANT REQUERIDA | VARCHAR | 50 | SI |  |
| 8 | CANT STOCK MIN | VARCHAR | 50 | SI |  |
| 9 | PROVEEDOR | VARCHAR | 50 | SI |  |
| 10 | CONTACTO | VARCHAR | 50 | SI |  |
| 11 | TELEFONO | VARCHAR | 50 | SI |  |
| 12 | DIRECCION | VARCHAR | 255 | SI |  |

### `1-003 MAQUINAS-MOTORES`  (66 filas)

| # | Columna | Tipo | Tam | Null | Default |
| ---: | --- | --- | ---: | :---: | --- |
| 1 | CODIGO | VARCHAR | 50 | SI |  |
| 2 | DENOMINACION | VARCHAR | 255 | SI |  |
| 3 | SECCION | VARCHAR | 50 | SI |  |
| 4 | UBICACION | VARCHAR | 50 | SI |  |
| 5 | DESCRIPCION | VARCHAR | 50 | SI |  |
| 6 | MARCA | VARCHAR | 50 | SI |  |
| 7 | TIPO | VARCHAR | 50 | SI |  |
| 8 | NUMERO | VARCHAR | 50 | SI |  |
| 9 | IP / IN | INTEGER | 10 | SI |  |
| 10 | CONSUMO | VARCHAR | 50 | SI |  |
| 11 | POTENCIA | VARCHAR | 50 | SI |  |
| 12 | COSENO FI | VARCHAR | 50 | SI |  |
| 13 | RENDIMIENTO | DOUBLE | 53 | SI |  |
| 14 | TENSION | VARCHAR | 50 | SI |  |
| 15 | AMPERAJE | VARCHAR | 50 | SI |  |
| 16 | FASES | VARCHAR | 50 | SI |  |
| 17 | TEMPERATURA | VARCHAR | 50 | SI |  |
| 18 | CONECCION | VARCHAR | 50 | SI |  |
| 19 | FRECUENCIA | VARCHAR | 50 | SI |  |
| 20 | RPM | VARCHAR | 50 | SI |  |
| 21 | PROTECCION | VARCHAR | 50 | SI |  |
| 22 | IP | VARCHAR | 50 | SI |  |
| 23 | INS | VARCHAR | 50 | SI |  |
| 24 | SERVICIO | VARCHAR | 50 | SI |  |
| 25 | FORMA | VARCHAR | 50 | SI |  |
| 26 | CLASE | VARCHAR | 50 | SI |  |
| 27 | CAT | VARCHAR | 50 | SI |  |
| 28 | REG | VARCHAR | 50 | SI |  |
| 29 | ISOL | VARCHAR | 50 | SI |  |
| 30 | ROL | VARCHAR | 50 | SI |  |
| 31 | PESO | VARCHAR | 50 | SI |  |
| 32 | SCHUTZART | VARCHAR | 50 | SI |  |
| 33 | BOUGROBE | INTEGER | 10 | SI |  |
| 34 | AUSFUHRUNG NACH | VARCHAR | 50 | SI |  |
| 35 | CAUDALES | VARCHAR | 255 | SI |  |
| 36 | REGISTRO | VARCHAR | 255 | SI |  |

### `1-004 Proveedores`  (7 filas)

| # | Columna | Tipo | Tam | Null | Default |
| ---: | --- | --- | ---: | :---: | --- |
| 1 | Id | COUNTER | 10 | NO |  |
| 2 | RUBRO | VARCHAR | 255 | SI |  |
| 3 | PROVEEDOR | VARCHAR | 50 | SI |  |
| 4 | CONTACTO | VARCHAR | 50 | SI |  |
| 5 | TELEFONO | VARCHAR | 50 | SI |  |
| 6 | DIRECCION | VARCHAR | 255 | SI |  |
| 7 | e-mail | VARCHAR | 255 | SI |  |
| 8 | Pagina WEb | LONGCHAR | 1073741823 | SI |  |
| 9 | PROVEEDOR1 | VARCHAR | 255 | SI |  |
| 10 | CONTACTO1 | VARCHAR | 255 | SI |  |
| 11 | TELEFONO1 | VARCHAR | 255 | SI |  |
| 12 | DIRECCION1 | VARCHAR | 255 | SI |  |

### `1-005 EQUIPO DE TRABAJO`  (10 filas)

| # | Columna | Tipo | Tam | Null | Default |
| ---: | --- | --- | ---: | :---: | --- |
| 1 | Id | COUNTER | 10 | NO |  |
| 2 | NOMBRE Y APELLIDO | VARCHAR | 50 | SI |  |
| 3 | SECTOR | VARCHAR | 50 | SI |  |
| 4 | FUNCION | VARCHAR | 255 | SI |  |
| 5 | E-MAIL | VARCHAR | 255 | SI |  |
| 6 | FECHA | DATETIME | 19 | SI |  |

### `1-006 REGISTRO DE LOS MANTENIMIENTOS`  (5 filas)

| # | Columna | Tipo | Tam | Null | Default |
| ---: | --- | --- | ---: | :---: | --- |
| 1 | Id | COUNTER | 10 | NO |  |
| 2 | NRO SOLIC | VARCHAR | 50 | SI |  |
| 3 | TIPO MANTENIM | VARCHAR | 50 | SI |  |
| 4 | FECHASOLIC | DATETIME | 19 | SI |  |
| 5 | SECTOR | VARCHAR | 50 | SI |  |
| 6 | SOLICITA | VARCHAR | 255 | SI |  |
| 7 | PRIORIDAD | VARCHAR | 255 | SI |  |
| 8 | Estado de la OM | VARCHAR | 255 | SI |  |
| 9 | CODMAQ | VARCHAR | 50 | SI |  |
| 10 | MAQASOC | VARCHAR | 255 | SI |  |
| 11 | TIPO DESPERFECTO | VARCHAR | 255 | SI |  |
| 12 | CONDICION EXISTENTE | VARCHAR | 255 | SI |  |
| 13 | Jefe de Sección | VARCHAR | 255 | SI |  |
| 14 | PARTE DEL EQUIPO | VARCHAR | 255 | SI |  |
| 15 | SUPBARTE DEL EQUIPO | VARCHAR | 255 | SI |  |
| 16 | SUBSUBPARTE DEL EQUIPO | VARCHAR | 255 | SI |  |
| 17 | CAUSA DE LA CONDICION EXISTENTE | VARCHAR | 255 | SI |  |
| 18 | ACCION REALIZADA | VARCHAR | 255 | SI |  |
| 19 | OBSERV PZAS | VARCHAR | 255 | SI |  |
| 20 | Htas utilizadas | LONGCHAR | 1073741823 | SI |  |
| 21 | Instrumentos utilizados | LONGCHAR | 1073741823 | SI |  |
| 22 | EJECUTA | VARCHAR | 255 | SI |  |
| 23 | Estudiantes que intervienen | LONGCHAR | 1073741823 | SI |  |
| 24 | CARACTER DEL MANTENIM | VARCHAR | 50 | SI |  |
| 25 | OBSERV MO | VARCHAR | 255 | SI |  |
| 26 | FECHA INI | DATETIME | 19 | SI |  |
| 27 | HS INI | REAL | 24 | SI |  |
| 28 | MIN INI | REAL | 24 | SI |  |
| 29 | FECHA FIN | DATETIME | 19 | SI |  |
| 30 | HS FIN | REAL | 24 | SI |  |
| 31 | MIN FIN | REAL | 24 | SI |  |
| 32 | HS HOM | REAL | 24 | SI |  |
| 33 | HS MAQ | REAL | 24 | SI |  |
| 34 | ESTADO DEL EQUIPO | VARCHAR | 255 | SI |  |
| 35 | OBSERV GENERALES | VARCHAR | 255 | SI |  |
| 36 | TIEMPO ACTIV | INTEGER | 10 | SI |  |
| 37 | TIEMPO REALIZAR INF | INTEGER | 10 | SI |  |
| 38 | Intervención de terceros | VARCHAR | 255 | SI |  |
| 39 | Imagen om | LONGBINARY | 1073741823 | SI |  |
| 40 | FILTRO DE LA MEJORA | VARCHAR | 50 | SI |  |
| 41 | DESCRIPCION MEJORA | VARCHAR | 255 | SI |  |
| 42 | OBJETIVO MEJORA | VARCHAR | 255 | SI |  |
| 43 | OTRAS ACCIONES TOMADAS | VARCHAR | 255 | SI |  |
| 44 | REGISTRA MEJORA | VARCHAR | 255 | SI |  |
| 45 | CANT TECNICO | INTEGER | 10 | SI |  |
| 46 | CANT INSPECTOR | INTEGER | 10 | SI |  |
| 47 | CANT OFICIAL | INTEGER | 10 | SI |  |
| 48 | CANT OPERARIO | INTEGER | 10 | SI |  |
| 49 | CANT EXTERNO | INTEGER | 10 | SI |  |

### `11-RESP DEFINICION MANTENIMIENTO`  (3 filas)

| # | Columna | Tipo | Tam | Null | Default |
| ---: | --- | --- | ---: | :---: | --- |
| 1 | Id | COUNTER | 10 | NO |  |
| 2 | RESPONSABLE DE DEFINICION DEL MANTENIMIENTO | VARCHAR | 50 | SI |  |

### `12-RUBRO DESPERFECTO`  (4 filas)

| # | Columna | Tipo | Tam | Null | Default |
| ---: | --- | --- | ---: | :---: | --- |
| 1 | Id | COUNTER | 10 | NO |  |
| 2 | RUBRO | VARCHAR | 50 | SI |  |

### `13-Sectores`  (11 filas)

| # | Columna | Tipo | Tam | Null | Default |
| ---: | --- | --- | ---: | :---: | --- |
| 1 | Id | COUNTER | 10 | NO |  |
| 2 | SECTOR | VARCHAR | 50 | SI |  |

### `14-TAREA MANTPREV`  (11 filas)

| # | Columna | Tipo | Tam | Null | Default |
| ---: | --- | --- | ---: | :---: | --- |
| 1 | Id | COUNTER | 10 | NO |  |
| 2 | IDENTIFICACION | VARCHAR | 50 | SI |  |
| 3 | TAREA | VARCHAR | 50 | SI |  |

### `15-TIPO DE MANTENIM`  (3 filas)

| # | Columna | Tipo | Tam | Null | Default |
| ---: | --- | --- | ---: | :---: | --- |
| 1 | Id | COUNTER | 10 | NO |  |
| 2 | TIPO DE MANTENIM | VARCHAR | 50 | SI |  |

### `16-TIPO DE REPUESTOS`  (63 filas)

| # | Columna | Tipo | Tam | Null | Default |
| ---: | --- | --- | ---: | :---: | --- |
| 1 | Id | COUNTER | 10 | NO |  |
| 2 | TIPO DE REPUESTO | VARCHAR | 255 | SI |  |

### `17-CARACTER DEL MANTENIM`  (2 filas)

| # | Columna | Tipo | Tam | Null | Default |
| ---: | --- | --- | ---: | :---: | --- |
| 1 | Id | COUNTER | 10 | NO |  |
| 2 | CARACTER DEL MANTENIM | VARCHAR | 50 | SI |  |

### `18-CONDICIONES DE SEGURIDAD`  (33 filas)

| # | Columna | Tipo | Tam | Null | Default |
| ---: | --- | --- | ---: | :---: | --- |
| 1 | Id | COUNTER | 10 | NO |  |
| 2 | RIESGOS | VARCHAR | 50 | SI |  |
| 3 | PRECAUCIONES | VARCHAR | 255 | SI |  |

### `20-funciones Habilitaciones`  (3 filas)

| # | Columna | Tipo | Tam | Null | Default |
| ---: | --- | --- | ---: | :---: | --- |
| 1 | Id | COUNTER | 10 | NO |  |
| 2 | Descripción | VARCHAR | 255 | SI |  |
| 3 | Archivo | LONGBINARY | 1073741823 | SI |  |
| 4 | Observaciones | VARCHAR | 255 | SI |  |

### `21-REGISTR DE INSTRUMENTOS`  (6 filas)

| # | Columna | Tipo | Tam | Null | Default |
| ---: | --- | --- | ---: | :---: | --- |
| 1 | Id | COUNTER | 10 | NO |  |
| 2 | Cod instrumento | INTEGER | 10 | SI |  |
| 3 | Denominacion | VARCHAR | 255 | SI |  |
| 4 | Rango | VARCHAR | 255 | SI |  |
| 5 | Apreciacion | VARCHAR | 255 | SI |  |
| 6 | Marca | VARCHAR | 255 | SI |  |
| 7 | Sector | VARCHAR | 255 | SI |  |
| 8 | Observaciones | VARCHAR | 255 | SI |  |

### `22-Normas`  (6 filas)

| # | Columna | Tipo | Tam | Null | Default |
| ---: | --- | --- | ---: | :---: | --- |
| 1 | Id | COUNTER | 10 | NO |  |
| 2 | SIgla | VARCHAR | 255 | SI |  |
| 3 | Denominacion | VARCHAR | 255 | SI |  |
| 4 | Tipo | VARCHAR | 255 | SI |  |
| 5 | Ultima version | VARCHAR | 255 | SI |  |
| 6 | Observacion | VARCHAR | 255 | SI |  |
| 7 | ORIGEN | VARCHAR | 255 | SI |  |
| 8 | AHIVO PDF | LONGBINARY | 1073741823 | SI |  |

### `23-Asignaturas`  (47 filas)

| # | Columna | Tipo | Tam | Null | Default |
| ---: | --- | --- | ---: | :---: | --- |
| 1 | Id | COUNTER | 10 | NO |  |
| 2 | Asignatura | LONGCHAR | 1073741823 | SI |  |
| 3 | Nive | LONGCHAR | 1073741823 | SI |  |

### `24-Rotaciones Taller`  (3 filas)

| # | Columna | Tipo | Tam | Null | Default |
| ---: | --- | --- | ---: | :---: | --- |
| 1 | Id | COUNTER | 10 | NO |  |
| 2 | Rotación | VARCHAR | 255 | SI |  |
| 3 | Año | VARCHAR | 255 | SI |  |

### `25-MARCA DE MOTORES`  (26 filas)

| # | Columna | Tipo | Tam | Null | Default |
| ---: | --- | --- | ---: | :---: | --- |
| 1 | MARCA | VARCHAR | 50 | SI |  |

### `26-TIPO DE MAQUINAS`  (27 filas)

| # | Columna | Tipo | Tam | Null | Default |
| ---: | --- | --- | ---: | :---: | --- |
| 1 | DENOMINACION | VARCHAR | 255 | SI |  |

### `27-CAMBIOS MEJORAS DE LA TABLA`  (4 filas)

| # | Columna | Tipo | Tam | Null | Default |
| ---: | --- | --- | ---: | :---: | --- |
| 1 | Id | COUNTER | 10 | NO |  |
| 2 | OBJETO | VARCHAR | 255 | SI |  |
| 3 | DESCRIPCION | VARCHAR | 255 | SI |  |
| 4 | INTERVIENEN | VARCHAR | 255 | SI |  |
| 5 | FECHA | DATETIME | 19 | SI |  |
| 6 | OBSERVACIONES | VARCHAR | 255 | SI |  |

### `28-Tabla Capacitación`  (3 filas)

| # | Columna | Tipo | Tam | Null | Default |
| ---: | --- | --- | ---: | :---: | --- |
| 1 | Id | COUNTER | 10 | NO |  |
| 2 | Denominación | VARCHAR | 255 | SI |  |
| 3 | Ente | VARCHAR | 255 | SI |  |
| 4 | Solicita | VARCHAR | 255 | SI |  |
| 5 | Fecha | DATETIME | 19 | SI |  |
| 6 | Observación | VARCHAR | 255 | SI |  |
| 7 | Registró | VARCHAR | 255 | SI |  |

### `29-Aplicaciones web`  (33 filas)

| # | Columna | Tipo | Tam | Null | Default |
| ---: | --- | --- | ---: | :---: | --- |
| 1 | Id | COUNTER | 10 | NO |  |
| 2 | Descripción | VARCHAR | 255 | SI |  |
| 3 | Tipo | VARCHAR | 255 | SI |  |
| 4 | Aplicación Web | LONGCHAR | 1073741823 | SI |  |

### `30-COSTOS DE LOS OM`  (1 filas)

| # | Columna | Tipo | Tam | Null | Default |
| ---: | --- | --- | ---: | :---: | --- |
| 1 | Id | COUNTER | 10 | NO |  |
| 2 | NRO SOLIC | VARCHAR | 50 | SI |  |
| 3 | SECTOR | VARCHAR | 50 | SI |  |
| 4 | SOLICITA | VARCHAR | 255 | SI |  |
| 5 | CARACTER DEL MANTENIM | VARCHAR | 50 | SI |  |
| 6 | CODMAQ | VARCHAR | 50 | SI |  |
| 7 | TIPO DESPERFECTO | VARCHAR | 255 | SI |  |
| 8 | PARTE DEL EQUIPO | VARCHAR | 255 | SI |  |
| 9 | SUPBARTE DEL EQUIPO | VARCHAR | 255 | SI |  |
| 10 | SUBSUBPARTE DEL EQUIPO | VARCHAR | 255 | SI |  |
| 11 | CONDICION EXISTENTE | VARCHAR | 255 | SI |  |
| 12 | CAUSA DE LA CONDICION EXISTENTE | VARCHAR | 255 | SI |  |
| 13 | ACCION REALIZADA | VARCHAR | 255 | SI |  |
| 14 | COSTO MO | REAL | 24 | SI |  |
| 15 | OBSERV MO | VARCHAR | 255 | SI |  |
| 16 | REP1 | VARCHAR | 255 | SI |  |
| 17 | COSTO  REP1 | REAL | 24 | SI |  |
| 18 | REP2 | VARCHAR | 255 | SI |  |
| 19 | COSTO  REP2 | REAL | 24 | SI |  |
| 20 | REP3 | VARCHAR | 255 | SI |  |
| 21 | COSTO  REP3 | REAL | 24 | SI |  |
| 22 | REP4 | VARCHAR | 50 | SI |  |
| 23 | COSTO  REP4 | REAL | 24 | SI |  |
| 24 | REP5 | VARCHAR | 50 | SI |  |
| 25 | COSTO  REP5 | REAL | 24 | SI |  |
| 26 | REP6 | VARCHAR | 255 | SI |  |
| 27 | COSTO  REP6 | REAL | 24 | SI |  |
| 28 | OBSERV PZAS | VARCHAR | 255 | SI |  |
| 29 | EJECUTA | VARCHAR | 255 | SI |  |
| 30 | HS HOM | REAL | 24 | SI |  |
| 31 | HS MAQ | REAL | 24 | SI |  |
| 32 | FECHA INI | DATETIME | 19 | SI |  |
| 33 | FECHA FIN | DATETIME | 19 | SI |  |
| 34 | HS INI | REAL | 24 | SI |  |
| 35 | MIN INI | REAL | 24 | SI |  |
| 36 | HS FIN | REAL | 24 | SI |  |
| 37 | MIN FIN | REAL | 24 | SI |  |
| 38 | OBSERV GENERALES | VARCHAR | 255 | SI |  |
| 39 | CANT TECNICO | INTEGER | 10 | SI |  |
| 40 | CANT INSPECTOR | INTEGER | 10 | SI |  |
| 41 | CANT OFICIAL | INTEGER | 10 | SI |  |
| 42 | CANT OPERARIO | INTEGER | 10 | SI |  |
| 43 | CANT EXTERNO | INTEGER | 10 | SI |  |
| 44 | HTAS OTROS | VARCHAR | 50 | SI |  |
| 45 | CANT OTROS | INTEGER | 10 | SI |  |

### `32- Rotaciones Taller`  (16 filas)

| # | Columna | Tipo | Tam | Null | Default |
| ---: | --- | --- | ---: | :---: | --- |
| 1 | Id | COUNTER | 10 | NO |  |
| 2 | Campo1 | VARCHAR | 255 | SI |  |
| 3 | Campo2 | VARCHAR | 255 | SI |  |

### `33-ACTIVIDADES DE TALLER`  (6 filas)

| # | Columna | Tipo | Tam | Null | Default |
| ---: | --- | --- | ---: | :---: | --- |
| 1 | Id | COUNTER | 10 | NO |  |
| 2 | RUBRO | VARCHAR | 255 | SI |  |
| 3 | DENOFINACION DE LA ACTIVIDAD | VARCHAR | 255 | SI |  |
| 4 | ROTACIONES/AREA | VARCHAR | 255 | SI |  |
| 5 | FECHA | DATETIME | 19 | SI |  |
| 6 | REGISTRA | VARCHAR | 255 | SI |  |
| 7 | OBSERVACIONES | VARCHAR | 255 | SI |  |
| 8 | IMAGENES | LONGBINARY | 1073741823 | SI |  |

### `34-Ingresos`  (3 filas)

| # | Columna | Tipo | Tam | Null | Default |
| ---: | --- | --- | ---: | :---: | --- |
| 1 | Id | COUNTER | 10 | NO |  |
| 2 | tipo de ingreso | VARCHAR | 255 | SI |  |
| 3 | cantidad | REAL | 24 | SI |  |
| 4 | Fecha | DATETIME | 19 | SI |  |
| 5 | Registro | VARCHAR | 255 | SI |  |

### `35-Compras`  (10 filas)

| # | Columna | Tipo | Tam | Null | Default |
| ---: | --- | --- | ---: | :---: | --- |
| 1 | Id | VARCHAR | 255 | SI |  |
| 2 | tipo de gasto | VARCHAR | 255 | SI |  |
| 3 | cantidad | REAL | 24 | SI |  |
| 4 | precio por unidad | INTEGER | 10 | SI |  |
| 5 | Fecha | DATETIME | 19 | SI |  |
| 6 | Registro | VARCHAR | 255 | SI |  |
| 7 | Rotacion | VARCHAR | 255 | SI |  |
| 8 | Actividad | VARCHAR | 255 | SI |  |

### `Copia de 1-004 Proveedores`  (0 filas)

| # | Columna | Tipo | Tam | Null | Default |
| ---: | --- | --- | ---: | :---: | --- |
| 1 | Id | COUNTER | 10 | NO |  |
| 2 | RUBRO | VARCHAR | 255 | SI |  |
| 3 | PROVEEDOR | VARCHAR | 50 | SI |  |
| 4 | CONTACTO | VARCHAR | 50 | SI |  |
| 5 | TELEFONO | VARCHAR | 50 | SI |  |
| 6 | DIRECCION | VARCHAR | 255 | SI |  |
| 7 | e-mail | VARCHAR | 255 | SI |  |
| 8 | Pagina WEb | LONGCHAR | 1073741823 | SI |  |

### `Copia de 10-REGISTRO DE LOS MANTENIMIENTOS`  (2 filas)

| # | Columna | Tipo | Tam | Null | Default |
| ---: | --- | --- | ---: | :---: | --- |
| 1 | Id | COUNTER | 10 | NO |  |
| 2 | NRO SOLIC | VARCHAR | 50 | SI |  |
| 3 | TIPO MANTENIM | VARCHAR | 50 | SI |  |
| 4 | Estado de la OM | VARCHAR | 255 | SI |  |
| 5 | PRIORIDAD | VARCHAR | 255 | SI |  |
| 6 | FECHASOLIC | DATETIME | 19 | SI |  |
| 7 | SECTOR | VARCHAR | 50 | SI |  |
| 8 | SOLICITA | VARCHAR | 255 | SI |  |
| 9 | CARACTER DEL MANTENIM | VARCHAR | 50 | SI |  |
| 10 | CODMAQ | VARCHAR | 50 | SI |  |
| 11 | TIPO DESPERFECTO | VARCHAR | 255 | SI |  |
| 12 | PARTE DEL EQUIPO | VARCHAR | 255 | SI |  |
| 13 | SUPBARTE DEL EQUIPO | VARCHAR | 255 | SI |  |
| 14 | SUBSUBPARTE DEL EQUIPO | VARCHAR | 255 | SI |  |
| 15 | CONDICION EXISTENTE | VARCHAR | 255 | SI |  |
| 16 | CAUSA DE LA CONDICION EXISTENTE | VARCHAR | 255 | SI |  |
| 17 | ACCION REALIZADA | VARCHAR | 255 | SI |  |
| 18 | OBSERV MO | VARCHAR | 255 | SI |  |
| 19 | OBSERV PZAS | VARCHAR | 255 | SI |  |
| 20 | EJECUTA | VARCHAR | 255 | SI |  |
| 21 | HS HOM | REAL | 24 | SI |  |
| 22 | HS MAQ | REAL | 24 | SI |  |
| 23 | FECHA INI | DATETIME | 19 | SI |  |
| 24 | FECHA FIN | DATETIME | 19 | SI |  |
| 25 | HS INI | REAL | 24 | SI |  |
| 26 | MIN INI | REAL | 24 | SI |  |
| 27 | HS FIN | REAL | 24 | SI |  |
| 28 | MIN FIN | REAL | 24 | SI |  |
| 29 | ESTADO DEL EQUIPO | VARCHAR | 255 | SI |  |
| 30 | OBSERV GENERALES | VARCHAR | 255 | SI |  |
| 31 | MAQASOC | VARCHAR | 255 | SI |  |
| 32 | FILTRO DE LA MEJORA | VARCHAR | 50 | SI |  |
| 33 | DESCRIPCION MEJORA | VARCHAR | 255 | SI |  |
| 34 | OBJETIVO MEJORA | VARCHAR | 255 | SI |  |
| 35 | OTRAS ACCIONES TOMADAS | VARCHAR | 255 | SI |  |
| 36 | REGISTRA MEJORA | VARCHAR | 255 | SI |  |
| 37 | CANT TECNICO | INTEGER | 10 | SI |  |
| 38 | CANT INSPECTOR | INTEGER | 10 | SI |  |
| 39 | CANT OFICIAL | INTEGER | 10 | SI |  |
| 40 | CANT OPERARIO | INTEGER | 10 | SI |  |
| 41 | CANT EXTERNO | INTEGER | 10 | SI |  |
| 42 | Htas utilizadas | LONGCHAR | 1073741823 | SI |  |
| 43 | Instrumentos utilizados | LONGCHAR | 1073741823 | SI |  |
| 44 | Jefe de Sección | VARCHAR | 255 | SI |  |
| 45 | Estudiantes que intervienen | LONGCHAR | 1073741823 | SI |  |
| 46 | TIEMPO ACTIV | INTEGER | 10 | SI |  |
| 47 | TIEMPO REALIZAR INF | INTEGER | 10 | SI |  |
| 48 | Intervención de terceros | VARCHAR | 255 | SI |  |
| 49 | Imagen om | LONGBINARY | 1073741823 | SI |  |

### `Switchboard Items`  (1 filas)

| # | Columna | Tipo | Tam | Null | Default |
| ---: | --- | --- | ---: | :---: | --- |
| 1 | SwitchboardID | INTEGER | 10 | SI |  |
| 2 | ItemNumber | SMALLINT | 5 | SI |  |
| 3 | ItemText | VARCHAR | 255 | SI |  |
| 4 | Command | SMALLINT | 5 | SI |  |
| 5 | Argument | VARCHAR | 255 | SI |  |
