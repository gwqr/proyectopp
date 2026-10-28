// Capturas v3 (login + roles + chatbot) para la presentación.
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT = __dirname + '\\assets';
const URL = 'http://127.0.0.1:8100/index.html';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CU = {
  admin: { id: 'u_admin', nombre: 'Mateo Deluchi', rol: 'admin', usuario: 'admin1', pass: 'admin1', estado: 'activo' },
  profesor: { id: 'u_sosa', nombre: 'Eduardo Sosa', rol: 'profesor', usuario: 'profe1', pass: 'profe1', sector: 'Unión y conformado', estado: 'activo' },
  alumno: { id: 'u_lucas', nombre: 'Lucas Pérez', rol: 'alumno', usuario: 'alumno1', pass: 'alumno1', curso: '6°2', legajo: '4821', estado: 'activo' },
};
const TAREAS = [{ id: 'tk1', titulo: 'Limpiar y lubricar el torno paralelo', detalle: 'Engrasar guías y husillo, revisar nivel de aceite.', equipo: 'Torno paralelo', asignadoA: 'Lucas Pérez', asignadoAId: 'u_lucas', asignadoPor: 'Eduardo Sosa', asignadoPorId: 'u_sosa', estado: 'pendiente', fecha: '2026-10-20' }];
const PEDIDOS = [{ id: 'pd1', repuesto: 'Correa trapezoidal A-48', cantidad: 2, motivo: 'Para el torno del sector', solicitadoPor: 'Eduardo Sosa', solicitadoPorId: 'u_sosa', estado: 'pendiente', fecha: '2026-10-21' }];

async function prep(page, cu) {
  await page.evaluateOnNewDocument((cuObj, tareas, pedidos) => {
    try {
      localStorage.clear();
      localStorage.setItem('gmao-theme', 'dark');
      if (cuObj) localStorage.setItem('mok_cu', JSON.stringify(cuObj));
      localStorage.setItem('mok_tareas', JSON.stringify(tareas));
      localStorage.setItem('mok_pedidos', JSON.stringify(pedidos));
      localStorage.setItem('mok_onboarded', JSON.stringify({ admin: 1, profesor: 1, alumno: 1 }));
    } catch (e) {}
  }, cu, TAREAS, PEDIDOS);
}

async function shot(page, cu, hash, file, opts = {}) {
  await prep(page, cu);
  await page.goto(URL + '?r=' + Date.now() + (hash || ''), { waitUntil: 'networkidle2' });
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
  await sleep(1300);
  if (opts.openChat) { await page.evaluate(() => { const l = document.querySelector('#chatLauncher'); if (l) l.click(); }); await sleep(900); }
  await page.screenshot({ path: OUT + '\\' + file });
  console.log('shot', file);
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', defaultViewport: { width: 1500, height: 950, deviceScaleFactor: 2 }, args: ['--hide-scrollbars', '--force-device-scale-factor=2'] });
  const page = await browser.newPage();
  await shot(page, null, '', 'login.png');                       // login (sin cu)
  await shot(page, CU.admin, '#/panel', 'panel.png');
  await shot(page, CU.profesor, '#/docente', 'panel_docente.png');
  await shot(page, CU.profesor, '#/docente', 'chatbot.png', { openChat: true });
  await shot(page, CU.admin, '#/admin', 'admin.png');
  await shot(page, CU.alumno, '#/mis-tareas', 'mis_tareas.png');
  await shot(page, CU.profesor, '#/equipos', 'equipos2.png');
  await browser.close();
  console.log('LISTO');
})();
