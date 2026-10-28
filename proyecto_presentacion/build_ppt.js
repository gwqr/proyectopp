// Presentación MantenimientOK — deck oscuro premium (pptxgenjs)
const pptxgen = require('pptxgenjs');
const A = __dirname + '/assets/';

const C = {
  bg: '0E1521', bgAlt: '0A0F18', card: '18212F', card2: '202B3D',
  line: '2A3648', orange: 'EA580C', orangeL: 'F97316', blue: '38BDF8',
  green: '34D399', red: 'F87171', yellow: 'FBBF24',
  txt: 'EEF3F9', mut: '97A3B7', faint: '61708A', white: 'FFFFFF',
};
const F = { h: 'Arial', b: 'Arial' };

const p = new pptxgen();
p.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5
p.defineSlideMaster({ title: 'DARK', background: { color: C.bg } });
const W = 13.33, H = 7.5;

// ---------- helpers ----------
function bgDeco(s, opts = {}) {
  s.background = { color: opts.bg || C.bg };
  // glow naranja arriba-derecha
  s.addShape('ellipse', { x: W - 4.2, y: -2.6, w: 6.2, h: 6.2, fill: { color: C.orange, transparency: 88 }, line: { type: 'none' } });
  // glow azul abajo-izquierda
  s.addShape('ellipse', { x: -2.4, y: H - 3.2, w: 5.6, h: 5.6, fill: { color: C.blue, transparency: 92 }, line: { type: 'none' } });
}
function txt(s, text, o) { s.addText(text, { isTextBox: true, fontFace: F.b, color: C.txt, ...o }); }
function chip(s, x, y, label, color) {
  const w = 0.24 + label.length * 0.098 + 0.3;
  s.addShape('roundRect', { x, y, w, h: 0.42, rectRadius: 0.21, fill: { color: C.card2 }, line: { color: color, width: 1 } });
  s.addText(label, { isTextBox: true, x, y, w, h: 0.42, align: 'center', valign: 'middle', fontFace: F.b, color: color, fontSize: 11, bold: true, charSpacing: 1, margin: 0 });
  return w;
}
function dot(s, x, y, d, color, glyph, gcolor, gsize) {
  s.addShape('ellipse', { x, y, w: d, h: d, fill: { color }, line: { type: 'none' } });
  if (glyph) s.addText(glyph, { isTextBox: true, x, y, w: d, h: d, align: 'center', valign: 'middle', fontFace: F.b, color: gcolor || C.white, fontSize: gsize || 15, bold: true, margin: 0 });
}
function framedImage(s, path, x, y, w, h) {
  s.addShape('roundRect', { x: x - 0.06, y: y - 0.06, w: w + 0.12, h: h + 0.12, rectRadius: 0.1, fill: { color: C.card }, line: { color: C.line, width: 1 },
    shadow: { type: 'outer', color: '000000', opacity: 0.55, blur: 16, offset: 5, angle: 90 } });
  s.addImage({ path, x, y, w, h, rounding: false });
}

// ============================================================
// SLIDE 1 — Portada
// ============================================================
{
  const s = p.addSlide();
  bgDeco(s);
  // logo badge
  s.addImage({ path: A + 'logo_t.png', x: 0.9, y: 0.72, w: 1.25, h: 1.28 });
  txt(s, 'ETN N°1 OTTO KRAUSE', { x: 2.35, y: 0.86, w: 8, h: 0.4, fontSize: 14, bold: true, color: C.mut, charSpacing: 3 });
  txt(s, 'Prácticas Profesionalizantes · Ciclo 2026', { x: 2.35, y: 1.28, w: 8, h: 0.4, fontSize: 13, color: C.faint });

  // Título en una sola línea, con "OK" en naranja
  s.addText([
    { text: 'Mantenimient', options: { color: C.txt } },
    { text: 'OK', options: { color: C.orangeL } },
  ], { isTextBox: true, x: 0.9, y: 2.72, w: 11.5, h: 1.25, fontSize: 66, bold: true, align: 'left', fontFace: F.h, margin: 0 });

  txt(s, 'Gestión de Mantenimiento del Taller', { x: 0.94, y: 4.05, w: 11, h: 0.7, fontSize: 26, color: C.mut });

  // linea integrantes
  dot(s, 0.95, 5.5, 0.13, C.orange);
  txt(s, 'Mateo Deluchi', { x: 1.2, y: 5.28, w: 4, h: 0.5, fontSize: 16, bold: true });
  dot(s, 3.15, 5.5, 0.13, C.blue);
  txt(s, 'Nahuel Jiménez Torres', { x: 3.4, y: 5.28, w: 4.5, h: 0.5, fontSize: 16, bold: true });
  txt(s, 'Computación 6°2', { x: 0.95, y: 5.82, w: 6, h: 0.4, fontSize: 13, color: C.faint });

  chip(s, 0.95, 6.55, 'PROYECTO EN DESARROLLO', C.orangeL);
  s.addNotes('Presentación del proyecto MantenimientOK: sistema web de gestión de mantenimiento para el taller de la escuela. Integrantes: Mateo Deluchi y Nahuel Jiménez Torres, Computación 6°2, ETN N°1 Otto Krause.');
}

// ============================================================
// SLIDE 2 — El problema
// ============================================================
{
  const s = p.addSlide();
  bgDeco(s);
  chip(s, 0.9, 0.7, 'EL PUNTO DE PARTIDA', C.blue);
  txt(s, 'El taller gestiona su mantenimiento', { x: 0.9, y: 1.25, w: 11.5, h: 0.7, fontSize: 34, bold: true });
  s.addText([
    { text: 'con una base de ', options: { color: C.txt } },
    { text: 'Microsoft Access', options: { color: C.orangeL } },
    { text: ' vieja y pesada', options: { color: C.txt } },
  ], { isTextBox: true, x: 0.9, y: 1.85, w: 11.5, h: 0.7, fontSize: 34, bold: true, fontFace: F.h, margin: 0 });

  const probs = [
    ['592 MB', 'Una base .mdb enorme, lenta de abrir y difícil de compartir.', C.orange],
    ['Sin web', 'Solo funciona con Access instalado: no se puede usar desde la web ni el celular.', C.blue],
    ['Fotos atrapadas', 'Las imágenes de los equipos están embebidas como objetos OLE, casi imposibles de recuperar.', C.yellow],
  ];
  let x = 0.9;
  const cw = 3.71, gap = 0.3;
  probs.forEach(([t, d, col]) => {
    s.addShape('roundRect', { x, y: 3.15, w: cw, h: 3.35, rectRadius: 0.12, fill: { color: C.card }, line: { color: C.line, width: 1 } });
    dot(s, x + 0.35, 3.5, 0.62, col, '!', C.bg, 24);
    txt(s, t, { x: x + 0.35, y: 4.32, w: cw - 0.7, h: 0.6, fontSize: 22, bold: true, color: col });
    txt(s, d, { x: x + 0.35, y: 5.0, w: cw - 0.7, h: 1.4, fontSize: 14.5, color: C.mut, lineSpacingMultiple: 1.15 });
    x += cw + gap;
  });
  s.addNotes('El problema: el sistema actual es un Access pesado (592 MB), atado a la PC, sin acceso web, y con las fotos de los equipos atrapadas dentro de la base.');
}

// ============================================================
// SLIDE 3 — La solución (captura panel)
// ============================================================
{
  const s = p.addSlide();
  bgDeco(s);
  chip(s, 0.9, 0.7, 'NUESTRA PROPUESTA', C.orangeL);
  s.addText([
    { text: 'Una app web\n', options: { color: C.txt } },
    { text: 'moderna y ágil', options: { color: C.orangeL } },
  ], { isTextBox: true, x: 0.9, y: 1.2, w: 5.5, h: 1.5, fontSize: 32, bold: true, fontFace: F.h, margin: 0, lineSpacingMultiple: 1.02 });
  txt(s, 'Reemplaza al Access por un panel claro, con los datos reales del taller y acceso desde cualquier navegador.',
    { x: 0.9, y: 2.85, w: 5.4, h: 1.2, fontSize: 15.5, color: C.mut, lineSpacingMultiple: 1.25 });

  const feats = [
    ['Panel con indicadores en vivo', C.orange],
    ['Órdenes de trabajo tipo Kanban', C.blue],
    ['Equipos con ficha y foto real', C.green],
    ['Tema claro / oscuro', C.yellow],
  ];
  let fy = 4.35;
  feats.forEach(([t, col]) => {
    dot(s, 0.95, fy + 0.03, 0.26, col, '✓', C.bg, 13);
    txt(s, t, { x: 1.35, y: fy - 0.06, w: 5.2, h: 0.45, fontSize: 15.5, bold: true });
    fy += 0.66;
  });

  framedImage(s, A + 'panel_dark.png', 6.75, 1.35, 6.0, 3.8);
  txt(s, 'Panel de control · datos reales del taller', { x: 6.75, y: 5.32, w: 6, h: 0.4, fontSize: 12, italic: true, color: C.faint, align: 'center' });
  s.addNotes('La solución: MantenimientOK, una aplicación web que muestra un panel con indicadores, órdenes de trabajo, equipos con foto y más, usando los datos reales que rescatamos del Access.');
}

// ============================================================
// SLIDE 4 — Rescate de datos (stats + captura equipos)
// ============================================================
{
  const s = p.addSlide();
  bgDeco(s);
  chip(s, 0.9, 0.7, 'MIGRACIÓN DE DATOS', C.green);
  txt(s, 'Rescatamos todo del sistema viejo', { x: 0.9, y: 1.2, w: 11.5, h: 0.7, fontSize: 33, bold: true });
  txt(s, 'Nada inventado: cada equipo, orden y foto sale de la base original.', { x: 0.9, y: 1.85, w: 11.5, h: 0.5, fontSize: 15, color: C.mut });

  const stats = [
    ['40', 'tablas migradas', C.orange],
    ['733', 'registros reales', C.blue],
    ['102', 'fotos rescatadas', C.green],
    ['592 MB', 'a 15 MB en la web', C.yellow],
  ];
  let x = 0.9; const sw = 2.72, sgap = 0.24;
  stats.forEach(([n, l, col]) => {
    s.addShape('roundRect', { x, y: 2.7, w: sw, h: 1.75, rectRadius: 0.12, fill: { color: C.card }, line: { color: C.line, width: 1 } });
    txt(s, n, { x: x + 0.1, y: 2.92, w: sw - 0.2, h: 0.8, fontSize: 34, bold: true, color: col, align: 'center' });
    txt(s, l, { x: x + 0.1, y: 3.75, w: sw - 0.2, h: 0.5, fontSize: 13.5, color: C.mut, align: 'center' });
    x += sw + sgap;
  });

  // explicación OLE -> imagen
  s.addShape('roundRect', { x: 0.9, y: 4.75, w: 5.4, h: 1.95, rectRadius: 0.12, fill: { color: C.card } , line: { color: C.line, width: 1 }});
  dot(s, 1.25, 5.05, 0.5, C.orange, '★', C.bg, 16);
  txt(s, 'Lo más difícil: las fotos', { x: 1.95, y: 5.0, w: 4.2, h: 0.5, fontSize: 16, bold: true });
  txt(s, 'Las imágenes estaban guardadas como objetos OLE. Programamos un extractor que reconstruye cada archivo (JPG y BMP) y lo vincula a su equipo.',
    { x: 1.25, y: 5.6, w: 4.85, h: 1.1, fontSize: 13.5, color: C.mut, lineSpacingMultiple: 1.15 });

  framedImage(s, A + 'equipos_dark.png', 6.7, 4.85, 5.7, 2.25);
  txt(s, 'Fichas de equipos con las fotos reales recuperadas', { x: 6.7, y: 7.18, w: 5.7, h: 0.3, fontSize: 11, italic: true, color: C.faint, align: 'center' });
  s.addNotes('Migramos 40 tablas y 733 registros, y recuperamos 102 fotos que estaban atrapadas como objetos OLE dentro del Access. Todo con datos reales del taller.');
}

// ============================================================
// SLIDE 5 — Módulos (captura kanban)
// ============================================================
{
  const s = p.addSlide();
  bgDeco(s);
  chip(s, 0.9, 0.7, 'LA PLATAFORMA', C.blue);
  txt(s, 'Qué hace MantenimientOK', { x: 0.9, y: 1.2, w: 11.5, h: 0.7, fontSize: 33, bold: true });

  const mods = [
    ['Panel', 'KPIs, gráficos y vencimientos', C.orange],
    ['Órdenes de trabajo', 'Tablero Kanban + alta y edición', C.blue],
    ['Preventivo', '43 planes, genera OT al instante', C.green],
    ['Equipos', 'Ficha técnica con foto e historial', C.yellow],
    ['Repuestos', 'Stock con alerta de mínimos', C.orangeL],
    ['Reportes', 'MTBF, MTTR y carga por sector', C.blue],
  ];
  let y = 2.25; const rh = 0.79;
  mods.forEach(([t, d, col], i) => {
    const yy = 2.25 + (i % 3) * (rh + 0.16);
    const xx = i < 3 ? 0.9 : 3.55;
    dot(s, xx, yy, 0.5, col, String(i + 1), C.bg, 15);
    txt(s, t, { x: xx + 0.68, y: yy - 0.06, w: 2.1, h: 0.4, fontSize: 15.5, bold: true });
    txt(s, d, { x: xx + 0.68, y: yy + 0.31, w: 2.2, h: 0.5, fontSize: 11.5, color: C.mut });
  });

  framedImage(s, A + 'ordenes_dark.png', 6.35, 2.05, 6.05, 3.85);
  txt(s, 'Tablero Kanban de órdenes de trabajo', { x: 6.35, y: 6.05, w: 6.05, h: 0.35, fontSize: 12, italic: true, color: C.faint, align: 'center' });
  s.addNotes('La plataforma tiene 6 módulos: Panel, Órdenes de trabajo (Kanban), Preventivo, Equipos, Repuestos y Reportes. Acá se ve el tablero Kanban para mover las órdenes entre pendientes, en proceso y cerradas.');
}

// ============================================================
// SLIDE 6 — Hecho vs Pendiente
// ============================================================
{
  const s = p.addSlide();
  bgDeco(s);
  chip(s, 0.9, 0.7, 'EN QUÉ ESTAMOS', C.orangeL);
  txt(s, 'Un prototipo que ya funciona', { x: 0.9, y: 1.2, w: 8, h: 0.7, fontSize: 33, bold: true });
  txt(s, 'Es una muestra: la base está andando, pero todavía queda camino por delante.', { x: 0.9, y: 1.85, w: 11.5, h: 0.5, fontSize: 15, color: C.mut });

  // progreso
  txt(s, 'Avance del proyecto', { x: 0.9, y: 2.5, w: 4, h: 0.4, fontSize: 12, bold: true, color: C.mut, charSpacing: 1 });
  txt(s, '70%', { x: 10.9, y: 2.4, w: 1.5, h: 0.5, fontSize: 18, bold: true, color: C.green, align: 'right' });
  s.addShape('roundRect', { x: 0.9, y: 2.95, w: 11.5, h: 0.28, rectRadius: 0.14, fill: { color: C.card2 }, line: { type: 'none' } });
  s.addShape('roundRect', { x: 0.9, y: 2.95, w: 11.5 * 0.7, h: 0.28, rectRadius: 0.14, fill: { color: C.green }, line: { type: 'none' } });

  // dos columnas
  s.addShape('roundRect', { x: 0.9, y: 3.55, w: 5.65, h: 3.5, rectRadius: 0.12, fill: { color: C.card }, line: { color: C.line, width: 1 } });
  dot(s, 1.25, 3.85, 0.42, C.green, '✓', C.bg, 15);
  txt(s, 'Ya funciona', { x: 1.8, y: 3.83, w: 4, h: 0.45, fontSize: 17, bold: true, color: C.green });
  const done = ['Extracción de los datos reales del Access', 'Panel con KPIs y gráficos', 'Órdenes de trabajo (Kanban)', 'Ficha de equipos con foto real', 'Preventivo, Repuestos y Reportes', 'Tema claro/oscuro y búsqueda global'];
  let dy = 4.5;
  done.forEach((t) => { txt(s, '✓', { x: 1.25, y: dy, w: 0.35, h: 0.35, fontSize: 13, bold: true, color: C.green, margin: 0 }); txt(s, t, { x: 1.6, y: dy - 0.03, w: 4.75, h: 0.42, fontSize: 13, color: C.txt, margin: 0 }); dy += 0.4; });

  s.addShape('roundRect', { x: 6.75, y: 3.55, w: 5.65, h: 3.5, rectRadius: 0.12, fill: { color: C.card }, line: { color: C.line, width: 1 } });
  dot(s, 7.1, 3.85, 0.42, C.orangeL, '○', C.bg, 15);
  txt(s, 'Próximos pasos', { x: 7.65, y: 3.83, w: 4, h: 0.45, fontSize: 17, bold: true, color: C.orangeL });
  const todo = ['Sistema de usuarios y login', 'Publicación online (deploy)', 'Acceso por código QR desde el celular', 'Notificaciones automáticas de vencimientos', 'Carga de nuevas fotos desde la app', 'Versión móvil para el taller'];
  let ty = 4.5;
  todo.forEach((t) => { txt(s, '○', { x: 7.1, y: ty, w: 0.35, h: 0.35, fontSize: 13, bold: true, color: C.orangeL, margin: 0 }); txt(s, t, { x: 7.45, y: ty - 0.03, w: 4.8, h: 0.42, fontSize: 13, color: C.txt, margin: 0 }); ty += 0.4; });
  s.addNotes('El proyecto es una muestra en desarrollo (~70%). Ya funciona el núcleo: extracción de datos, panel, órdenes, equipos con foto, preventivo, repuestos y reportes. Queda pendiente el login, el deploy online, el acceso por QR, las notificaciones y la versión móvil.');
}

// ============================================================
// SLIDE 7 — Cierre
// ============================================================
{
  const s = p.addSlide();
  bgDeco(s, { bg: C.bgAlt });
  s.addImage({ path: A + 'logo_t.png', x: 6.04, y: 1.0, w: 1.25, h: 1.28 });
  s.addText([
    { text: 'El mantenimiento del taller,\n', options: { color: C.txt } },
    { text: 'ágil y en la web', options: { color: C.orangeL } },
  ], { isTextBox: true, x: 1, y: 2.7, w: 11.33, h: 1.6, fontSize: 40, bold: true, align: 'center', fontFace: F.h, lineSpacingMultiple: 1.05 });
  txt(s, 'De una base de Access de 592 MB a una plataforma web moderna, con los datos y las fotos reales del taller.',
    { x: 2.4, y: 4.5, w: 8.53, h: 0.9, fontSize: 16, color: C.mut, align: 'center', lineSpacingMultiple: 1.2 });

  // firma
  txt(s, 'MantenimientOK', { x: 1, y: 5.75, w: 11.33, h: 0.4, fontSize: 14, bold: true, color: C.txt, align: 'center' });
  txt(s, 'Mateo Deluchi · Nahuel Jiménez Torres   —   Computación 6°2 · ETN N°1 Otto Krause · Ciclo 2026',
    { x: 1, y: 6.12, w: 11.33, h: 0.4, fontSize: 12, color: C.faint, align: 'center' });
  s.addNotes('Cierre: logramos migrar un sistema pesado de Access a una plataforma web moderna y ágil, conservando todos los datos y fotos reales del taller. Gracias.');
}

p.writeFile({ fileName: __dirname + '/MantenimientOK - Presentacion.pptx' }).then((f) => console.log('OK ->', f));
