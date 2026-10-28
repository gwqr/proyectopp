// Ensambla la versión estática (single-file HTML) para el Artifact / Vercel.
const fs = require('fs');
const W = 'C:/Users/Mateo/Downloads/w';
const HERE = __dirname;

const css = fs.readFileSync(W + '/webapp/static/css/app.css', 'utf8');
const indexHtml = fs.readFileSync(W + '/webapp/templates/index.html', 'utf8');
let appjs = fs.readFileSync(W + '/webapp/static/js/app.js', 'utf8');
const datajs = fs.readFileSync(HERE + '/data.js', 'utf8');
const logicjs = fs.readFileSync(HERE + '/logic.js', 'utf8');

// --- adaptar app.js: api() local + theme robusto ---
const apiFetchBlock = `const api = async (path, opts = {}) => {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) throw new Error(\`\${res.status} \${res.statusText}\`);
  return res.status === 204 ? null : res.json();
};`;
const apiLocal = `const api = async (path, opts = {}) => window.LOCAL_API(path, opts);`;
if (!appjs.includes(apiFetchBlock)) { console.error('!! no se encontró el bloque api() fetch'); process.exit(1); }
appjs = appjs.replace(apiFetchBlock, apiLocal);

const themeBlock = `const storedTheme = localStorage.getItem('gmao-theme');
if (storedTheme) document.documentElement.dataset.theme = storedTheme;`;
const themeLocal = `let storedTheme = null; try { storedTheme = localStorage.getItem('gmao-theme'); } catch (e) {}
if (storedTheme) document.documentElement.dataset.theme = storedTheme;
else if (!document.documentElement.dataset.theme && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) document.documentElement.dataset.theme = 'dark';`;
if (!appjs.includes(themeBlock)) { console.error('!! no se encontró el bloque theme'); process.exit(1); }
appjs = appjs.replace(themeBlock, themeLocal);
appjs = appjs.replace(`localStorage.setItem('gmao-theme', cur);`, `try { localStorage.setItem('gmao-theme', cur); } catch (e) {}`);

// --- extraer el markup del body del index.html (sprite + aside + main + drawer + modal + toast) ---
const startMarker = '<!-- SVG sprite';
const scriptMarker = '<script src="/static/js/chart.umd.min.js">';
const bodyMarkup = indexHtml.slice(indexHtml.indexOf(startMarker), indexHtml.indexOf(scriptMarker)).trim();

// --- @media prefers-color-scheme: replicar tokens dark para viewers en modo sistema ---
// tomamos el bloque [data-theme="dark"] { ... } y lo espejamos en el media query
const darkStart = css.indexOf('[data-theme="dark"] {');
const darkEnd = css.indexOf('}', css.indexOf('--sh-brand', darkStart)) + 1;
const darkTokens = css.slice(css.indexOf('{', darkStart) + 1, darkEnd - 1).trim();
const mediaBlock = `\n@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {\n${darkTokens}\n} }\n`;

const html = `<title>MantenimientOK</title>
<style>
${css}
${mediaBlock}
</style>
${bodyMarkup}
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.4/chart.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
<script>
${datajs}
</script>
<script>
${logicjs}
</script>
<script type="module">
${appjs}
</script>
`;

fs.writeFileSync(HERE + '/index.html', html);
const mb = fs.statSync(HERE + '/index.html').size / (1024 * 1024);
console.log('index.html:', mb.toFixed(2), 'MB');
