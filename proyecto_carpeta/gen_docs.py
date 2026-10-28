# -*- coding: utf-8 -*-
"""Genera la Agenda de actividades (xlsx) y vuelca las entradas a JSON
para la carpeta de campo (docx se arma con Node)."""
import json, datetime
import openpyxl
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from openpyxl.utils import get_column_letter

ROOT = r"C:\Users\Mateo\Downloads\w\proyecto_carpeta"

M = "Mateo Deluchi"
N = "Nahuel Jiménez Torres"
AMBOS = "Mateo Deluchi - Nahuel Jiménez Torres"
EQ = "Equipo completo"
POS = "Buena organización y buen cumplimiento de las tareas"
POS2 = "Avanzamos a buen ritmo y resolvimos todo lo planificado"
NEG = "No se encuentran aspectos negativos"

# (fecha, fase, titulo_bold, descripcion, responsable, horas, positivo, negativo, lugar, pia_marker)
E = [
 ("2026-09-01","Relevamiento.","Arranque del proyecto. Analizamos el sistema de mantenimiento que usa hoy el taller de la escuela, hecho en Microsoft Access (una base .mdb de ~592 MB protegida con contraseña). Identificamos los problemas principales: es pesada y lenta, obliga a tener Access instalado, no se puede usar desde la web ni el celular y las fotos de los equipos están atrapadas como objetos OLE. Definimos el objetivo: migrar todo a una aplicación web moderna y más ágil.",
  EQ,"4:00",POS,NEG,"HECHO EN CLASE",None),
 ("2026-09-02","Fase 1: Relevamiento.","Delimitación de las funciones clave del sistema MantenimientOK. Establecimos que la plataforma debe cubrir: órdenes de trabajo, mantenimiento preventivo, ficha de equipos con foto, stock de repuestos, registro de técnicos e indicadores de gestión (MTBF, MTTR, cumplimiento). Relevamos las 40 tablas de la base original para saber qué información conservar.",
  EQ,"3:30",POS,NEG,"HECHO EN CLASE",None),
 ("2026-09-08","Fase 2: Diseño.","Definición de la arquitectura del sistema: un backend liviano en Python (FastAPI) con base de datos SQLite y un frontend web con HTML, CSS y JavaScript. Elegimos esta combinación por ser rápida de levantar, no requerir Access ni servidores pesados y poder correr en cualquier computadora del taller.",
  AMBOS,"4:00",POS,NEG,"HECHO EN CLASE",None),
 ("2026-09-09","Fase 2: Diseño.","Comienzo del diseño de la interfaz (UI). Definimos la identidad visual (estética industrial, prolija, con tema claro y oscuro) y los bocetos del panel principal con la navegación entre módulos: Panel, Órdenes de trabajo, Preventivo, Equipos, Repuestos, Técnicos y Reportes.",
  M,"4:30",POS,NEG,"HECHO EN CASA",None),
 ("2026-09-15","Fase 2: Diseño.","Diseño de la vista de Órdenes de Trabajo (tablero Kanban con columnas Pendiente, En proceso y Cerradas) y de la ficha de Equipos con pestañas (información, motores, historial y preventivo). También bocetamos el Panel de control con sus indicadores y gráficos.",
  N,"4:00",POS,NEG,"HECHO EN CLASE",None),
 ("2026-09-16","Fase 3: Desarrollo.","Configuración del entorno de programación y conexión con la base Access. Instalamos el driver ODBC (Microsoft Access Database Engine) y logramos abrir la base .mdb con su contraseña para leer todo su contenido sin tener Access instalado.",
  M,"5:00",POS,"Costó resolver el driver y el bitness correcto de Access, pero se solucionó","HECHO EN CLASE",None),
 ("2026-09-22","Fase 3: Desarrollo.","Extracción de los datos reales. Exportamos las 40 tablas de la base original a archivos CSV y documentamos el esquema completo (columnas, tipos y relaciones). En total recuperamos 733 registros entre equipos, órdenes, repuestos, planes y técnicos.",
  EQ,"4:00",POS2,NEG,"HECHO EN CLASE",None),
 ("2026-09-23","Fase 3: Desarrollo.","Recuperación de las fotos de los equipos. Estaban guardadas como objetos OLE dentro de la base; programamos un extractor que reconstruye cada imagen (JPG y BMP) para recuperar 102 fotos y vincularlas a su equipo. Después las optimizamos para la web, bajando de 264 MB a 15 MB.",
  AMBOS,"4:30",POS,"Las fotos OLE llevaron más tiempo del previsto","HECHO EN CLASE",None),
 ("2026-09-29","Fase 3: Desarrollo.","Programación del backend con FastAPI y carga de los datos reales a una base SQLite. Construimos los endpoints de la API para todos los módulos (equipos, órdenes, preventivo, repuestos, técnicos y reportes).",
  M,"4:00",POS,NEG,"HECHO EN CLASE",None),
 ("2026-09-30","Fase 3: Desarrollo.","Implementación de los módulos Órdenes de Trabajo (Kanban con arrastre), Equipos (ficha con foto real e historial), Preventivo (43 planes con generación de OT) y Repuestos (stock con alerta de mínimos).",
  N,"4:30",POS2,NEG,"HECHO EN CASA",None),
 ("2026-10-06","Fase 3: Desarrollo.","Programación del Panel de control con indicadores (OT abiertas y vencidas, cumplimiento, disponibilidad, MTBF y MTTR) y gráficos, más el módulo de Reportes. Rediseño visual completo: glassmorphism, iconografía propia, animaciones y buscador global.",
  AMBOS,"4:30",POS2,NEG,"HECHO EN CLASE",None),
 ("2026-10-07","Fase 4: Prueba e Implementación.","Pruebas del prototipo y despliegue de la página piloto en un hosting gratuito, quedando operativa con un enlace público para abrir desde el celular y la computadora. Verificamos todos los módulos con los datos reales del taller.",
  EQ,"3:30",POS,NEG,"HECHO EN CLASE",None),
 ("2026-10-13","Presentación del Proyecto.","Defensa y demostración de MantenimientOK ante el curso. Expusimos desde el planteo del problema (el Access viejo) hasta la solución, con una demo en vivo navegando la página: panel, equipos con foto, Kanban de órdenes y reportes.",
  EQ,"4:00",POS2,NEG,"HECHO EN CLASE",None),
 ("2026-10-14","Fase 5: Mejoras y Actualizaciones.","Planificación de las mejoras post-presentación. Diseñamos el sistema de usuarios con tres roles (administrador, profesor y alumno) y definimos qué puede ver y hacer cada uno, pensando especialmente en que sea fácil para los profes de taller.",
  EQ,"2:30",POS,NEG,"HECHO EN CLASE","COMIENZO PIA"),
 ("2026-10-20","Fase 5: Mejoras y Actualizaciones.","Desarrollo del inicio de sesión por rol y de los paneles. Programamos el Panel docente (reportar fallas, subir fotos de equipos, subir manuales, pedir repuestos y asignar tareas) y el Panel de administración (aprobar profesores y resolver los pedidos de repuestos).",
  M,"5:00",POS2,NEG,"HECHO EN CLASE",None),
 ("2026-10-21","Fase 5: Mejoras y Actualizaciones.","Panel del alumno con sus tareas y su pase digital de taller, asignación de tareas de profe a alumno, código QR por equipo, notificaciones y el asistente virtual Otto: un chatbot guiado que explica la página con lenguaje simple para los profes de mecánica que no manejan mucho la computadora.",
  N,"5:00",POS2,NEG,"HECHO EN CASA",None),
 ("2026-10-27","Entrega Final.","Pruebas finales de los tres roles, del asistente y del tour guiado. Desplegamos la versión final con un enlace público y dejamos lista la documentación. El proyecto cumple el objetivo: ordenar el mantenimiento del taller de forma ágil, moderna y accesible para toda la comunidad educativa.",
  EQ,"4:00",POS2,NEG,"HECHO EN CLASE","CIERRE PIA"),
]

def fdate(s):
    y,m,d = map(int, s.split("-")); return datetime.datetime(y,m,d)
def dia_lbl(s):
    wd = fdate(s).weekday(); return "Martes" if wd==1 else "Miércoles"

# -------- JSON para la carpeta --------
entries = [{"fecha": dia_lbl(x[0])+" "+fdate(x[0]).strftime("%d/%m"), "fase": x[1], "texto": " "+x[2], "pia": x[8]} for x in E]
open(ROOT+r"\carpeta_entries.json","w",encoding="utf-8").write(json.dumps(entries,ensure_ascii=False,indent=1))

# -------- Agenda xlsx --------
wb = openpyxl.Workbook(); ws = wb.active; ws.title = "Agenda MantenimientOK"
headers = ["Fecha","Cant. Horas Trabajadas","Descripción de las actividades realizadas","Responsable","Aspectos positivos","Aspectos Negativos","Hecho en"]
thin = Side(style="thin", color="D0D0D0")
border = Border(left=thin,right=thin,top=thin,bottom=thin)
hfill = PatternFill("solid", fgColor="EA580C")
pia_fill = PatternFill("solid", fgColor="FFE8D6")
for c,h in enumerate(headers,1):
    cell = ws.cell(1,c,h); cell.font = Font(bold=True, color="FFFFFF", name="Calibri", size=11)
    cell.fill = hfill; cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True); cell.border = border
r = 2
for (f,fase,desc,resp,hs,pos,neg,lug,pia) in E:
    if pia == "COMIENZO PIA":
        ws.cell(r,1,"COMIENZO PIA"); ws.cell(r,1).font = Font(bold=True, color="EA580C")
        for cc in range(1,8): ws.cell(r,cc).fill = pia_fill; ws.cell(r,cc).border = border
        r += 1
    h,mn = hs.split(":")
    ws.cell(r,1, fdate(f)); ws.cell(r,1).number_format = "dd/mm/yyyy"
    ws.cell(r,2, f"{int(h)}:{mn} hs")
    ws.cell(r,3, fase+" "+desc.strip())
    ws.cell(r,4, resp)
    ws.cell(r,5, pos)
    ws.cell(r,6, neg)
    ws.cell(r,7, lug)
    for cc in range(1,8):
        cell = ws.cell(r,cc); cell.border = border
        cell.alignment = Alignment(vertical="top", wrap_text=True, horizontal="center" if cc in (1,2,7) else "left")
        cell.font = Font(name="Calibri", size=10)
    r += 1
# cierre
ws.cell(r,1,"CIERRE PIA — Entrega final"); ws.cell(r,1).font = Font(bold=True, color="EA580C")
for cc in range(1,8): ws.cell(r,cc).fill = pia_fill; ws.cell(r,cc).border = border

ws.column_dimensions['A'].width = 13
ws.column_dimensions['B'].width = 14
ws.column_dimensions['C'].width = 70
ws.column_dimensions['D'].width = 26
ws.column_dimensions['E'].width = 30
ws.column_dimensions['F'].width = 26
ws.column_dimensions['G'].width = 15
ws.freeze_panes = "A2"
from openpyxl.worksheet.properties import PageSetupProperties
ws.page_setup.orientation = "landscape"
ws.page_setup.fitToWidth = 1
ws.page_setup.fitToHeight = 0
ws.sheet_properties.pageSetUpPr = PageSetupProperties(fitToPage=True)
ws.page_margins.left = ws.page_margins.right = 0.3
ws.print_title_rows = "1:1"
total_h = sum(int(x[4].split(":")[0]) for x in E) + sum(int(x[4].split(":")[1]) for x in E)/60
ws.cell(r+2,2, f"Total aprox.: {total_h:.1f} hs")
ws.cell(r+2,2).font = Font(bold=True)
wb.save(ROOT+r"\Agenda de actividades - MantenimientOK.xlsx")
print("Agenda y JSON generados.", len(E), "entradas · total", round(total_h,1), "hs")
