// Presentación MantenimientOK — ENTREGA FINAL (~8 min) · deck oscuro
const pptxgen = require('pptxgenjs');
const A = __dirname + '/assets/';
const C = {
  bg: '0E1521', bgAlt: '0A0F18', card: '18212F', card2: '202B3D', line: '2A3648',
  orange: 'EA580C', orangeL: 'F97316', blue: '38BDF8', green: '34D399', red: 'F87171', yellow: 'FBBF24', violet: '8B5CF6',
  txt: 'EEF3F9', mut: '97A3B7', faint: '61708A', white: 'FFFFFF',
};
const F = { h: 'Arial', b: 'Arial' };
const p = new pptxgen();
p.layout = 'LAYOUT_WIDE';
p.defineSlideMaster({ title: 'DARK', background: { color: C.bg } });
const W = 13.33, H = 7.5;

function bgDeco(s, opts = {}) {
  s.background = { color: opts.bg || C.bg };
  s.addShape('ellipse', { x: W - 4.2, y: -2.6, w: 6.2, h: 6.2, fill: { color: opts.glow || C.orange, transparency: 88 }, line: { type: 'none' } });
  s.addShape('ellipse', { x: -2.4, y: H - 3.2, w: 5.6, h: 5.6, fill: { color: C.blue, transparency: 92 }, line: { type: 'none' } });
}
const txt = (s, text, o) => s.addText(text, { isTextBox: true, fontFace: F.b, color: C.txt, ...o });
function chip(s, x, y, label, color) {
  const w = 0.24 + label.length * 0.095 + 0.3;
  s.addShape('roundRect', { x, y, w, h: 0.42, rectRadius: 0.21, fill: { color: C.card2 }, line: { color, width: 1 } });
  s.addText(label, { isTextBox: true, x, y, w, h: 0.42, align: 'center', valign: 'middle', fontFace: F.b, color, fontSize: 11, bold: true, charSpacing: 1, margin: 0 });
}
function dot(s, x, y, d, color, glyph, gcolor, gsize) {
  s.addShape('ellipse', { x, y, w: d, h: d, fill: { color }, line: { type: 'none' } });
  if (glyph) s.addText(glyph, { isTextBox: true, x, y, w: d, h: d, align: 'center', valign: 'middle', fontFace: F.b, color: gcolor || C.white, fontSize: gsize || 15, bold: true, margin: 0 });
}
function framed(s, path, x, y, w, h) {
  s.addShape('roundRect', { x: x - 0.06, y: y - 0.06, w: w + 0.12, h: h + 0.12, rectRadius: 0.1, fill: { color: C.card }, line: { color: C.line, width: 1 },
    shadow: { type: 'outer', color: '000000', opacity: 0.55, blur: 16, offset: 5, angle: 90 } });
  s.addImage({ path, x, y, w, h });
}
const R = 1.579; // aspect de las capturas

// ---------- 1 · Portada ----------
{
  const s = p.addSlide(); bgDeco(s);
  s.addImage({ path: A + 'logo_t.png', x: 0.9, y: 0.72, w: 1.25, h: 1.28 });
  txt(s, 'ETN N°1 OTTO KRAUSE', { x: 2.35, y: 0.86, w: 9, h: 0.4, fontSize: 14, bold: true, color: C.mut, charSpacing: 3 });
  txt(s, 'Prácticas Profesionalizantes · Entrega final · Ciclo 2026', { x: 2.35, y: 1.28, w: 9, h: 0.4, fontSize: 13, color: C.faint });
  s.addText([{ text: 'Mantenimient', options: { color: C.txt } }, { text: 'OK', options: { color: C.orangeL } }],
    { isTextBox: true, x: 0.9, y: 2.72, w: 11.5, h: 1.25, fontSize: 66, bold: true, align: 'left', fontFace: F.h, margin: 0 });
  txt(s, 'Gestión de Mantenimiento del Taller', { x: 0.94, y: 4.05, w: 11, h: 0.7, fontSize: 26, color: C.mut });
  dot(s, 0.95, 5.5, 0.13, C.orange); txt(s, 'Mateo Deluchi', { x: 1.2, y: 5.28, w: 4, h: 0.5, fontSize: 16, bold: true });
  dot(s, 3.15, 5.5, 0.13, C.blue); txt(s, 'Nahuel Jiménez Torres', { x: 3.4, y: 5.28, w: 4.5, h: 0.5, fontSize: 16, bold: true });
  txt(s, 'Computación 6°2', { x: 0.95, y: 5.82, w: 6, h: 0.4, fontSize: 13, color: C.faint });
  chip(s, 0.95, 6.5, 'DEL PROBLEMA A LA SOLUCIÓN', C.orangeL);
  s.addNotes('Presentación final de MantenimientOK. Somos Mateo y Nahuel, de Computación 6°2. Hoy contamos cómo pasamos un sistema viejo de Access a una web moderna para el taller.');
}

// ---------- 2 · El problema (ANTES) ----------
{
  const s = p.addSlide(); bgDeco(s, { glow: C.red });
  chip(s, 0.9, 0.7, 'EL PUNTO DE PARTIDA · ANTES', C.blue);
  txt(s, 'El taller se manejaba con un', { x: 0.9, y: 1.25, w: 11.5, h: 0.7, fontSize: 34, bold: true });
  s.addText([{ text: 'Access viejo', options: { color: C.orangeL } }, { text: ', pesado y poco práctico', options: { color: C.txt } }],
    { isTextBox: true, x: 0.9, y: 1.85, w: 11.5, h: 0.7, fontSize: 34, bold: true, fontFace: F.h, margin: 0 });
  const probs = [
    ['592 MB', 'Una base enorme y lenta, difícil de abrir y de compartir.', C.orange],
    ['Sin web', 'Solo con Access instalado: nada desde la web ni el celular.', C.blue],
    ['Fotos atrapadas', 'Las fotos de los equipos, encerradas como objetos OLE.', C.yellow],
  ];
  let x = 0.9; const cw = 3.71;
  probs.forEach(([t, d, col]) => {
    s.addShape('roundRect', { x, y: 3.15, w: cw, h: 3.35, rectRadius: 0.12, fill: { color: C.card }, line: { color: C.line, width: 1 } });
    dot(s, x + 0.35, 3.5, 0.62, col, '!', C.bg, 24);
    txt(s, t, { x: x + 0.35, y: 4.32, w: cw - 0.7, h: 0.6, fontSize: 22, bold: true, color: col });
    txt(s, d, { x: x + 0.35, y: 5.0, w: cw - 0.7, h: 1.4, fontSize: 14.5, color: C.mut, lineSpacingMultiple: 1.15 });
    x += cw + 0.3;
  });
  s.addNotes('El problema: el taller usaba un Access de 592 MB, atado a una compu, sin acceso web, y con las fotos de las máquinas atrapadas adentro de la base.');
}

// ---------- 3 · Nuestro proceso ----------
{
  const s = p.addSlide(); bgDeco(s);
  chip(s, 0.9, 0.7, 'CÓMO LO HICIMOS', C.green);
  txt(s, 'Nuestro proceso, en 6 etapas', { x: 0.9, y: 1.25, w: 11.5, h: 0.7, fontSize: 34, bold: true });
  const steps = [
    ['1', 'Relevamiento', 'Analizamos el Access viejo', C.orange],
    ['2', 'Diseño', 'Arquitectura y pantallas', C.blue],
    ['3', 'Desarrollo', 'Extracción de datos + web', C.green],
    ['4', 'Prueba', 'Testeo y página piloto', C.yellow],
    ['5', 'Mejoras', 'Roles + asistente Otto', C.violet],
    ['6', 'Entrega', 'Versión final', C.orangeL],
  ];
  const n = steps.length, x0 = 1.2, x1 = 12.1, cy = 3.6;
  const gap = (x1 - x0) / (n - 1);
  s.addShape('line', { x: x0, y: cy, w: x1 - x0, h: 0, line: { color: C.line, width: 2 } });
  steps.forEach(([num, t, d, col], i) => {
    const cx = x0 + gap * i;
    dot(s, cx - 0.33, cy - 0.33, 0.66, col, num, C.bg, 20);
    txt(s, t, { x: cx - 1.0, y: cy + 0.5, w: 2.0, h: 0.4, fontSize: 15, bold: true, align: 'center' });
    txt(s, d, { x: cx - 1.1, y: cy + 0.92, w: 2.2, h: 0.8, fontSize: 12, color: C.mut, align: 'center', lineSpacingMultiple: 1.1 });
  });
  txt(s, 'Trabajamos todos los martes y miércoles, del 1 de septiembre al 27 de octubre.', { x: 0.9, y: 6.2, w: 11.5, h: 0.5, fontSize: 14, color: C.faint, align: 'center', italic: true });
  s.addNotes('Dividimos el proyecto en 6 etapas: relevamiento, diseño, desarrollo, prueba, mejoras y entrega. Trabajamos los martes y miércoles durante casi dos meses.');
}

// ---------- 4 · Rescatamos los datos ----------
{
  const s = p.addSlide(); bgDeco(s, { glow: C.green });
  chip(s, 0.9, 0.7, 'MIGRACIÓN DE DATOS', C.green);
  txt(s, 'Rescatamos todo del sistema viejo', { x: 0.9, y: 1.2, w: 11.5, h: 0.7, fontSize: 33, bold: true });
  txt(s, 'Nada inventado: cada equipo, orden y foto sale de la base original.', { x: 0.9, y: 1.85, w: 11.5, h: 0.5, fontSize: 15, color: C.mut });
  const stats = [['40', 'tablas migradas', C.orange], ['733', 'registros reales', C.blue], ['102', 'fotos rescatadas', C.green], ['592 MB', 'a 15 MB en la web', C.yellow]];
  let x = 0.9; const sw = 2.72;
  stats.forEach(([nn, l, col]) => {
    s.addShape('roundRect', { x, y: 2.65, w: sw, h: 1.7, rectRadius: 0.12, fill: { color: C.card }, line: { color: C.line, width: 1 } });
    txt(s, nn, { x: x + 0.1, y: 2.85, w: sw - 0.2, h: 0.8, fontSize: 32, bold: true, color: col, align: 'center' });
    txt(s, l, { x: x + 0.1, y: 3.68, w: sw - 0.2, h: 0.5, fontSize: 13, color: C.mut, align: 'center' });
    x += sw + 0.24;
  });
  const iw = 7.2, ih = iw / R;
  framed(s, A + 'equipos2.png', (W - iw) / 2, 4.62, iw, ih);
  s.addNotes('Migramos 40 tablas y 733 registros, y recuperamos 102 fotos atrapadas como objetos OLE. Acá se ven las fichas de equipos con las fotos reales del taller.');
}

// ---------- 5 · La solución (AHORA) ----------
{
  const s = p.addSlide(); bgDeco(s);
  chip(s, 0.9, 0.7, 'AHORA', C.orangeL);
  s.addText([{ text: 'Una app web\n', options: { color: C.txt } }, { text: 'moderna y ágil', options: { color: C.orangeL } }],
    { isTextBox: true, x: 0.9, y: 1.2, w: 5.5, h: 1.5, fontSize: 32, bold: true, fontFace: F.h, margin: 0, lineSpacingMultiple: 1.02 });
  txt(s, 'Reemplaza al Access con un panel claro, los datos reales del taller y acceso desde cualquier navegador.', { x: 0.9, y: 2.9, w: 5.4, h: 1.2, fontSize: 15.5, color: C.mut, lineSpacingMultiple: 1.25 });
  const feats = [['Panel con indicadores en vivo', C.orange], ['Órdenes de trabajo tipo Kanban', C.blue], ['Equipos con ficha y foto real', C.green], ['Preventivo, repuestos y reportes', C.yellow]];
  let fy = 4.05;
  feats.forEach(([t, col]) => { dot(s, 0.95, fy + 0.03, 0.26, col, '✓', C.bg, 13); txt(s, t, { x: 1.35, y: fy - 0.06, w: 5.2, h: 0.45, fontSize: 15.5, bold: true }); fy += 0.66; });
  const iw = 6.0, ih = iw / R;
  framed(s, A + 'panel.png', 6.75, 1.5, iw, ih);
  txt(s, 'Panel de control · datos reales del taller', { x: 6.75, y: 1.5 + ih + 0.12, w: iw, h: 0.4, fontSize: 12, italic: true, color: C.faint, align: 'center' });
  s.addNotes('La solución: MantenimientOK. Un panel con indicadores, órdenes de trabajo en tablero Kanban, equipos con foto, preventivo, repuestos y reportes.');
}

// ---------- 6 · Un usuario para cada uno ----------
{
  const s = p.addSlide(); bgDeco(s, { glow: C.violet });
  chip(s, 0.9, 0.7, 'ACCESO POR ROL · LOGIN', C.violet);
  txt(s, 'Cada uno entra con su usuario', { x: 0.9, y: 1.2, w: 11.5, h: 0.7, fontSize: 33, bold: true });
  const iw = 5.3, ih = iw / R;
  framed(s, A + 'login.png', 0.9, 2.05, iw, ih);
  const roles = [
    ['shield', 'Administrador', 'Aprueba profesores, resuelve pedidos y gestiona a todos.', C.violet],
    ['book', 'Profesor', 'Reporta fallas, sube fotos, pide repuestos y asigna tareas.', C.orange],
    ['cap', 'Alumno', 'Ve sus tareas y su pase digital de taller.', C.blue],
  ];
  let ry = 2.2; const rx = 6.7;
  roles.forEach(([ic, t, d, col]) => {
    s.addShape('roundRect', { x: rx, y: ry, w: 5.7, h: 1.25, rectRadius: 0.12, fill: { color: C.card }, line: { color: C.line, width: 1 } });
    dot(s, rx + 0.3, ry + 0.33, 0.6, col, iconGlyph(ic), C.bg, 16);
    txt(s, t, { x: rx + 1.1, y: ry + 0.2, w: 4.4, h: 0.4, fontSize: 17, bold: true, color: col });
    txt(s, d, { x: rx + 1.1, y: ry + 0.62, w: 4.5, h: 0.6, fontSize: 13, color: C.mut, lineSpacingMultiple: 1.05 });
    ry += 1.45;
  });
  txt(s, 'Los profes nuevos se registran y el administrador los aprueba.', { x: 6.7, y: 6.55, w: 5.7, h: 0.4, fontSize: 12.5, color: C.faint, italic: true });
  s.addNotes('Agregamos login con usuario y contraseña. Hay tres roles: administrador, profesor y alumno, y cada uno ve y puede cosas distintas. Los profes nuevos se registran y el admin los aprueba.');
}
function iconGlyph(n) { return n === 'shield' ? '★' : n === 'book' ? '✎' : '●'; }

// ---------- 7 · Fácil para el taller ----------
{
  const s = p.addSlide(); bgDeco(s);
  chip(s, 0.9, 0.7, 'PENSADO PARA EL TALLER', C.orangeL);
  txt(s, 'Fácil, hasta sin saber de compu', { x: 0.9, y: 1.2, w: 6.4, h: 0.7, fontSize: 31, bold: true });
  const items = [
    ['Asistente "Otto"', 'Un chatbot que guía a los profes de mecánica con lenguaje simple.', C.orange],
    ['Tour guiado', 'Muestra la página paso a paso la primera vez.', C.blue],
    ['Código QR por equipo', 'Se pega en la máquina y abre su ficha desde el celular.', C.green],
    ['Subir fotos y manuales', 'El profe actualiza la ficha del equipo en segundos.', C.yellow],
  ];
  let fy = 2.15;
  items.forEach(([t, d, col]) => {
    dot(s, 0.95, fy + 0.05, 0.4, col, '✓', C.bg, 12);
    txt(s, t, { x: 1.5, y: fy - 0.05, w: 5.0, h: 0.4, fontSize: 16, bold: true });
    txt(s, d, { x: 1.5, y: fy + 0.36, w: 5.1, h: 0.7, fontSize: 13, color: C.mut, lineSpacingMultiple: 1.1 });
    fy += 1.15;
  });
  const iw = 5.7, ih = iw / R;
  framed(s, A + 'chatbot.png', 7.1, 1.6, iw, ih);
  txt(s, 'Panel docente + asistente Otto', { x: 7.1, y: 1.6 + ih + 0.1, w: iw, h: 0.4, fontSize: 12, italic: true, color: C.faint, align: 'center' });
  s.addNotes('Lo pensamos para que sea fácil, sobre todo para los profes de taller que no manejan mucho la compu: un asistente chatbot que los guía, un tour, código QR por máquina y subida de fotos en segundos.');
}

// ---------- 8 · Antes vs Ahora ----------
{
  const s = p.addSlide(); bgDeco(s);
  chip(s, 0.9, 0.7, 'EL CAMBIO', C.blue);
  txt(s, 'Antes vs Ahora', { x: 0.9, y: 1.2, w: 11.5, h: 0.7, fontSize: 34, bold: true });
  const col = (x, titulo, color, items, ico) => {
    s.addShape('roundRect', { x, y: 2.15, w: 5.7, h: 4.6, rectRadius: 0.14, fill: { color: C.card }, line: { color: C.line, width: 1 } });
    dot(s, x + 0.35, 2.5, 0.5, color, ico, C.bg, 16);
    txt(s, titulo, { x: x + 1.0, y: 2.52, w: 4.4, h: 0.5, fontSize: 19, bold: true, color });
    let yy = 3.35;
    items.forEach((it) => { txt(s, it[0] ? '✓' : '✕', { x: x + 0.4, y: yy, w: 0.4, h: 0.4, fontSize: 14, bold: true, color: it[0] ? C.green : C.red, margin: 0 });
      txt(s, it[1], { x: x + 0.85, y: yy - 0.03, w: 4.65, h: 0.55, fontSize: 13.5, color: C.txt, margin: 0, lineSpacingMultiple: 1.05 }); yy += 0.62; });
  };
  col(0.9, 'ANTES · Access', C.red, [[0, 'Base de 592 MB, lenta'], [0, 'Solo en una computadora'], [0, 'Sin acceso web ni celular'], [0, 'Fotos atrapadas en la base'], [0, 'Un solo tipo de usuario']], '✕');
  col(6.73, 'AHORA · MantenimientOK', C.green, [[1, 'App web liviana y rápida'], [1, 'Se abre desde cualquier lado'], [1, 'Login por rol con contraseña'], [1, 'Fotos reales + QR por equipo'], [1, 'Admin, profesor y alumno']], '✓');
  s.addNotes('El cambio en una imagen: pasamos de un Access pesado, local y de un solo usuario, a una web liviana, accesible desde cualquier lado, con login por rol y las fotos reales de las máquinas.');
}

// ---------- 9 · Cierre ----------
{
  const s = p.addSlide(); bgDeco(s, { bg: C.bgAlt });
  s.addImage({ path: A + 'logo_t.png', x: 6.04, y: 0.95, w: 1.25, h: 1.28 });
  s.addText([{ text: 'El mantenimiento del taller,\n', options: { color: C.txt } }, { text: 'ágil y en la web', options: { color: C.orangeL } }],
    { isTextBox: true, x: 1, y: 2.6, w: 11.33, h: 1.6, fontSize: 40, bold: true, align: 'center', fontFace: F.h, lineSpacingMultiple: 1.05 });
  txt(s, 'De un Access de 592 MB a una plataforma web con roles, asistente y los datos reales del taller.', { x: 2.2, y: 4.3, w: 8.9, h: 0.9, fontSize: 16, color: C.mut, align: 'center', lineSpacingMultiple: 1.2 });
  s.addShape('roundRect', { x: 3.9, y: 5.35, w: 5.5, h: 0.6, rectRadius: 0.3, fill: { color: C.card }, line: { color: C.orange, width: 1 } });
  txt(s, 'Probala online · mantenimientok', { x: 3.9, y: 5.35, w: 5.5, h: 0.6, fontSize: 14, bold: true, color: C.orangeL, align: 'center', valign: 'middle', margin: 0 });
  txt(s, 'Mateo Deluchi · Nahuel Jiménez Torres   —   Computación 6°2 · ETN N°1 Otto Krause · Ciclo 2026', { x: 1, y: 6.45, w: 11.33, h: 0.4, fontSize: 12, color: C.faint, align: 'center' });
  s.addNotes('Cierre: logramos una plataforma moderna, con login por rol y un asistente que la hace fácil para todos. Está online para probarla. ¡Gracias!');
}

p.writeFile({ fileName: __dirname + '/MantenimientOK - Presentacion Final.pptx' }).then((f) => console.log('OK ->', f));
