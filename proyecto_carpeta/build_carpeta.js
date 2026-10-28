// Carpeta de Campo - MantenimientOK (entrega final) · ETN N°1 Otto Krause
const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, AlignmentType, ImageRun, PageBreak, Header, PageNumber } = require('docx');

const NEG = '1F1F1F'; const FONT = 'Arial';
const center = (runs, opts = {}) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120, ...(opts.spacing || {}) }, children: runs });
const justify = (runs) => new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 220, line: 276 }, children: runs });
const t = (text, sz, opts = {}) => new TextRun({ text, bold: true, font: FONT, size: sz, color: opts.color || NEG, ...opts });

const logo = fs.readFileSync(__dirname + '/assets/logo.png');
const entries = JSON.parse(fs.readFileSync(__dirname + '/carpeta_entries.json', 'utf8'));

const portada = [
  center([t('ETN N°1 OTTO KRAUSE', 34)], { spacing: { before: 400, after: 200 } }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new ImageRun({ type: 'png', data: logo, transformation: { width: 210, height: 215 } })] }),
  center([t('CARPETA DE CAMPO', 28)]),
  center([t('PRÁCTICAS PROFESIONALIZANTES', 26)], { spacing: { after: 320 } }),
  center([t('PROYECTO:', 26)], { spacing: { after: 60 } }),
  center([t('MantenimientOK — Gestión de Mantenimiento del Taller', 26)], { spacing: { after: 320 } }),
  center([t('GRUPO:', 26)], { spacing: { after: 60 } }),
  center([t('Jiménez Torres Nahuel, Mateo Deluchi', 26)], { spacing: { after: 320 } }),
  center([t('Computación 6°2', 26)], { spacing: { after: 60 } }),
  center([t('Ciclo 2026', 26)]),
  new Paragraph({ children: [new PageBreak()] }),
];

const bitacora = [];
for (const e of entries) {
  bitacora.push(center([t(e.fecha, 22)], { spacing: { before: 120, after: 80 } }));
  bitacora.push(justify([t(e.fase, 22), t(e.texto, 22)]));
}

const doc = new Document({
  creator: 'MantenimientOK', title: 'Carpeta de Campo - MantenimientOK',
  styles: { default: { document: { run: { font: FONT, size: 22, color: NEG } } } },
  sections: [{
    properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ children: [PageNumber.CURRENT], bold: true, font: FONT, size: 22, color: NEG })] })] }) },
    children: [...portada, ...bitacora],
  }],
});
Packer.toBuffer(doc).then((buf) => { fs.writeFileSync(__dirname + '/CARPETA DE CAMPO - MantenimientOK.docx', buf); console.log('OK docx', buf.length, 'bytes ·', entries.length, 'entradas'); });
