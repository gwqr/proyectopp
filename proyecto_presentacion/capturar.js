// Captura pantallas reales de la app (localhost:8000) para la presentación.
const puppeteer = require('puppeteer-core');
const fs = require('fs');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT = __dirname + '\\assets';
fs.mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function shot(page, hash, theme, file, waitSel) {
  await page.evaluateOnNewDocument((th) => {
    try { localStorage.setItem('gmao-theme', th); } catch (e) {}
  }, theme);
  await page.goto('http://localhost:8000/' + hash, { waitUntil: 'networkidle2' });
  await page.evaluate((th) => { document.documentElement.dataset.theme = th; }, theme);
  if (waitSel) { try { await page.waitForSelector(waitSel, { timeout: 5000 }); } catch (e) {} }
  await sleep(1400); // dejar animar charts y fade-ins
  await page.screenshot({ path: OUT + '\\' + file });
  console.log('shot', file);
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    defaultViewport: { width: 1500, height: 950, deviceScaleFactor: 2 },
    args: ['--hide-scrollbars', '--force-device-scale-factor=2'],
  });
  const page = await browser.newPage();

  await shot(page, '#/panel', 'dark', 'panel_dark.png', '.kpi');
  await shot(page, '#/panel', 'light', 'panel_light.png', '.kpi');
  await shot(page, '#/equipos', 'dark', 'equipos_dark.png', '.equipo-card');
  await shot(page, '#/equipos', 'light', 'equipos_light.png', '.equipo-card');
  await shot(page, '#/ordenes', 'dark', 'ordenes_dark.png', '.kanban');
  await shot(page, '#/reportes', 'dark', 'reportes_dark.png', '.card');
  await shot(page, '#/preventivo', 'light', 'preventivo_light.png', '.data');

  // ficha de equipo con foto (abrir drawer del primer equipo con foto)
  await page.evaluateOnNewDocument((th) => { try { localStorage.setItem('gmao-theme', th); } catch (e) {} }, 'dark');
  await page.goto('http://localhost:8000/#/equipos', { waitUntil: 'networkidle2' });
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
  await sleep(1200);
  await page.evaluate(() => { const c = document.querySelector('.equipo-card'); if (c) c.click(); });
  await sleep(1600);
  await page.screenshot({ path: OUT + '\\ficha_dark.png' });
  console.log('shot ficha_dark.png');

  await browser.close();
  console.log('LISTO');
})();
