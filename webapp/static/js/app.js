/* ================================================================
   GMAO Web · SPA (vanilla ES modules)
   ================================================================ */

// -------- helpers --------
const api = async (path, opts = {}) => {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.status === 204 ? null : res.json();
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const el = (tag, attrs = {}, ...children) => {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2).toLowerCase(), v);
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    node.append(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
  }
  return node;
};

// svg icon helper -> returns an <svg><use/></svg> element
const icon = (name, cls) => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '1em');
  svg.setAttribute('height', '1em');
  svg.style.flexShrink = '0';
  if (cls) svg.setAttribute('class', cls);
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', '#i-' + name);
  svg.append(use);
  return svg;
};

const fmtDate = (s) => {
  if (!s) return '—';
  try { return new Date(s + (s.length <= 10 ? 'T00:00:00' : '')).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return s; }
};
const fmtNum = (n, d = 0) => (n === null || n === undefined || n === '' ? '—' : Number(n).toLocaleString('es-AR', { minimumFractionDigits: d, maximumFractionDigits: d }));
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const estadoLabel = { pendiente: 'Pendiente', en_proceso: 'En proceso', cerrada: 'Cerrada' };
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

// -------- theme --------
const themeBtn = $('#themeToggle');
const storedTheme = localStorage.getItem('gmao-theme');
if (storedTheme) document.documentElement.dataset.theme = storedTheme;
themeBtn.addEventListener('click', () => {
  const cur = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = cur;
  localStorage.setItem('gmao-theme', cur);
  if (currentRoute === 'panel' || currentRoute === 'reportes') router();
});

// -------- date --------
$('#todayDate').textContent = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

// -------- toast --------
const toast = (msg, type = 'ok') => {
  const ico = type === 'err' ? 'alert' : type === 'info' ? 'clock' : 'check';
  const t = el('div', { class: `toast ${type}` }, icon(ico), msg);
  $('#toastWrap').append(t);
  setTimeout(() => { t.style.animation = 'fadeIn .3s reverse'; setTimeout(() => t.remove(), 280); }, 2400);
};

// -------- drawer --------
const drawer = $('#drawer');
const openDrawer = (title, body) => {
  $('#drawerTitle').textContent = title;
  $('#drawerBody').replaceChildren(...(Array.isArray(body) ? body.filter(Boolean) : [body]));
  drawer.hidden = false; drawer.style.display = '';
};
const closeDrawer = () => { drawer.hidden = true; drawer.style.display = 'none'; };
drawer.addEventListener('click', (e) => {
  if (e.target === drawer || e.target.closest('[data-drawer-close]')) closeDrawer();
});

// -------- modal --------
const modal = $('#modal');
const openModal = (title, body) => {
  $('#modalTitle').textContent = title;
  $('#modalBody').replaceChildren(...(Array.isArray(body) ? body.filter(Boolean) : [body]));
  modal.hidden = false; modal.style.display = '';
};
const closeModal = () => { modal.hidden = true; modal.style.display = 'none'; };
modal.addEventListener('click', (e) => {
  if (e.target === modal || e.target.closest('[data-modal-close]')) closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeDrawer(); closeModal(); hideSearch(); }
});

// -------- catálogos cache --------
let catalogos = null;
const getCatalogos = async () => (catalogos ||= await api('/api/catalogos'));

// ================================================================
//  BÚSQUEDA GLOBAL
// ================================================================
const searchInput = $('#globalSearch');
const searchBox = $('#searchResults');
let searchTimer = null;

const hideSearch = () => { searchBox.hidden = true; };
document.addEventListener('click', (e) => { if (!e.target.closest('.search-box')) hideSearch(); });

searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  const q = searchInput.value.trim();
  if (q.length < 2) { hideSearch(); return; }
  searchTimer = setTimeout(() => runSearch(q), 220);
});
searchInput.addEventListener('focus', () => { if (searchInput.value.trim().length >= 2) runSearch(searchInput.value.trim()); });

document.addEventListener('keydown', (e) => {
  if (e.key === '/' && document.activeElement !== searchInput && !/input|textarea|select/i.test(document.activeElement.tagName)) {
    e.preventDefault(); searchInput.focus();
  }
});

async function runSearch(q) {
  let data;
  try { data = await api('/api/buscar?q=' + encodeURIComponent(q)); }
  catch { return; }
  const groups = [
    ['Equipos', data.equipos, (r) => ({ main: r.denominacion || `Equipo #${r.id}`, sub: [r.codigo, r.sector].filter(Boolean).join(' · '), thumb: r.foto, go: () => { hideSearch(); openEquipo(r.id); } })],
    ['Órdenes', data.ordenes, (r) => ({ main: r.nro_solic || `OT #${r.id}`, sub: [r.codmaq, r.tipo_mant].filter(Boolean).join(' · '), go: () => { hideSearch(); openOrden(r.id); } })],
    ['Repuestos', data.repuestos, (r) => ({ main: r.parte || r.nro || `Repuesto #${r.id}`, sub: [r.marca, r.especificacion].filter(Boolean).join(' · '), go: () => { hideSearch(); location.hash = '#/repuestos'; } })],
    ['Técnicos', data.tecnicos, (r) => ({ main: r.nombre, sub: [r.funcion, r.sector].filter(Boolean).join(' · '), go: () => { hideSearch(); location.hash = '#/tecnicos'; } })],
  ];
  const total = groups.reduce((s, [, arr]) => s + arr.length, 0);
  searchBox.replaceChildren();
  if (!total) { searchBox.append(el('div', { class: 'search-empty' }, `Sin resultados para “${q}”`)); searchBox.hidden = false; return; }
  for (const [title, arr, map] of groups) {
    if (!arr.length) continue;
    searchBox.append(el('div', { class: 'search-group-title' }, title));
    for (const r of arr) {
      const m = map(r);
      searchBox.append(el('div', { class: 'search-item', onclick: m.go },
        m.thumb ? el('img', { class: 'si-thumb', src: m.thumb }) : el('div', { class: 'si-thumb' }),
        el('div', {}, el('div', { class: 'si-main' }, m.main), m.sub ? el('div', { class: 'si-sub' }, m.sub) : null),
      ));
    }
  }
  searchBox.hidden = false;
}

// ================================================================
//  CHART.JS estilo
// ================================================================
const chartInstances = [];
function destroyCharts() { while (chartInstances.length) { try { chartInstances.pop().destroy(); } catch {} } }
function css(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }
function chartDefaults() {
  const grid = css('--line'); const text = css('--fg-mute');
  Chart.defaults.font.family = "'Inter', sans-serif";
  Chart.defaults.font.size = 11.5;
  Chart.defaults.color = text;
  return { grid, text };
}
function mkChart(ctx, config) {
  const c = new Chart(ctx, config);
  chartInstances.push(c);
  return c;
}

// ================================================================
//  VISTAS
// ================================================================
const views = {};

// ---------- helpers de UI ----------
const kpiCard = (k) => el('div', { class: `card kpi ${k.cls || ''}` },
  el('div', { class: 'kpi-top' },
    el('div', { class: 'label' }, k.label),
    el('div', { class: 'kpi-icon' }, icon(k.icon)),
  ),
  el('div', { class: 'value' }, k.value),
  k.progress !== undefined ? el('div', { class: 'progress' + (k.progressOk ? ' ok' : '') }, el('span', { style: `width:${Math.min(100, k.progress)}%` })) : null,
  k.foot ? el('div', { class: 'foot' }, k.footIcon ? icon(k.footIcon) : null, k.foot) : null,
);

const emptyState = (title, sub, ico = 'inbox') => el('div', { class: 'empty' }, icon(ico), el('div', { class: 'e-title' }, title), sub ? el('div', { class: 'e-sub' }, sub) : null);

const skeletonPanel = () => el('div', { class: 'view-enter' },
  el('div', { class: 'sk-grid', style: 'margin-bottom:16px' }, ...Array.from({ length: 5 }, () => el('div', { class: 'skeleton sk-card' }))),
  el('div', { class: 'skeleton', style: 'height:300px;border-radius:18px' }),
);

// ================================================================
//  PANEL
// ================================================================
views.panel = async () => {
  const d = await api('/api/panel');
  const kpis = [
    { label: 'Equipos', value: d.totales.equipos, cls: 'brand', icon: 'cog', foot: `${d.totales.planes} planes preventivos`, footIcon: 'calendar' },
    { label: 'OT abiertas', value: d.ordenes_abiertas, cls: 'warn', icon: 'clipboard', foot: `${d.ordenes_vencidas} vencidas`, footIcon: 'alert' },
    { label: 'Cumplimiento prev.', value: `${d.cumplimiento_preventivo}%`, cls: 'ok', icon: 'check', progress: d.cumplimiento_preventivo, progressOk: true },
    { label: 'Disponibilidad', value: d.disponibilidad !== null ? `${d.disponibilidad}%` : '—', cls: 'info', icon: 'gauge', foot: `MTBF ${fmtNum(d.mtbf, 0)}h · MTTR ${fmtNum(d.mttr, 1)}h`, footIcon: 'clock' },
    { label: 'Repuestos bajo mín.', value: d.repuestos_bajo_min.length, cls: d.repuestos_bajo_min.length ? 'danger' : 'ok', icon: 'box' },
  ];

  const maxSector = Math.max(1, ...d.por_sector.map((s) => s.c));

  const root = el('div', { class: 'view-enter' },
    el('div', { class: 'page-header' },
      el('div', { class: 'ph-left' }, el('h1', {}, 'Panel de control'), el('div', { class: 'subtitle' }, 'Vista general del módulo de mantenimiento del taller')),
    ),
    el('div', { class: 'grid kpis' }, ...kpis.map(kpiCard)),

    el('div', { class: 'grid two', style: 'margin-top:16px' },
      el('div', { class: 'card' },
        el('div', { class: 'card-head' }, el('h3', {}, 'Órdenes por mes'), el('div', { class: 'seg' }, el('button', { class: 'active' }, '6 meses'))),
        el('div', { style: 'height:260px' }, el('canvas', { id: 'chSerie' })),
      ),
      el('div', { class: 'card' },
        el('div', { class: 'card-head' }, el('h3', {}, 'Estado de las OT'), el('div', { class: 'ch-icon' }, icon('clipboard'))),
        el('div', { style: 'height:260px' }, el('canvas', { id: 'chEstado' })),
      ),
    ),

    el('div', { class: 'grid two', style: 'margin-top:16px' },
      el('div', { class: 'card' },
        el('div', { class: 'card-head' }, el('h3', {}, 'Carga por sector'), el('div', { class: 'ch-icon' }, icon('pin'))),
        d.por_sector.length ? el('div', { class: 'barlist' }, ...d.por_sector.map((s) => el('div', { class: 'bl-row' },
          el('div', { class: 'bl-head' }, el('span', { class: 'bl-name' }, s.sector), el('span', { class: 'bl-val' }, s.c)),
          el('div', { class: 'bl-track' }, el('div', { class: 'bl-fill', style: `width:${(s.c / maxSector) * 100}%` })),
        ))) : emptyState('Sin datos de sector'),
      ),
      el('div', { class: 'card' },
        el('div', { class: 'card-head' }, el('h3', {}, 'Próximos vencimientos'), el('div', { class: 'ch-icon' }, icon('clock'))),
        d.proximos_vencimientos.length ? el('div', { class: 'vlist' }, ...d.proximos_vencimientos.map((o) => {
          const dt = o.vence ? new Date(o.vence + 'T00:00:00') : null;
          return el('div', { class: 'vitem', style: 'cursor:pointer', onclick: () => openOrden(o.id) },
            el('div', { class: 'vdate' }, dt ? el('div', { class: 'vd-day' }, dt.getDate()) : null, dt ? el('div', { class: 'vd-mon' }, MESES[dt.getMonth()]) : '—'),
            el('div', { class: 'vmain' }, el('div', { class: 'vm-title' }, o.nro_solic || `OT #${o.id}`), el('div', { class: 'vm-sub' }, o.codmaq || 'Sin equipo')),
            el('span', { class: `badge ${(o.prioridad || '').toLowerCase()}` }, o.prioridad || 'MEDIA'),
          );
        })) : emptyState('Nada por vencer', 'Todo al día ✓', 'check'),
      ),
    ),

    el('div', { class: 'grid two', style: 'margin-top:16px' },
      el('div', { class: 'card' },
        el('div', { class: 'card-head' }, el('h3', {}, 'Equipos con más OT'), el('div', { class: 'ch-icon' }, icon('cog'))),
        d.top_equipos.length ? el('div', { class: 'table-wrap' }, el('table', { class: 'data' },
          el('tbody', {}, ...d.top_equipos.map((e) => el('tr', { style: 'cursor:pointer', onclick: () => openEquipo(e.id) },
            el('td', { style: 'width:44px' }, e.foto ? el('img', { src: e.foto, style: 'width:34px;height:34px;border-radius:8px;object-fit:cover' }) : el('div', { style: 'width:34px;height:34px;border-radius:8px;background:var(--surface-3)' })),
            el('td', { class: 'cell-strong' }, e.denominacion || `Equipo #${e.id}`),
            el('td', { class: 'cell-mute mono' }, e.codigo || `id ${e.id}`),
            el('td', { class: 'num' }, el('span', { class: 'badge' }, `${e.n_ot} OT`)),
          ))),
        )) : emptyState('Sin OT registradas'),
      ),
      el('div', { class: 'card' },
        el('div', { class: 'card-head' }, el('h3', {}, 'Actividad reciente'), el('div', { class: 'ch-icon' }, icon('bolt'))),
        d.actividad.length ? el('div', { class: 'feed' }, ...d.actividad.map((a) => el('div', { class: 'feed-item' },
          el('div', { class: `feed-ico ${a.tipo}` }, icon(a.tipo === 'alta' ? 'plus' : a.tipo === 'baja' ? 'trash' : a.tipo === 'estado' ? 'arrow-right' : 'edit')),
          el('div', { class: 'feed-main' }, a.detalle, el('div', { class: 'feed-time' }, a.ts)),
        ))) : emptyState('Sin actividad'),
      ),
    ),
  );

  root._postmount = () => {
    const { grid } = chartDefaults();
    const brand = css('--brand'), info = css('--info'), ok = css('--ok'), warn = css('--warn');
    mkChart($('#chSerie'), {
      type: 'bar',
      data: {
        labels: d.serie_mensual.map((s) => { const [y, m] = s.mes.split('-'); return `${MESES[+m - 1]} ${y.slice(2)}`; }),
        datasets: [
          { label: 'Correctivo', data: d.serie_mensual.map((s) => s.correctivo), backgroundColor: brand, borderRadius: 6, maxBarThickness: 26 },
          { label: 'Preventivo', data: d.serie_mensual.map((s) => s.preventivo), backgroundColor: info, borderRadius: 6, maxBarThickness: 26 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, pointStyle: 'circle', padding: 16, boxWidth: 8 } } },
        scales: { x: { grid: { display: false }, border: { display: false } }, y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: grid }, border: { display: false } } },
      },
    });
    const est = d.estados;
    mkChart($('#chEstado'), {
      type: 'doughnut',
      data: {
        labels: est.map((s) => estadoLabel[s.estado] || s.estado),
        datasets: [{ data: est.map((s) => s.c), backgroundColor: [warn, info, ok, css('--fg-faint')], borderWidth: 0, hoverOffset: 6 }],
      },
      options: { responsive: true, maintainAspectRatio: false, cutout: '66%', plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, pointStyle: 'circle', padding: 14, boxWidth: 8 } } } },
    });
  };
  return root;
};

// ================================================================
//  ÓRDENES DE TRABAJO
// ================================================================
function hashParams() {
  const raw = location.hash.slice(1);
  const qi = raw.indexOf('?');
  return new URLSearchParams(qi >= 0 ? raw.slice(qi + 1) : '');
}

function otCard(o) {
  const prio = (o.prioridad || 'media').toLowerCase();
  return el('div', {
    class: `ot-card p-${prio}`, draggable: 'true', 'data-id': o.id,
    ondragstart: (e) => { e.dataTransfer.setData('text/plain', o.id); e.currentTarget.classList.add('dragging'); },
    ondragend: (e) => e.currentTarget.classList.remove('dragging'),
    onclick: () => openOrden(o.id),
  },
    el('div', { class: 'oc-top' },
      el('span', { class: 'oc-nro' }, o.nro_solic || `#${o.id}`),
      el('span', { class: `badge ${prio}` }, o.prioridad || 'MEDIA'),
    ),
    el('div', { class: 'oc-title' }, o.tipo_desperfecto || o.accion_realizada || o.tipo_mant || 'Sin descripción'),
    el('div', { class: 'oc-meta' },
      el('span', { class: 'oc-chip' }, icon('cog'), o.codmaq || 's/equipo'),
      o.vencida ? el('span', { class: 'badge vencida' }, icon('alert'), 'Vencida') : (o.fecha_solic ? el('span', { class: 'oc-chip' }, icon('calendar'), fmtDate(o.fecha_solic)) : null),
    ),
  );
}

views.ordenes = async () => {
  const params = hashParams();
  const q = params.get('q') || '';
  const vista = params.get('v') || 'kanban';
  const ots = await api(`/api/ordenes${q ? '?q=' + encodeURIComponent(q) : ''}`);
  const cols = { pendiente: [], en_proceso: [], cerrada: [] };
  for (const o of ots) (cols[o.estado] || cols.pendiente).push(o);

  const mkCol = (key, title) => el('div', { class: 'col', 'data-estado': key },
    el('div', { class: 'col-head' }, el('span', { class: 'dot' }), title, el('span', { class: 'count' }, cols[key].length)),
    el('div', {
      class: 'col-body', 'data-estado': key,
      ondragover: (e) => { e.preventDefault(); e.currentTarget.classList.add('drop'); },
      ondragleave: (e) => e.currentTarget.classList.remove('drop'),
      ondrop: async (e) => {
        e.preventDefault(); e.currentTarget.classList.remove('drop');
        const id = e.dataTransfer.getData('text/plain');
        try { await api(`/api/ordenes/${id}`, { method: 'PATCH', body: { estado: key } }); toast('OT movida a ' + title.toLowerCase()); router(); }
        catch (err) { toast('Error: ' + err.message, 'err'); }
      },
    }, ...(cols[key].length ? cols[key].map(otCard) : [el('div', { style: 'padding:20px;text-align:center;color:var(--fg-faint);font-size:12px' }, 'Vacío')])),
  );

  const header = el('div', { class: 'page-header' },
    el('div', { class: 'ph-left' }, el('h1', {}, 'Órdenes de trabajo'), el('div', { class: 'subtitle' }, `${ots.length} OT · arrastrá las tarjetas para cambiar el estado`)),
    el('div', { class: 'page-actions' },
      el('div', { class: 'seg' },
        el('button', { class: vista === 'kanban' ? 'active' : '', onclick: () => setParam('v', 'kanban') }, 'Kanban'),
        el('button', { class: vista === 'tabla' ? 'active' : '', onclick: () => setParam('v', 'tabla') }, 'Tabla'),
      ),
      el('button', { class: 'btn btn-primary', onclick: () => ordenForm() }, icon('plus'), 'Nueva OT'),
    ),
  );

  const toolbar = el('div', { class: 'toolbar' },
    el('div', { class: 'filter-input grow' }, icon('search'), el('input', { class: 'input', placeholder: 'Filtrar por N°, equipo, sector, desperfecto…', value: q, onkeydown: (e) => { if (e.key === 'Enter') setParam('q', e.target.value); } })),
  );

  const body = vista === 'tabla'
    ? el('div', { class: 'card' }, el('div', { class: 'table-wrap' }, el('table', { class: 'data' },
        el('thead', {}, el('tr', {}, el('th', {}, 'N°'), el('th', {}, 'Fecha'), el('th', {}, 'Tipo'), el('th', {}, 'Equipo'), el('th', {}, 'Sector'), el('th', {}, 'Prioridad'), el('th', {}, 'Estado'), el('th', {}))),
        el('tbody', {}, ...ots.map((o) => el('tr', {},
          el('td', { class: 'mono cell-strong' }, o.nro_solic || `#${o.id}`),
          el('td', { class: 'cell-mute' }, fmtDate(o.fecha_solic)),
          el('td', {}, el('span', { class: `badge ${(o.tipo_mant || '').toLowerCase().startsWith('prev') ? 'prev' : 'corr'}` }, o.tipo_mant || '—')),
          el('td', {}, o.codmaq || '—'),
          el('td', { class: 'cell-mute' }, o.sector || '—'),
          el('td', {}, el('span', { class: `badge ${(o.prioridad || '').toLowerCase()}` }, o.prioridad || 'MEDIA')),
          el('td', {}, el('span', { class: `badge ${o.estado}` }, el('span', { class: 'dot' }), estadoLabel[o.estado] || o.estado)),
          el('td', { class: 'row-actions' },
            el('button', { class: 'btn btn-sm btn-ghost', title: 'Ver', onclick: () => openOrden(o.id) }, icon('arrow-right')),
            el('button', { class: 'btn btn-sm btn-danger', title: 'Borrar', onclick: async (ev) => { ev.stopPropagation(); if (!confirm('¿Borrar esta OT?')) return; await api(`/api/ordenes/${o.id}`, { method: 'DELETE' }); toast('OT eliminada'); router(); } }, icon('trash')),
          ),
        ))),
      )))
    : el('div', { class: 'kanban' }, mkCol('pendiente', 'Pendientes'), mkCol('en_proceso', 'En proceso'), mkCol('cerrada', 'Cerradas'));

  return el('div', { class: 'view-enter' }, header, toolbar, ots.length ? body : el('div', { class: 'card' }, emptyState('No hay órdenes', 'Creá la primera con “Nueva OT”', 'clipboard')));
};

async function ordenForm(ord = {}) {
  const cat = await getCatalogos();
  const equipos = await api('/api/equipos');
  const field = (label, control, span) => el('label', { class: 'field' + (span ? ' col-span-' + span : '') }, el('span', {}, label), control);
  const inp = (name, attrs = {}) => el('input', { name, class: 'input', ...attrs });
  const sel = (name, options, current, withEmpty) => el('select', { name, class: 'input' },
    withEmpty ? el('option', { value: '' }, '—') : null,
    ...options.map((o) => el('option', { value: o, selected: (current || '').toLowerCase() === o.toLowerCase() }, o)),
  );

  const form = el('form', { class: 'form-grid', onsubmit: async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    Object.keys(data).forEach((k) => { if (data[k] === '') data[k] = null; });
    if (data.hs_hom != null) data.hs_hom = Number(data.hs_hom);
    try {
      if (ord.id) await api(`/api/ordenes/${ord.id}`, { method: 'PATCH', body: data });
      else await api('/api/ordenes', { method: 'POST', body: data });
      toast(ord.id ? 'OT actualizada' : 'OT creada'); closeModal(); router();
    } catch (err) { toast('Error: ' + err.message, 'err'); }
  } },
    field('N° solicitud', inp('nro_solic', { value: ord.nro_solic || '' })),
    field('Fecha solicitud', inp('fecha_solic', { type: 'date', value: (ord.fecha_solic || '').slice(0, 10) })),
    field('Tipo', sel('tipo_mant', cat.tipos_mant.map((t) => t.nombre), ord.tipo_mant)),
    field('Equipo', el('select', { name: 'codmaq', class: 'input' }, el('option', { value: '' }, '—'),
      ...equipos.map((e) => { const v = e.codigo || e.denominacion || String(e.id); return el('option', { value: v, selected: (ord.codmaq || '') === v }, `${e.denominacion || e.codigo || '#' + e.id}${e.codigo ? ' · ' + e.codigo : ''}`); }))),
    field('Sector', sel('sector', cat.sectores.map((s) => s.sector), ord.sector, true)),
    field('Carácter', sel('caracter', cat.caracteres_mant.map((c) => c.nombre), ord.caracter, true)),
    field('Solicita', inp('solicita', { value: ord.solicita || '' })),
    field('Prioridad', sel('prioridad', cat.prioridades.map((p) => p.nombre), ord.prioridad || 'MEDIA')),
    field('Estado', el('select', { name: 'estado', class: 'input' }, ...Object.entries(estadoLabel).map(([v, t]) => el('option', { value: v, selected: (ord.estado || 'pendiente') === v }, t)))),
    field('Desperfecto / síntoma', inp('tipo_desperfecto', { value: ord.tipo_desperfecto || '' }), 3),
    field('Acción realizada', el('textarea', { name: 'accion_realizada', class: 'input', rows: 2 }, ord.accion_realizada || ''), 3),
    field('Observaciones', el('textarea', { name: 'observ_generales', class: 'input', rows: 2 }, ord.observ_generales || ''), 3),
    field('Fecha inicio', inp('fecha_ini', { type: 'date', value: (ord.fecha_ini || '').slice(0, 10) })),
    field('Fecha fin', inp('fecha_fin', { type: 'date', value: (ord.fecha_fin || '').slice(0, 10) })),
    field('Horas hombre', inp('hs_hom', { type: 'number', step: '0.1', value: ord.hs_hom ?? '' })),
  );

  openModal(ord.id ? `Editar OT ${ord.nro_solic || ''}` : 'Nueva orden de trabajo', [
    form,
  ]);
  // pie con acciones
  $('#modalBody').append(el('div', { class: 'modal-foot', style: 'margin:22px -22px -22px' },
    el('button', { class: 'btn', type: 'button', onclick: closeModal }, 'Cancelar'),
    el('button', { class: 'btn btn-primary', type: 'button', onclick: () => form.requestSubmit() }, icon('check'), ord.id ? 'Guardar cambios' : 'Crear OT'),
  ));
}

async function openOrden(id) {
  const o = await api(`/api/ordenes/${id}`);
  const spec = (k, v) => el('div', { class: 'spec' }, el('div', { class: 'sk' }, k), el('div', { class: 'sv' }, v || '—'));
  const body = [
    o.foto ? el('img', { class: 'hero-img', src: o.foto }) : null,
    el('div', { class: 'db-pad' },
      el('div', { style: 'display:flex;gap:8px;align-items:center;margin-bottom:16px;flex-wrap:wrap' },
        el('span', { class: `badge ${o.estado}` }, el('span', { class: 'dot' }), estadoLabel[o.estado] || o.estado),
        el('span', { class: `badge ${(o.prioridad || '').toLowerCase()}` }, o.prioridad || 'MEDIA'),
        el('span', { class: `badge ${(o.tipo_mant || '').toLowerCase().startsWith('prev') ? 'prev' : 'corr'}` }, o.tipo_mant || '—'),
        o.vence ? el('span', { class: 'badge', style: 'margin-left:auto' }, icon('clock'), 'Vence ' + fmtDate(o.vence)) : null,
      ),
      el('div', { class: 'spec-grid' },
        spec('Equipo', o.codmaq), spec('Sector', o.sector), spec('Solicita', o.solicita),
        spec('Fecha solicitud', fmtDate(o.fecha_solic)), spec('Inicio', fmtDate(o.fecha_ini)), spec('Fin', fmtDate(o.fecha_fin)),
        spec('Carácter', o.caracter), spec('Ejecuta', o.ejecuta), spec('Horas hombre', o.hs_hom != null ? fmtNum(o.hs_hom, 1) + ' h' : '—'),
      ),
      o.tipo_desperfecto || o.accion_realizada || o.observ_generales ? el('div', { class: 'section-title' }, 'Detalle') : null,
      o.tipo_desperfecto ? el('div', { class: 'spec', style: 'margin-bottom:8px' }, el('div', { class: 'sk' }, 'Desperfecto'), el('div', { class: 'sv' }, o.tipo_desperfecto)) : null,
      o.accion_realizada ? el('div', { class: 'spec', style: 'margin-bottom:8px' }, el('div', { class: 'sk' }, 'Acción realizada'), el('div', { class: 'sv' }, o.accion_realizada)) : null,
      o.observ_generales ? el('div', { class: 'spec' }, el('div', { class: 'sk' }, 'Observaciones'), el('div', { class: 'sv' }, o.observ_generales)) : null,
      el('div', { style: 'display:flex;gap:10px;justify-content:flex-end;margin-top:22px' },
        el('button', { class: 'btn btn-danger', onclick: async () => { if (!confirm('¿Borrar esta OT?')) return; await api(`/api/ordenes/${o.id}`, { method: 'DELETE' }); toast('OT eliminada'); closeDrawer(); router(); } }, icon('trash'), 'Borrar'),
        el('button', { class: 'btn btn-primary', onclick: () => { closeDrawer(); ordenForm(o); } }, icon('edit'), 'Editar'),
      ),
    ),
  ];
  openDrawer(`OT ${o.nro_solic || '#' + o.id}`, body);
}

// ================================================================
//  PREVENTIVO
// ================================================================
views.preventivo = async () => {
  const params = hashParams();
  const q = params.get('q') || '';
  const planes = await api(`/api/planes${q ? '?q=' + encodeURIComponent(q) : ''}`);
  return el('div', { class: 'view-enter' },
    el('div', { class: 'page-header' },
      el('div', { class: 'ph-left' }, el('h1', {}, 'Mantenimiento preventivo'), el('div', { class: 'subtitle' }, `${planes.length} planes definidos · generá una OT desde cualquier plan`)),
    ),
    el('div', { class: 'toolbar' }, el('div', { class: 'filter-input grow' }, icon('search'), el('input', { class: 'input', placeholder: 'Filtrar por equipo, parte o tarea…', value: q, onkeydown: (e) => { if (e.key === 'Enter') setParam('q', e.target.value); } }))),
    el('div', { class: 'card' }, planes.length ? el('div', { class: 'table-wrap' }, el('table', { class: 'data' },
      el('thead', {}, el('tr', {}, el('th', {}, 'Equipo'), el('th', {}, 'Parte'), el('th', {}, 'Tarea'), el('th', {}, 'Detalle'), el('th', {}, 'Frecuencia'), el('th', {}, 'Tiempo'), el('th', {}))),
      el('tbody', {}, ...planes.map((p) => el('tr', {},
        el('td', { class: 'mono cell-strong' }, p.codmaq || '—'),
        el('td', {}, p.parte || '—'),
        el('td', {}, p.tarea || '—'),
        el('td', { class: 'cell-mute' }, (p.detalle || '').slice(0, 70) || '—'),
        el('td', {}, p.frecuencia ? el('span', { class: 'badge prev' }, p.frecuencia) : '—'),
        el('td', { class: 'cell-mute' }, p.tiempo_estimado || '—'),
        el('td', { class: 'row-actions' }, el('button', { class: 'btn btn-sm btn-primary', onclick: async (ev) => {
          ev.target.disabled = true;
          try { const ot = await api(`/api/planes/${p.id}/generar-ot`, { method: 'POST' }); toast(`OT ${ot.nro_solic} generada`); }
          catch (e) { toast('Error: ' + e.message, 'err'); ev.target.disabled = false; }
        } }, icon('plus'), 'Generar OT')),
      ))),
    )) : emptyState('Sin planes preventivos', null, 'calendar')),
  );
};

// ================================================================
//  EQUIPOS
// ================================================================
views.equipos = async () => {
  const params = hashParams();
  const q = params.get('q') || '';
  const sector = params.get('sector') || '';
  const [equipos, cat] = await Promise.all([
    api(`/api/equipos?${new URLSearchParams({ ...(q ? { q } : {}), ...(sector ? { sector } : {}) })}`),
    getCatalogos(),
  ]);
  const grid = equipos.length
    ? el('div', { class: 'grid equipos' }, ...equipos.map((e, i) => el('div', { class: 'equipo-card', style: `animation-delay:${Math.min(i * 25, 400)}ms`, onclick: () => openEquipo(e.id) },
        el('div', { class: 'thumb' },
          equipoFoto(e) ? el('img', { src: equipoFoto(e), loading: 'lazy', alt: e.denominacion || '' }) : el('div', { class: 'no-photo' }, icon('image'), 'Sin foto'),
          el('div', { class: 'badges' },
            e.mant_prev ? el('span', { class: 'badge prev' }, icon('calendar'), 'Preventivo') : null,
            getUploads()[e.id] ? el('span', { class: 'badge', style: 'background:var(--ok-soft);color:var(--ok)' }, icon('check'), 'Foto nueva') : null),
        ),
        el('div', { class: 'body' },
          el('h4', {}, e.denominacion || `Equipo #${e.id}`),
          el('div', { class: 'ec-code' }, e.codigo || `id ${e.id}`),
          el('div', { class: 'ec-meta' }, [e.marca, e.modelo].filter(Boolean).join(' · ') || 'Sin marca'),
          el('div', { class: 'ec-foot' },
            el('span', {}, icon('pin'), e.sector || 'Sin sector'),
            e.n_ot ? el('span', {}, icon('clipboard'), `${e.n_ot} OT`) : null,
          ),
        ),
      )))
    : el('div', { class: 'card' }, emptyState('No se encontraron equipos', q ? `Sin resultados para “${q}”` : null, 'cog'));

  return el('div', { class: 'view-enter' },
    el('div', { class: 'page-header' },
      el('div', { class: 'ph-left' }, el('h1', {}, 'Equipos'), el('div', { class: 'subtitle' }, `${equipos.length} equipos · ficha técnica con foto e historial`)),
    ),
    el('div', { class: 'toolbar' },
      el('div', { class: 'filter-input grow' }, icon('search'), el('input', { class: 'input', placeholder: 'Buscar por denominación, código, marca…', value: q, onkeydown: (e) => { if (e.key === 'Enter') setParam('q', e.target.value); } })),
      el('select', { class: 'input', style: 'max-width:220px', onchange: (e) => setParam('sector', e.target.value) },
        el('option', { value: '' }, 'Todos los sectores'),
        ...cat.sectores.map((s) => el('option', { value: s.sector, selected: sector === s.sector }, s.sector)),
      ),
    ),
    grid,
  );
};

async function openEquipo(id) {
  const d = await api(`/api/equipos/${id}`);
  const eq = d.equipo;
  const spec = (k, v) => el('div', { class: 'spec' }, el('div', { class: 'sk' }, k), el('div', { class: 'sv' }, v ?? '—'));

  const tabInfo = el('div', { class: 'db-pad' },
    el('div', { class: 'spec-grid' },
      spec('Código', eq.codigo || `id ${eq.id}`), spec('Sector', eq.sector), spec('Marca', eq.marca),
      spec('Modelo', eq.modelo), spec('Instalación', fmtDate(eq.fecha_instalacion)), spec('Preventivo', eq.mant_prev ? 'Sí' : 'No'),
      eq.costo ? spec('Costo activo', '$' + fmtNum(eq.costo)) : null,
      eq.vida_util ? spec('Vida útil', eq.vida_util + ' años') : null,
      eq.maq_asociada ? spec('Máq. asociada', eq.maq_asociada) : null,
    ),
    eq.observacion ? el('div', { class: 'spec', style: 'margin-top:8px' }, el('div', { class: 'sk' }, 'Observación'), el('div', { class: 'sv' }, eq.observacion)) : null,
  );

  const tabMotores = el('div', { class: 'db-pad' }, d.motores.length ? el('div', { class: 'table-wrap' }, el('table', { class: 'data' },
    el('thead', {}, el('tr', {}, el('th', {}, 'Sección'), el('th', {}, 'Marca'), el('th', {}, 'Tipo'), el('th', {}, 'Potencia'), el('th', {}, 'Tensión'), el('th', {}, 'RPM'))),
    el('tbody', {}, ...d.motores.map((m) => el('tr', {}, el('td', {}, m.seccion || '—'), el('td', {}, m.marca || '—'), el('td', {}, m.tipo || '—'), el('td', {}, m.potencia || '—'), el('td', {}, m.tension || '—'), el('td', {}, m.rpm || '—')))),
  )) : emptyState('Sin motores registrados', null, 'bolt'));

  const tabOT = el('div', { class: 'db-pad' }, d.ordenes.length ? el('div', { class: 'timeline' }, ...d.ordenes.map((o) => el('div', { class: 'tl-item' },
    el('div', { class: `tl-dot ${o.estado === 'cerrada' ? 'ok' : 'alta'}` }, icon(o.estado === 'cerrada' ? 'check' : 'wrench')),
    el('div', { class: 'tl-body', style: 'cursor:pointer', onclick: () => { closeDrawer(); openOrden(o.id); } },
      el('div', { class: 'tl-main' }, `${o.nro_solic || 'OT #' + o.id} · ${o.tipo_mant || ''}`),
      el('div', { class: 'tl-sub' }, o.tipo_desperfecto || o.accion_realizada || 'Sin detalle'),
      el('div', { class: 'tl-time' }, fmtDate(o.fecha_solic) + ' · ' + (estadoLabel[o.estado] || o.estado)),
    ),
  ))) : emptyState('Sin OT en el historial', null, 'clipboard'));

  const tabPrev = el('div', { class: 'db-pad' }, d.planes.length ? el('div', { class: 'table-wrap' }, el('table', { class: 'data' },
    el('thead', {}, el('tr', {}, el('th', {}, 'Parte'), el('th', {}, 'Tarea'), el('th', {}, 'Detalle'), el('th', {}, 'Frecuencia'))),
    el('tbody', {}, ...d.planes.map((p) => el('tr', {}, el('td', {}, p.parte || '—'), el('td', {}, p.tarea || '—'), el('td', { class: 'cell-mute' }, (p.detalle || '').slice(0, 60)), el('td', {}, p.frecuencia || '—')))),
  )) : emptyState('Sin planes preventivos', null, 'calendar'));

  const tabs = [
    ['Información', tabInfo],
    [`Motores (${d.motores.length})`, tabMotores],
    [`Historial (${d.ordenes.length})`, tabOT],
    [`Preventivo (${d.planes.length})`, tabPrev],
  ];
  const panels = tabs.map(([, p]) => p);
  const tabBar = el('div', { class: 'tabs' }, ...tabs.map(([label], i) => el('button', {
    class: i === 0 ? 'active' : '', onclick: (e) => {
      $$('.tabs button', tabBar).forEach((b) => b.classList.remove('active'));
      e.target.classList.add('active');
      panels.forEach((p, j) => (p.hidden = j !== i));
    },
  }, label)));
  panels.forEach((p, i) => (p.hidden = i !== 0));

  openDrawer(eq.denominacion || `Equipo #${eq.id}`, [
    equipoFoto(eq) ? el('img', { class: 'hero-img', src: equipoFoto(eq) }) : el('div', { class: 'hero-noimg' }, icon('image')),
    el('div', { class: 'db-pad', style: 'display:flex;gap:9px;flex-wrap:wrap;border-bottom:1px solid var(--line);padding-top:14px;padding-bottom:14px' },
      can('subir') ? el('button', { class: 'btn btn-sm', onclick: () => subirFotoEquipo(eq) }, icon('upload'), 'Subir foto') : null,
      can('ot') ? el('button', { class: 'btn btn-sm', onclick: () => { closeDrawer(); ordenForm({ codmaq: eq.codigo || eq.denominacion, sector: eq.sector }); } }, icon('wrench'), 'Reportar falla') : null,
      el('button', { class: 'btn btn-sm', onclick: () => mostrarQR(eq) }, icon('qr'), 'Código QR'),
    ),
    tabBar, ...panels,
  ]);
}

// ================================================================
//  REPUESTOS
// ================================================================
views.repuestos = async () => {
  const params = hashParams();
  const bajo = params.get('bajo_min') === '1';
  const q = params.get('q') || '';
  const repuestos = await api(`/api/repuestos?${new URLSearchParams({ ...(bajo ? { bajo_min: 'true' } : {}), ...(q ? { q } : {}) })}`);
  const nBajo = repuestos.filter((r) => r.bajo_min).length;
  return el('div', { class: 'view-enter' },
    el('div', { class: 'page-header' },
      el('div', { class: 'ph-left' }, el('h1', {}, 'Repuestos'), el('div', { class: 'subtitle' }, `${repuestos.length} items en stock · ${nBajo} bajo mínimo`)),
      el('div', { class: 'page-actions' }, el('div', { class: 'seg' },
        el('button', { class: !bajo ? 'active' : '', onclick: () => setParam('bajo_min', '') }, 'Todos'),
        el('button', { class: bajo ? 'active' : '', onclick: () => setParam('bajo_min', '1') }, 'Bajo mínimo'),
      )),
    ),
    el('div', { class: 'toolbar' }, el('div', { class: 'filter-input grow' }, icon('search'), el('input', { class: 'input', placeholder: 'Buscar por parte, marca, proveedor…', value: q, onkeydown: (e) => { if (e.key === 'Enter') setParam('q', e.target.value); } }))),
    el('div', { class: 'card' }, repuestos.length ? el('div', { class: 'table-wrap' }, el('table', { class: 'data' },
      el('thead', {}, el('tr', {}, el('th', {}, 'Nro'), el('th', {}, 'Parte'), el('th', {}, 'Marca'), el('th', {}, 'Especificación'), el('th', { class: 'num' }, 'Stock'), el('th', { class: 'num' }, 'Mín'), el('th', {}, 'Proveedor'), el('th', {}))),
      el('tbody', {}, ...repuestos.map((r) => el('tr', {},
        el('td', { class: 'mono cell-mute' }, r.nro || '—'),
        el('td', { class: 'cell-strong' }, r.parte || '—'),
        el('td', {}, r.marca || '—'),
        el('td', { class: 'cell-mute' }, (r.especificacion || '').slice(0, 50) || '—'),
        el('td', { class: 'num' }, fmtNum(r.cant_requerida)),
        el('td', { class: 'num' }, fmtNum(r.cant_stock_min)),
        el('td', { class: 'cell-mute' }, r.proveedor || '—'),
        el('td', {}, r.bajo_min ? el('span', { class: 'badge vencida' }, icon('alert'), 'Bajo mín.') : ''),
      ))),
    )) : emptyState('Sin repuestos', null, 'box')),
  );
};

// ================================================================
//  TÉCNICOS
// ================================================================
views.tecnicos = async () => {
  const [tecnicos, cat] = await Promise.all([api('/api/tecnicos'), getCatalogos()]);
  return el('div', { class: 'view-enter' },
    el('div', { class: 'page-header' },
      el('div', { class: 'ph-left' }, el('h1', {}, 'Técnicos'), el('div', { class: 'subtitle' }, `${tecnicos.length} personas en el equipo de trabajo`)),
      el('div', { class: 'page-actions' }, el('button', { class: 'btn btn-primary', onclick: () => tecnicoForm(cat) }, icon('plus'), 'Nuevo técnico')),
    ),
    el('div', { class: 'grid three' }, ...tecnicos.map((t) => el('div', { class: 'card pad-sm' },
      el('div', { style: 'display:flex;gap:13px;align-items:center' },
        el('div', { style: 'width:46px;height:46px;border-radius:50%;background:var(--brand-soft);color:var(--brand);display:grid;place-items:center;font-weight:700;font-size:17px;flex-shrink:0' }, (t.nombre || '?').slice(0, 1).toUpperCase()),
        el('div', { style: 'min-width:0;flex:1' },
          el('div', { style: 'font-weight:650;font-size:14.5px' }, t.nombre || '—'),
          el('div', { class: 'cell-mute', style: 'font-size:12.5px' }, t.funcion || 'Sin función'),
        ),
        t.n_ot ? el('span', { class: 'badge' }, `${t.n_ot} OT`) : null,
      ),
      el('div', { style: 'display:flex;gap:8px;margin-top:12px;flex-wrap:wrap' },
        t.sector ? el('span', { class: 'badge' }, icon('pin'), t.sector) : null,
        t.email ? el('span', { class: 'badge' }, t.email) : null,
      ),
    ))),
  );
};

async function tecnicoForm(cat) {
  const field = (label, control) => el('label', { class: 'field' }, el('span', {}, label), control);
  const form = el('form', { class: 'form-grid', onsubmit: async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    if (!data.nombre) return toast('El nombre es obligatorio', 'err');
    try { await api('/api/tecnicos', { method: 'POST', body: data }); toast('Técnico dado de alta'); closeModal(); router(); }
    catch (err) { toast('Error: ' + err.message, 'err'); }
  } },
    field('Nombre y apellido', el('input', { name: 'nombre', class: 'input', required: true })),
    field('Sector', el('select', { name: 'sector', class: 'input' }, el('option', { value: '' }, '—'), ...cat.sectores.map((s) => el('option', { value: s.sector }, s.sector)))),
    field('Función', el('input', { name: 'funcion', class: 'input' })),
    field('E-mail', el('input', { name: 'email', type: 'email', class: 'input' })),
  );
  openModal('Nuevo técnico', [form]);
  $('#modalBody').append(el('div', { class: 'modal-foot', style: 'margin:22px -22px -22px' },
    el('button', { class: 'btn', type: 'button', onclick: closeModal }, 'Cancelar'),
    el('button', { class: 'btn btn-primary', type: 'button', onclick: () => form.requestSubmit() }, icon('check'), 'Agregar'),
  ));
}

// ================================================================
//  REPORTES
// ================================================================
views.reportes = async () => {
  const [mtbf, costos] = await Promise.all([api('/api/reportes/mtbf'), api('/api/reportes/costos')]);
  const root = el('div', { class: 'view-enter' },
    el('div', { class: 'page-header' },
      el('div', { class: 'ph-left' }, el('h1', {}, 'Reportes'), el('div', { class: 'subtitle' }, 'Confiabilidad y carga de mantenimiento')),
    ),
    el('div', { class: 'grid two', style: 'margin-bottom:16px' },
      el('div', { class: 'card' }, el('div', { class: 'card-head' }, el('h3', {}, 'Correctivo vs preventivo por sector'), el('div', { class: 'ch-icon' }, icon('chart'))), el('div', { style: 'height:280px' }, el('canvas', { id: 'chSector' }))),
      el('div', { class: 'card' }, el('div', { class: 'card-head' }, el('h3', {}, 'Horas por sector'), el('div', { class: 'ch-icon' }, icon('clock'))), el('div', { style: 'height:280px' }, el('canvas', { id: 'chHoras' }))),
    ),
    el('div', { class: 'grid two-eq' },
      el('div', { class: 'card' }, el('div', { class: 'card-head' }, el('h3', {}, 'MTBF / MTTR por equipo')), el('div', { class: 'table-wrap' }, el('table', { class: 'data' },
        el('thead', {}, el('tr', {}, el('th', {}, 'Equipo'), el('th', { class: 'num' }, 'Fallas'), el('th', { class: 'num' }, 'MTTR (h)'), el('th', { class: 'num' }, 'MTBF (h)'))),
        el('tbody', {}, ...mtbf.map((r) => el('tr', {}, el('td', { class: 'cell-strong' }, r.equipo), el('td', { class: 'num' }, r.fallas), el('td', { class: 'num' }, fmtNum(r.mttr, 1)), el('td', { class: 'num' }, r.mtbf ? fmtNum(r.mtbf, 0) : '—')))),
      ))),
      el('div', { class: 'card' }, el('div', { class: 'card-head' }, el('h3', {}, 'Detalle por sector')), el('div', { class: 'table-wrap' }, el('table', { class: 'data' },
        el('thead', {}, el('tr', {}, el('th', {}, 'Sector'), el('th', { class: 'num' }, 'OTs'), el('th', { class: 'num' }, 'Correct.'), el('th', { class: 'num' }, 'Prev.'), el('th', { class: 'num' }, 'Horas'))),
        el('tbody', {}, ...costos.map((r) => el('tr', {}, el('td', { class: 'cell-strong' }, r.sector), el('td', { class: 'num' }, r.ots), el('td', { class: 'num' }, r.correctivas), el('td', { class: 'num' }, r.preventivas), el('td', { class: 'num' }, fmtNum(r.horas, 1))))),
      ))),
    ),
  );
  root._postmount = () => {
    const { grid } = chartDefaults();
    const brand = css('--brand'), info = css('--info'), accent = css('--accent');
    mkChart($('#chSector'), {
      type: 'bar',
      data: { labels: costos.map((c) => c.sector), datasets: [
        { label: 'Correctivo', data: costos.map((c) => c.correctivas), backgroundColor: brand, borderRadius: 5, maxBarThickness: 22 },
        { label: 'Preventivo', data: costos.map((c) => c.preventivas), backgroundColor: info, borderRadius: 5, maxBarThickness: 22 },
      ] },
      options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, pointStyle: 'circle', padding: 14, boxWidth: 8 } } }, scales: { x: { stacked: true, grid: { color: grid }, border: { display: false }, ticks: { precision: 0 } }, y: { stacked: true, grid: { display: false }, border: { display: false } } } },
    });
    mkChart($('#chHoras'), {
      type: 'bar',
      data: { labels: costos.map((c) => c.sector), datasets: [{ label: 'Horas', data: costos.map((c) => c.horas), backgroundColor: accent, borderRadius: 5, maxBarThickness: 30 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, border: { display: false } }, y: { beginAtZero: true, grid: { color: grid }, border: { display: false } } } },
    });
  };
  return root;
};

// ================================================================
//  ROUTER
// ================================================================
function setParam(key, value) {
  const params = hashParams();
  if (value) params.set(key, value); else params.delete(key);
  const base = location.hash.slice(1).split('?')[0] || '/panel';
  location.hash = base + (params.toString() ? '?' + params.toString() : '');
}

let currentRoute = 'panel';

async function loadNavCounts() {
  try {
    const p = await api('/api/panel');
    const map = { ordenes: p.totales.ordenes, planes: p.totales.planes, equipos: p.totales.equipos, repuestos: p.totales.repuestos };
    $$('.nav-count').forEach((n) => { const k = n.dataset.count; if (map[k] != null) n.textContent = map[k]; });
  } catch {}
}

async function router() {
  destroyCharts();
  const raw = location.hash.slice(1) || '/panel';
  let route = raw.split('?')[0].replace(/^\/+/, '').split('/')[0] || 'panel';
  if (!currentUser) { showLogin(); return; }
  applyRole();
  if (!roleCan(route)) { location.hash = '#/' + defaultRoute(); return; }
  currentRoute = route;
  const view = views[route] || views.panel;
  const container = $('#view');
  container.replaceChildren(route === 'panel' ? skeletonPanel() : el('div', { class: 'spinner' }, 'Cargando…'));
  try {
    const node = await view();
    container.replaceChildren(node);
    if (node._postmount) requestAnimationFrame(() => node._postmount());
    if (route === 'equipos') { const op = hashParams().get('open'); if (op) setTimeout(() => openEquipo(+op), 60); }
  } catch (e) {
    console.error(e);
    container.replaceChildren(el('div', { class: 'card' }, emptyState('Error al cargar', String(e), 'alert')));
  }
  $$('.sidebar nav a').forEach((a) => a.classList.toggle('active', a.dataset.route === route));
}

// ================================================================
//  v3 · USUARIOS · ROLES · PANELES · UPLOADS · QR · ASISTENTE · TOUR
//  Todo client-side (localStorage) para que la demo funcione sin backend.
// ================================================================
const LS = {
  get(k, def) { try { const v = localStorage.getItem('mok_' + k); return v == null ? def : JSON.parse(v); } catch { return def; } },
  set(k, v) { try { localStorage.setItem('mok_' + k, JSON.stringify(v)); } catch {} },
};

const ROLE = {
  admin:    { label: 'Administrador', color: 'admin',    home: 'panel',      nav: ['panel', 'ordenes', 'preventivo', 'docente', 'admin', 'equipos', 'repuestos', 'tecnicos', 'reportes'] },
  profesor: { label: 'Profesor',      color: 'profesor', home: 'docente',    nav: ['panel', 'ordenes', 'preventivo', 'docente', 'equipos', 'repuestos', 'reportes'] },
  alumno:   { label: 'Alumno',        color: 'alumno',   home: 'mis-tareas', nav: ['panel', 'mis-tareas', 'equipos', 'repuestos'] },
};

function seedUsers() {
  const u = [
    { id: 'u_admin', nombre: 'Mateo Deluchi', rol: 'admin', usuario: 'admin1', pass: 'admin1', email: 'mateo.deluchi@ottokrause.edu.ar', estado: 'activo' },
    { id: 'u_nahuel', nombre: 'Nahuel Jiménez Torres', rol: 'admin', usuario: 'admin2', pass: 'admin2', email: 'nahuel.jimenez@ottokrause.edu.ar', estado: 'activo' },
    { id: 'u_sosa', nombre: 'Eduardo Sosa', rol: 'profesor', usuario: 'profe1', pass: 'profe1', sector: 'Unión y conformado', email: 'e.sosa@ottokrause.edu.ar', estado: 'activo' },
    { id: 'u_melek', nombre: 'Luis Melek', rol: 'profesor', usuario: 'profe2', pass: 'profe2', sector: 'Tornería', email: 'l.melek@ottokrause.edu.ar', estado: 'activo' },
    { id: 'u_scar', nombre: 'Leonardo Scarimbolo', rol: 'profesor', usuario: 'profe3', pass: 'profe3', sector: 'Ajuste', email: 'l.scarimbolo@ottokrause.edu.ar', estado: 'pendiente' },
    { id: 'u_lucas', nombre: 'Lucas Pérez', rol: 'alumno', usuario: 'alumno1', pass: 'alumno1', curso: '6°2', legajo: '4821', email: 'lucas.perez@alu.ottokrause.edu.ar', estado: 'activo' },
    { id: 'u_sofi', nombre: 'Sofía Gómez', rol: 'alumno', usuario: 'alumno2', pass: 'alumno2', curso: '6°2', legajo: '4835', email: 'sofia.gomez@alu.ottokrause.edu.ar', estado: 'activo' },
  ];
  LS.set('users', u);
  return u;
}
let users = LS.get('users', null);
if (!users || !users[0] || !users[0].usuario) users = seedUsers();  // migración a login con credenciales
let currentUser = LS.get('cu', null);
const saveUsers = () => LS.set('users', users);
const iniciales = (n) => (n || '?').split(' ').filter(Boolean).slice(0, 2).map((x) => x[0]).join('').toUpperCase();

function defaultRoute() { return (currentUser && ROLE[currentUser.rol] && ROLE[currentUser.rol].home) || 'panel'; }
function roleCan(route) { return !!currentUser && ROLE[currentUser.rol].nav.includes(route); }
function can(action) {
  const r = currentUser && currentUser.rol;
  if (r === 'admin') return action !== 'tarea-hecha';
  if (r === 'profesor') return ['subir', 'ot', 'asignar', 'pedir', 'doc'].includes(action);
  if (r === 'alumno') return ['tarea-hecha', 'pedir'].includes(action);
  return false;
}

// ---------- stores client-side ----------
const getUploads = () => LS.get('uploads', {});
const getTareas = () => LS.get('tareas', []);
const saveTareas = (t) => LS.set('tareas', t);
const getPedidos = () => LS.get('pedidos', []);
const savePedidos = (p) => LS.set('pedidos', p);
const getDocs = () => LS.get('docs', []);
const saveDocs = (d) => LS.set('docs', d);
function equipoFoto(e) { if (!e) return null; const u = getUploads(); return (u[e.id] && u[e.id].foto) || e.foto || null; }

// ================================================================
//  LOGIN
// ================================================================
function showLogin() {
  document.querySelector('.sidebar').style.display = 'none';
  document.querySelector('main').style.display = 'none';
  const launcher = $('#chatLauncher'); if (launcher) launcher.hidden = true;
  if ($('#login')) { $('#login').hidden = false; return; }

  const demo = [
    ['Administrador', 'admin1', 'admin1', 'admin'],
    ['Profesor', 'profe1', 'profe1', 'profesor'],
    ['Alumno', 'alumno1', 'alumno1', 'alumno'],
  ];
  const form = el('form', { class: 'login-form', onsubmit: (e) => { e.preventDefault(); tryLogin(); } },
    el('label', { class: 'field' }, el('span', {}, 'Usuario'), el('input', { id: 'liUser', class: 'input', placeholder: 'Ej: admin1', autocomplete: 'username' })),
    el('label', { class: 'field' }, el('span', {}, 'Contraseña'), el('input', { id: 'liPass', type: 'password', class: 'input', placeholder: '••••••', autocomplete: 'current-password' })),
    el('div', { id: 'liErr', class: 'login-err', hidden: true }),
    el('button', { class: 'btn btn-primary', type: 'submit', style: 'width:100%;justify-content:center;margin-top:4px' }, icon('logout'), 'Ingresar'),
  );
  const box = el('div', { id: 'login', class: 'login' },
    el('div', { class: 'login-card', style: 'max-width:440px' },
      el('div', { class: 'login-brand' },
        el('span', { class: 'brand-mark' }, icon('wrench')),
        el('div', {}, el('div', { class: 'lb-name', html: 'Mantenimient<span class="brand-ok">OK</span>' }), el('div', { class: 'lb-sub' }, 'Gestión de mantenimiento del taller')),
      ),
      el('h2', {}, 'Iniciar sesión'),
      el('div', { class: 'login-hint' }, 'Ingresá con tu usuario y contraseña del taller.'),
      form,
      el('div', { class: 'login-row' }, el('span', {}, '¿Sos profe nuevo?'), el('span', { class: 'link', onclick: registroForm }, 'Crear cuenta')),
      el('div', { class: 'demo-box' },
        el('div', { class: 'demo-title' }, icon('help'), 'Usuarios de prueba — tocá para completar'),
        el('div', { class: 'demo-list' }, ...demo.map(([lbl, u, p, rol]) => el('button', { class: `demo-cred ${rol}`, type: 'button', onclick: () => { $('#liUser').value = u; $('#liPass').value = p; $('#liErr').hidden = true; } },
          el('b', {}, lbl), el('span', { class: 'mono' }, `${u} / ${p}`)))),
      ),
    ),
  );
  document.body.append(box);
  setTimeout(() => $('#liUser') && $('#liUser').focus(), 80);
}

function tryLogin() {
  const u = ($('#liUser').value || '').trim().toLowerCase(), p = $('#liPass').value || '';
  const err = $('#liErr');
  const found = users.find((x) => (x.usuario || '').toLowerCase() === u);
  if (!found || found.pass !== p) { err.textContent = 'Usuario o contraseña incorrectos.'; err.hidden = false; return; }
  if (found.estado !== 'activo') { err.textContent = 'Tu cuenta está pendiente de aprobación del administrador.'; err.hidden = false; return; }
  doLogin(found);
}

function registroForm() {
  const field = (l, c) => el('label', { class: 'field' }, el('span', {}, l), c);
  const form = el('form', { class: 'form-grid', onsubmit: (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form).entries());
    if (!d.nombre || !d.usuario || !d.pass) return toast('Completá nombre, usuario y contraseña', 'err');
    if (users.some((x) => (x.usuario || '').toLowerCase() === d.usuario.toLowerCase())) return toast('Ese usuario ya existe', 'err');
    users.unshift({ id: 'u' + Date.now(), nombre: d.nombre, rol: 'profesor', usuario: d.usuario, pass: d.pass, sector: d.sector || '', email: d.email || '', estado: 'pendiente' });
    saveUsers(); closeModal();
    const err = $('#liErr'); if (err) { err.style.color = 'var(--ok)'; err.textContent = '¡Cuenta creada! Queda pendiente de aprobación del administrador.'; err.hidden = false; }
    toast('Cuenta creada · pendiente de aprobación');
  } },
    field('Nombre y apellido', el('input', { name: 'nombre', class: 'input', required: true })),
    field('Sector', el('input', { name: 'sector', class: 'input', placeholder: 'Ej: Tornería' })),
    field('Usuario', el('input', { name: 'usuario', class: 'input', placeholder: 'Ej: profe4', required: true })),
    field('Contraseña', el('input', { name: 'pass', type: 'password', class: 'input', required: true })),
  );
  openModal('Crear cuenta de profesor', [
    el('div', { class: 'login-hint', style: 'margin-bottom:14px' }, 'Tu cuenta la tiene que aprobar el administrador antes de poder entrar.'),
    form,
  ]);
  $('#modalBody').append(el('div', { class: 'modal-foot', style: 'margin:20px -22px -22px' },
    el('button', { class: 'btn', onclick: closeModal }, 'Cancelar'),
    el('button', { class: 'btn btn-primary', onclick: () => form.requestSubmit() }, icon('check'), 'Crear cuenta')));
}

function pickUserFor(rol) {
  const lista = users.filter((u) => u.rol === rol && u.estado === 'activo');
  const body = [
    el('div', { class: 'login-hint', style: 'margin-bottom:14px' }, `Elegí tu usuario ${ROLE[rol].label.toLowerCase()} de demostración:`),
    el('div', { style: 'display:flex;flex-direction:column;gap:9px' },
      ...lista.map((u) => el('button', { class: 'btn', style: 'justify-content:flex-start;padding:12px 14px', onclick: () => doLogin(u) },
        el('span', { class: `avatar ${rol}`, style: 'width:34px;height:34px;font-size:13px' }, iniciales(u.nombre)),
        el('div', { style: 'text-align:left;line-height:1.2' },
          el('div', { style: 'font-weight:600' }, u.nombre),
          el('div', { class: 'cell-mute', style: 'font-size:12px' }, [u.sector, u.curso && ('Curso ' + u.curso), u.email].filter(Boolean)[0] || ''),
        ),
      )),
    ),
  ];
  openModal('Entrar como ' + ROLE[rol].label, body);
  $('#modalBody').append(el('div', { class: 'modal-foot', style: 'margin:20px -22px -22px' },
    el('button', { class: 'btn', onclick: closeModal }, 'Volver')));
}

function doLogin(u) {
  currentUser = u; LS.set('cu', u); closeModal();
  const box = $('#login'); if (box) box.hidden = true;
  document.querySelector('.sidebar').style.display = '';
  document.querySelector('main').style.display = '';
  buildTopbar(); applyRole();
  const launcher = $('#chatLauncher'); if (launcher) launcher.hidden = false;
  location.hash = '#/' + defaultRoute();
  router();
  toast('¡Hola ' + u.nombre.split(' ')[0] + '! Entraste como ' + ROLE[u.rol].label);
  // bienvenida del asistente + tour la primera vez de cada rol
  const seen = LS.get('onboarded', {});
  chatReset();
  if (!seen[u.rol]) {
    seen[u.rol] = true; LS.set('onboarded', seen);
    setTimeout(() => { $('#chatPanel').hidden = false; $('#chatLauncher').hidden = true; chatWelcome(true); }, 700);
  }
}

function logout() {
  currentUser = null; LS.set('cu', null);
  closeChat();
  showLogin();
}

// ================================================================
//  TOPBAR (usuario + notificaciones)
// ================================================================
let topbarBuilt = false;
function buildTopbar() {
  const host = $('#topbarActions'); if (!host || topbarBuilt) return;
  topbarBuilt = true;
  host.replaceChildren(
    el('button', { class: 'icon-btn', id: 'notifBtn', title: 'Notificaciones', onclick: toggleNotifs }, icon('bell'), el('span', { class: 'nb', id: 'notifBadge', hidden: true })),
    el('div', { id: 'notifPop', class: 'pop', hidden: true }),
    el('div', { style: 'position:relative' },
      el('div', { class: 'user-chip', id: 'userChip', onclick: toggleUserMenu },
        el('span', { class: 'avatar', id: 'userAvatar' }, ''),
        el('div', { class: 'uc-main' }, el('div', { class: 'uc-name', id: 'ucName' }, ''), el('div', { class: 'uc-role', id: 'ucRole' }, '')),
      ),
      el('div', { id: 'userPop', class: 'pop', hidden: true }),
    ),
  );
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#notifBtn') && !e.target.closest('#notifPop')) { const p = $('#notifPop'); if (p) p.hidden = true; }
    if (!e.target.closest('#userChip') && !e.target.closest('#userPop')) { const p = $('#userPop'); if (p) p.hidden = true; }
  });
}

function toggleUserMenu() {
  const pop = $('#userPop'); if (!pop) return;
  if (!pop.hidden) { pop.hidden = true; return; }
  pop.replaceChildren(
    el('div', { style: 'display:flex;gap:11px;align-items:center;padding:8px 10px 10px' },
      el('span', { class: `avatar ${currentUser.rol}` }, iniciales(currentUser.nombre)),
      el('div', {}, el('div', { style: 'font-weight:650;font-size:13.5px' }, currentUser.nombre), el('div', { class: 'cell-mute', style: 'font-size:12px' }, ROLE[currentUser.rol].label)),
    ),
    el('div', { class: 'pop-sep' }),
    el('div', { class: 'pop-item', onclick: () => { pop.hidden = true; openChat(); chatWelcome(false); } }, icon('chat'), 'Abrir asistente'),
    el('div', { class: 'pop-item', onclick: () => { pop.hidden = true; startTour(); } }, icon('sparkle'), 'Hacer el tour guiado'),
    el('div', { class: 'pop-sep' }),
    el('div', { class: 'pop-item', onclick: () => { pop.hidden = true; logout(); } }, icon('logout'), 'Cambiar de usuario'),
  );
  pop.hidden = false;
  $('#notifPop') && ($('#notifPop').hidden = true);
}

function computeNotifs() {
  const r = currentUser.rol, out = [];
  if (r === 'admin') {
    users.filter((u) => u.estado === 'pendiente').forEach((u) => out.push({ t: `Profesor pendiente de aprobar: ${u.nombre}`, time: 'Requiere tu visto bueno', go: () => (location.hash = '#/admin') }));
    getPedidos().filter((p) => p.estado === 'pendiente').forEach((p) => out.push({ t: `Pedido de repuesto: ${p.repuesto} (x${p.cantidad})`, time: 'de ' + p.solicitadoPor, go: () => (location.hash = '#/admin') }));
  } else if (r === 'alumno') {
    getTareas().filter((t) => t.asignadoAId === currentUser.id && t.estado !== 'hecha').forEach((t) => out.push({ t: `Tarea asignada: ${t.titulo}`, time: 'de ' + t.asignadoPor, go: () => (location.hash = '#/mis-tareas') }));
  } else if (r === 'profesor') {
    getPedidos().filter((p) => p.solicitadoPorId === currentUser.id && p.estado !== 'pendiente').forEach((p) => out.push({ t: `Pedido ${p.estado}: ${p.repuesto}`, time: p.estado === 'aprobado' ? 'Aprobado por admin' : 'Rechazado', go: () => (location.hash = '#/docente') }));
    getTareas().filter((t) => t.asignadoPorId === currentUser.id && t.estado === 'hecha').forEach((t) => out.push({ t: `Tarea completada: ${t.titulo}`, time: 'por ' + t.asignadoA, go: () => (location.hash = '#/docente') }));
  }
  return out;
}

function toggleNotifs() {
  const pop = $('#notifPop'); if (!pop) return;
  if (!pop.hidden) { pop.hidden = true; return; }
  const list = computeNotifs();
  pop.replaceChildren(
    el('div', { class: 'pop-head' }, 'Notificaciones'),
    ...(list.length ? list.map((n) => el('div', { class: 'notif-item', style: 'cursor:pointer', onclick: () => { pop.hidden = true; n.go(); } },
      el('span', { class: 'ni-dot' }), el('div', {}, el('div', { class: 'ni-main' }, n.t), el('div', { class: 'ni-time' }, n.time)),
    )) : [el('div', { class: 'search-empty', style: 'padding:22px' }, 'Sin novedades 👌')]),
  );
  pop.hidden = false;
  $('#userPop') && ($('#userPop').hidden = true);
}

// ================================================================
//  APLICAR ROL (nav + chip + badges)
// ================================================================
function applyRole() {
  if (!currentUser) return;
  const allowed = ROLE[currentUser.rol].nav;
  $$('.sidebar nav a').forEach((a) => { a.hidden = !allowed.includes(a.dataset.route); });
  // ocultar etiquetas de grupo sin items visibles
  $$('.sidebar nav .nav-label').forEach((lab) => {
    let n = lab.nextElementSibling, vis = false;
    while (n && !n.classList.contains('nav-label')) { if (n.tagName === 'A' && !n.hidden) vis = true; n = n.nextElementSibling; }
    lab.hidden = !vis;
  });
  // chip de usuario
  const av = $('#userAvatar'); if (av) { av.textContent = iniciales(currentUser.nombre); av.className = `avatar ${currentUser.rol}`; }
  $('#ucName') && ($('#ucName').textContent = currentUser.nombre.split(' ').slice(0, 2).join(' '));
  $('#ucRole') && ($('#ucRole').textContent = ROLE[currentUser.rol].label);
  // badge notifs
  const n = computeNotifs().length, badge = $('#notifBadge');
  if (badge) { badge.hidden = n === 0; badge.textContent = n; }
  // nav-counts por rol
  const misT = getTareas().filter((t) => t.asignadoAId === currentUser.id && t.estado !== 'hecha').length;
  const adminN = users.filter((u) => u.estado === 'pendiente').length + getPedidos().filter((p) => p.estado === 'pendiente').length;
  $$('.nav-count').forEach((c) => {
    if (c.dataset.count === 'mis-tareas') { c.textContent = misT || ''; }
    if (c.dataset.count === 'admin') { c.textContent = adminN || ''; }
  });
}

// ================================================================
//  UPLOADS (fotos / documentos)
// ================================================================
function readImage(file, cb, maxSide = 1280, q = 0.82) {
  const r = new FileReader();
  r.onload = () => {
    const img = new Image();
    img.onload = () => {
      let { width: w, height: h } = img; const m = Math.max(w, h);
      if (m > maxSide) { const s = maxSide / m; w = Math.round(w * s); h = Math.round(h * s); }
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      cb(c.toDataURL('image/jpeg', q));
    };
    img.onerror = () => cb(r.result);
    img.src = r.result;
  };
  r.readAsDataURL(file);
}

function dropzone(onFile, label = 'Arrastrá una foto o hacé click para elegir', accept = 'image/*') {
  const input = el('input', { type: 'file', accept, style: 'display:none' });
  input.addEventListener('change', () => { if (input.files[0]) onFile(input.files[0]); });
  const dz = el('div', { class: 'dropzone', onclick: () => input.click(),
    ondragover: (e) => { e.preventDefault(); dz.classList.add('over'); },
    ondragleave: () => dz.classList.remove('over'),
    ondrop: (e) => { e.preventDefault(); dz.classList.remove('over'); if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]); },
  }, icon('upload'), el('div', { class: 'dz-title' }, label), el('div', { class: 'dz-sub' }, 'JPG o PNG · se guarda en tu navegador'), input);
  return dz;
}

function subirFotoEquipo(eq) {
  const prev = el('div', { class: 'upload-preview', hidden: true }, el('img', { id: 'upImg' }));
  let dataUri = null;
  const dz = dropzone((file) => readImage(file, (uri) => { dataUri = uri; $('#upImg').src = uri; prev.hidden = false; }), 'Subí una foto nueva del equipo');
  openModal('Subir foto · ' + (eq.denominacion || ('Equipo #' + eq.id)), [
    el('div', { class: 'login-hint', style: 'margin-bottom:14px' }, 'La foto va a quedar en la ficha del equipo para que todos la vean.'),
    dz, prev,
  ]);
  $('#modalBody').append(el('div', { class: 'modal-foot', style: 'margin:20px -22px -22px' },
    el('button', { class: 'btn', onclick: closeModal }, 'Cancelar'),
    el('button', { class: 'btn btn-primary', onclick: () => {
      if (!dataUri) return toast('Elegí una foto primero', 'err');
      const u = getUploads(); u[eq.id] = { foto: dataUri, por: currentUser.nombre, fecha: new Date().toISOString().slice(0, 10) }; LS.set('uploads', u);
      toast('Foto actualizada ✓'); closeModal(); router();
    } }, icon('check'), 'Guardar foto')));
}

function mostrarQR(eq) {
  const url = location.origin + location.pathname + location.search + '#/equipos?open=' + eq.id;
  const holder = el('div', { class: 'qr-render' });
  openModal('Código QR · ' + (eq.denominacion || ('Equipo #' + eq.id)), [
    el('div', { class: 'qr-box' },
      holder,
      el('div', { class: 'qr-cap' }, 'Pegá este QR en la máquina. Al escanearlo con el celular se abre su ficha técnica, historial y planes.'),
    ),
  ]);
  $('#modalBody').append(el('div', { class: 'modal-foot', style: 'margin:20px -22px -22px' },
    el('button', { class: 'btn btn-primary', onclick: closeModal }, 'Listo')));
  try {
    if (window.QRCode) new QRCode(holder, { text: url, width: 200, height: 200, colorDark: '#10151f', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M });
    else holder.append(el('div', { class: 'cell-mute' }, url));
  } catch { holder.append(el('div', { class: 'cell-mute' }, url)); }
}

// ================================================================
//  VISTA · PANEL DOCENTE (profesor / admin)
// ================================================================
views.docente = async () => {
  const equipos = await api('/api/equipos');
  const misPedidos = getPedidos().filter((p) => currentUser.rol === 'admin' || p.solicitadoPorId === currentUser.id);
  const misTareas = getTareas().filter((t) => currentUser.rol === 'admin' || t.asignadoPorId === currentUser.id);
  const misFotos = Object.values(getUploads()).filter((u) => currentUser.rol === 'admin' || u.por === currentUser.nombre).length;

  const action = (cls, ic, title, desc, fn) => el('button', { class: `action-card ${cls}`, onclick: fn },
    el('div', { class: 'ac-ico' }, icon(ic)), el('div', { class: 'ac-title' }, title), el('div', { class: 'ac-desc' }, desc));

  return el('div', { class: 'view-enter' },
    el('div', { class: 'hero-banner' },
      el('div', { class: 'hb-ico' }, icon('book')),
      el('h1', {}, 'Panel docente'),
      el('div', { class: 'hb-sub' }, `Hola, ${currentUser.nombre.split(' ')[0]} 👋 — desde acá cargás todo sin dar vueltas.`),
    ),
    el('div', { class: 'docente-grid' },
      action('ac-brand', 'wrench', 'Reportar una falla', 'Se rompió o anda mal una máquina. Creás la orden de trabajo en 1 minuto.', () => ordenForm({ solicita: currentUser.nombre })),
      action('ac-blue', 'upload', 'Subir foto de equipo', 'Sacale una foto a la máquina y actualizá su ficha para que todos la vean.', () => elegirEquipoParaFoto(equipos)),
      action('ac-green', 'file', 'Subir manual o plano', 'Guardá el manual, un PDF o un plano asociado a un equipo.', () => subirDocForm(equipos)),
      action('ac-violet', 'cap', 'Asignar tarea a un alumno', 'Mandale una tarea a un estudiante y seguí si la completó.', () => asignarTareaForm(equipos)),
      action('ac-warn', 'box', 'Pedir un repuesto', 'Solicitá una pieza o material. El pedido le llega al encargado.', () => pedirRepuestoForm()),
    ),
    el('div', { class: 'grid two', style: 'margin-top:18px' },
      el('div', { class: 'card' },
        el('div', { class: 'card-head' }, el('h3', {}, 'Tareas que asigné'), el('div', { class: 'ch-icon' }, icon('cap'))),
        misTareas.length ? el('div', { class: 'task-list' }, ...misTareas.slice(0, 6).map(tareaRow)) : emptyState('Todavía no asignaste tareas', 'Usá “Asignar tarea a un alumno”.', 'cap'),
      ),
      el('div', { class: 'card' },
        el('div', { class: 'card-head' }, el('h3', {}, 'Mis pedidos de repuestos'), el('div', { class: 'ch-icon' }, icon('box'))),
        misPedidos.length ? el('div', { class: 'task-list' }, ...misPedidos.slice(0, 6).map((p) => el('div', { class: 'task-item' },
          el('div', { class: 'ti-main' }, el('div', { class: 'ti-title' }, `${p.repuesto} · x${p.cantidad}`),
            el('div', { class: 'ti-detail' }, p.motivo || 'Sin detalle'),
            el('div', { class: 'ti-meta' }, el('span', { class: `badge ${p.estado === 'aprobado' ? 'cerrada' : p.estado === 'rechazado' ? 'alta' : 'pendiente'}` }, p.estado), el('span', { class: 'badge' }, fmtDate(p.fecha)))),
        ))) : emptyState('Sin pedidos', 'Pedí un repuesto cuando lo necesites.', 'box'),
      ),
    ),
    el('div', { class: 'card', style: 'margin-top:18px' },
      el('div', { class: 'card-head' }, el('h3', {}, 'Resumen de tu actividad')),
      el('div', { class: 'stat-row', style: 'margin:0' },
        el('div', { class: 'stat-tile' }, el('div', { class: 'st-val' }, misFotos), el('div', { class: 'st-lbl' }, 'Fotos subidas')),
        el('div', { class: 'stat-tile' }, el('div', { class: 'st-val' }, misTareas.length), el('div', { class: 'st-lbl' }, 'Tareas asignadas')),
        el('div', { class: 'stat-tile' }, el('div', { class: 'st-val' }, misTareas.filter((t) => t.estado === 'hecha').length), el('div', { class: 'st-lbl' }, 'Tareas hechas')),
        el('div', { class: 'stat-tile' }, el('div', { class: 'st-val' }, getDocs().filter((d) => currentUser.rol === 'admin' || d.por === currentUser.nombre).length), el('div', { class: 'st-lbl' }, 'Documentos')),
      ),
    ),
  );
};

function elegirEquipoParaFoto(equipos) {
  openModal('¿A qué equipo le sacaste la foto?', [
    el('div', { class: 'login-hint', style: 'margin-bottom:12px' }, 'Elegí el equipo y después subís la foto.'),
    el('div', { style: 'max-height:50vh;overflow:auto;display:flex;flex-direction:column;gap:7px' },
      ...equipos.map((e) => el('button', { class: 'btn', style: 'justify-content:flex-start', onclick: () => { closeModal(); subirFotoEquipo(e); } },
        equipoFoto(e) ? el('img', { src: equipoFoto(e), style: 'width:30px;height:30px;border-radius:7px;object-fit:cover' }) : el('span', { class: 'avatar', style: 'width:30px;height:30px' }, icon('cog')),
        el('span', {}, e.denominacion || ('Equipo #' + e.id)), e.codigo ? el('span', { class: 'cell-mute mono', style: 'margin-left:auto;font-size:11px' }, e.codigo) : null)),
    ),
  ]);
}

function asignarTareaForm(equipos) {
  const alumnos = users.filter((u) => u.rol === 'alumno' && u.estado === 'activo');
  const field = (l, c) => el('label', { class: 'field' }, el('span', {}, l), c);
  const form = el('form', { class: 'form-grid', onsubmit: (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form).entries());
    if (!d.titulo || !d.alumno) return toast('Completá la tarea y el alumno', 'err');
    const alu = alumnos.find((a) => a.id === d.alumno);
    const t = getTareas(); t.unshift({ id: 'tk' + Date.now(), titulo: d.titulo, detalle: d.detalle || '', equipo: d.equipo || '', asignadoA: alu.nombre, asignadoAId: alu.id, asignadoPor: currentUser.nombre, asignadoPorId: currentUser.id, estado: 'pendiente', fecha: new Date().toISOString().slice(0, 10) });
    saveTareas(t); toast('Tarea asignada a ' + alu.nombre.split(' ')[0]); closeModal(); applyRole(); router();
  } },
    field('Tarea', el('input', { name: 'titulo', class: 'input', placeholder: 'Ej: Limpiar y lubricar el torno', required: true })),
    field('Alumno', el('select', { name: 'alumno', class: 'input' }, el('option', { value: '' }, 'Elegir…'), ...alumnos.map((a) => el('option', { value: a.id }, `${a.nombre} · ${a.curso || ''}`)))),
    field('Equipo (opcional)', el('select', { name: 'equipo', class: 'input' }, el('option', { value: '' }, '—'), ...equipos.map((e) => el('option', { value: e.denominacion || e.codigo }, e.denominacion || e.codigo)))),
    field('Detalle', el('textarea', { name: 'detalle', class: 'input', rows: 3, placeholder: 'Qué tiene que hacer, cuidados, etc.' })),
  );
  form.querySelector('[name=detalle]').parentElement.classList.add('col-span-3');
  form.querySelector('[name=titulo]').parentElement.classList.add('col-span-3');
  openModal('Asignar tarea a un alumno', [form]);
  $('#modalBody').append(el('div', { class: 'modal-foot', style: 'margin:20px -22px -22px' },
    el('button', { class: 'btn', onclick: closeModal }, 'Cancelar'),
    el('button', { class: 'btn btn-primary', onclick: () => form.requestSubmit() }, icon('check'), 'Asignar tarea')));
}

function pedirRepuestoForm() {
  const field = (l, c) => el('label', { class: 'field' }, el('span', {}, l), c);
  const form = el('form', { class: 'form-grid', onsubmit: (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form).entries());
    if (!d.repuesto) return toast('Escribí qué repuesto necesitás', 'err');
    const p = getPedidos(); p.unshift({ id: 'pd' + Date.now(), repuesto: d.repuesto, cantidad: Number(d.cantidad) || 1, motivo: d.motivo || '', solicitadoPor: currentUser.nombre, solicitadoPorId: currentUser.id, estado: 'pendiente', fecha: new Date().toISOString().slice(0, 10) });
    savePedidos(p); toast('Pedido enviado al encargado'); closeModal(); applyRole(); router();
  } },
    field('Repuesto / material', el('input', { name: 'repuesto', class: 'input', placeholder: 'Ej: Correa trapezoidal A-48', required: true })),
    field('Cantidad', el('input', { name: 'cantidad', class: 'input', type: 'number', min: '1', value: '1' })),
    field('Motivo', el('textarea', { name: 'motivo', class: 'input', rows: 2, placeholder: 'Para qué equipo / por qué' })),
  );
  form.querySelector('[name=repuesto]').parentElement.classList.add('col-span-2');
  form.querySelector('[name=motivo]').parentElement.classList.add('col-span-3');
  openModal('Pedir un repuesto', [form]);
  $('#modalBody').append(el('div', { class: 'modal-foot', style: 'margin:20px -22px -22px' },
    el('button', { class: 'btn', onclick: closeModal }, 'Cancelar'),
    el('button', { class: 'btn btn-primary', onclick: () => form.requestSubmit() }, icon('send'), 'Enviar pedido')));
}

function subirDocForm(equipos) {
  let dataUri = null, fileName = '';
  const info = el('div', { class: 'cell-mute', style: 'margin-top:10px', hidden: true });
  const input = el('input', { type: 'file', accept: '.pdf,image/*', style: 'display:none' });
  input.addEventListener('change', () => { const f = input.files[0]; if (!f) return; fileName = f.name; const r = new FileReader(); r.onload = () => { dataUri = r.result; info.textContent = '📎 ' + f.name; info.hidden = false; }; r.readAsDataURL(f); });
  const dz = el('div', { class: 'dropzone', onclick: () => input.click() }, icon('file'), el('div', { class: 'dz-title' }, 'Elegí un PDF, manual o plano'), el('div', { class: 'dz-sub' }, 'Se guarda en tu navegador'), input);
  const field = (l, c) => el('label', { class: 'field' }, el('span', {}, l), c);
  const form = el('form', {}, el('div', { class: 'form-grid' },
    field('Título', el('input', { name: 'titulo', class: 'input', placeholder: 'Ej: Manual del torno paralelo', required: true })),
    field('Equipo', el('select', { name: 'equipo', class: 'input' }, el('option', { value: '' }, '—'), ...equipos.map((e) => el('option', { value: e.denominacion || e.codigo }, e.denominacion || e.codigo)))),
  ), dz, info);
  openModal('Subir manual o documento', [form]);
  $('#modalBody').append(el('div', { class: 'modal-foot', style: 'margin:20px -22px -22px' },
    el('button', { class: 'btn', onclick: closeModal }, 'Cancelar'),
    el('button', { class: 'btn btn-primary', onclick: () => {
      const titulo = form.querySelector('[name=titulo]').value;
      if (!titulo) return toast('Ponele un título', 'err');
      if (!dataUri) return toast('Elegí un archivo', 'err');
      const d = getDocs(); d.unshift({ id: 'dc' + Date.now(), titulo, equipo: form.querySelector('[name=equipo]').value, archivo: fileName, por: currentUser.nombre, fecha: new Date().toISOString().slice(0, 10) });
      saveDocs(d); toast('Documento guardado ✓'); closeModal(); router();
    } }, icon('check'), 'Guardar')));
}

function tareaRow(t) {
  const alu = currentUser.rol === 'alumno';
  return el('div', { class: 'task-item' + (t.estado === 'hecha' ? ' done' : '') },
    el('div', { class: 'ti-check', title: alu ? 'Marcar como hecha' : '', onclick: alu ? () => toggleTarea(t.id) : null }, icon('check')),
    el('div', { class: 'ti-main' },
      el('div', { class: 'ti-title' }, t.titulo),
      el('div', { class: 'ti-detail' }, t.detalle || (t.equipo ? 'Equipo: ' + t.equipo : 'Sin detalle')),
      el('div', { class: 'ti-meta' },
        el('span', { class: `badge ${t.estado === 'hecha' ? 'cerrada' : t.estado === 'en_proceso' ? 'en_proceso' : 'pendiente'}` }, t.estado === 'hecha' ? 'Hecha' : t.estado === 'en_proceso' ? 'En proceso' : 'Pendiente'),
        t.equipo ? el('span', { class: 'badge' }, icon('cog'), t.equipo) : null,
        el('span', { class: 'badge' }, alu ? ('de ' + t.asignadoPor.split(' ')[0]) : ('para ' + t.asignadoA.split(' ')[0])),
      ),
    ),
  );
}

function toggleTarea(id) {
  const t = getTareas(); const it = t.find((x) => x.id === id); if (!it) return;
  it.estado = it.estado === 'hecha' ? 'pendiente' : 'hecha';
  saveTareas(t); toast(it.estado === 'hecha' ? '¡Tarea completada! 🎉' : 'Tarea reabierta'); applyRole(); router();
}

// ================================================================
//  VISTA · MIS TAREAS (alumno)
// ================================================================
views['mis-tareas'] = async () => {
  const mis = getTareas().filter((t) => t.asignadoAId === currentUser.id);
  const pend = mis.filter((t) => t.estado !== 'hecha');
  return el('div', { class: 'view-enter' },
    el('div', { class: 'hero-banner blue' },
      el('div', { class: 'hb-ico' }, icon('cap')),
      el('h1', {}, 'Mis tareas'),
      el('div', { class: 'hb-sub' }, `${pend.length ? pend.length + ' tarea' + (pend.length > 1 ? 's' : '') + ' pendiente' + (pend.length > 1 ? 's' : '') : '¡Estás al día!'} · ${currentUser.nombre} · ${currentUser.curso || ''}`),
    ),
    el('div', { class: 'grid two' },
      el('div', { class: 'card' },
        el('div', { class: 'card-head' }, el('h3', {}, 'Tareas asignadas'), el('div', { class: 'ch-icon' }, icon('clipboard'))),
        mis.length ? el('div', { class: 'task-list' }, ...mis.map(tareaRow)) : emptyState('No tenés tareas todavía', 'Cuando un profe te asigne algo, aparece acá.', 'cap'),
      ),
      el('div', {},
        el('div', { class: 'card-head' }, el('h3', {}, 'Tu pase digital'), el('div', { class: 'ch-icon' }, icon('user'))),
        el('div', { class: 'pase' },
          el('div', { class: 'pase-head' }, el('span', { class: 'avatar alumno lg' }, iniciales(currentUser.nombre)),
            el('div', {}, el('div', { style: 'font-weight:700;font-size:16px' }, currentUser.nombre), el('div', { style: 'opacity:.85;font-size:12.5px' }, 'Taller · ETN N°1 Otto Krause'))),
          el('div', { class: 'pase-body' },
            el('div', { class: 'pase-row' }, el('span', { class: 'pr-k' }, 'Curso'), el('span', { class: 'pr-v' }, currentUser.curso || '—')),
            el('div', { class: 'pase-row' }, el('span', { class: 'pr-k' }, 'Legajo'), el('span', { class: 'pr-v mono' }, currentUser.legajo || '—')),
            el('div', { class: 'pase-row' }, el('span', { class: 'pr-k' }, 'Tareas pendientes'), el('span', { class: 'pr-v' }, pend.length)),
            el('div', { class: 'pase-row' }, el('span', { class: 'pr-k' }, 'Tarea actual'), el('span', { class: 'pr-v' }, (pend[0] && pend[0].titulo) || 'Ninguna')),
          ),
          el('div', { class: 'pase-estado activo' }, '● Habilitado para taller'),
        ),
      ),
    ),
  );
};

// ================================================================
//  VISTA · ADMINISTRACIÓN
// ================================================================
views.admin = async () => {
  const pendientes = users.filter((u) => u.estado === 'pendiente');
  const activos = users.filter((u) => u.estado === 'activo');
  const pedidosPend = getPedidos().filter((p) => p.estado === 'pendiente');

  const userRow = (u) => el('tr', {},
    el('td', { style: 'width:40px' }, el('span', { class: `avatar ${u.rol}`, style: 'width:30px;height:30px;font-size:12px' }, iniciales(u.nombre))),
    el('td', { class: 'cell-strong' }, u.nombre),
    el('td', {}, el('span', { class: `badge ${u.rol === 'admin' ? 'prev' : u.rol === 'profesor' ? 'corr' : 'en_proceso'}` }, ROLE[u.rol].label)),
    el('td', { class: 'cell-mute' }, [u.sector, u.curso && ('Curso ' + u.curso)].filter(Boolean).join(' · ') || '—'),
    el('td', {}, el('span', { class: `badge ${u.estado === 'activo' ? 'cerrada' : 'pendiente'}` }, u.estado)),
    el('td', { class: 'row-actions' }, u.estado === 'pendiente'
      ? el('button', { class: 'btn btn-sm btn-primary', onclick: () => { u.estado = 'activo'; saveUsers(); toast('Profesor habilitado ✓'); applyRole(); router(); } }, icon('check'), 'Aprobar')
      : (u.rol !== 'admin' ? el('button', { class: 'btn btn-sm btn-danger', onclick: () => { if (!confirm('¿Dar de baja a ' + u.nombre + '?')) return; users = users.filter((x) => x.id !== u.id); saveUsers(); toast('Usuario dado de baja'); router(); } }, icon('trash')) : el('span', { class: 'cell-mute', style: 'font-size:12px' }, '—'))),
  );

  return el('div', { class: 'view-enter' },
    el('div', { class: 'hero-banner violet' },
      el('div', { class: 'hb-ico' }, icon('shield')),
      el('h1', {}, 'Administración'),
      el('div', { class: 'hb-sub' }, 'Gestioná usuarios, aprobá profesores y resolvé los pedidos del taller.'),
    ),
    el('div', { class: 'stat-row' },
      el('div', { class: 'stat-tile' }, el('div', { class: 'st-val' }, activos.length), el('div', { class: 'st-lbl' }, 'Usuarios activos')),
      el('div', { class: 'stat-tile' }, el('div', { class: 'st-val', style: pendientes.length ? 'color:var(--warn)' : '' }, pendientes.length), el('div', { class: 'st-lbl' }, 'Profes a aprobar')),
      el('div', { class: 'stat-tile' }, el('div', { class: 'st-val', style: pedidosPend.length ? 'color:var(--warn)' : '' }, pedidosPend.length), el('div', { class: 'st-lbl' }, 'Pedidos pendientes')),
      el('div', { class: 'stat-tile' }, el('div', { class: 'st-val' }, getTareas().length), el('div', { class: 'st-lbl' }, 'Tareas en el sistema')),
    ),
    pedidosPend.length ? el('div', { class: 'card', style: 'margin-bottom:18px' },
      el('div', { class: 'card-head' }, el('h3', {}, 'Pedidos de repuestos pendientes'), el('span', { class: 'badge pendiente' }, pedidosPend.length + ' sin resolver')),
      el('div', { class: 'task-list' }, ...pedidosPend.map((p) => el('div', { class: 'task-item' },
        el('div', { class: 'ti-main' }, el('div', { class: 'ti-title' }, `${p.repuesto} · x${p.cantidad}`), el('div', { class: 'ti-detail' }, `${p.motivo || ''} — pedido por ${p.solicitadoPor}`)),
        el('div', { style: 'display:flex;gap:7px' },
          el('button', { class: 'btn btn-sm btn-primary', onclick: () => resolverPedido(p.id, 'aprobado') }, icon('check'), 'Aprobar'),
          el('button', { class: 'btn btn-sm btn-danger', onclick: () => resolverPedido(p.id, 'rechazado') }, icon('close'), 'Rechazar')),
      ))),
    ) : null,
    el('div', { class: 'card' },
      el('div', { class: 'card-head' }, el('h3', {}, 'Usuarios del sistema'), el('button', { class: 'btn btn-sm btn-primary', onclick: nuevoUsuarioForm }, icon('plus'), 'Nuevo usuario')),
      el('div', { class: 'table-wrap' }, el('table', { class: 'data' },
        el('thead', {}, el('tr', {}, el('th', {}, ''), el('th', {}, 'Nombre'), el('th', {}, 'Rol'), el('th', {}, 'Detalle'), el('th', {}, 'Estado'), el('th', {}, ''))),
        el('tbody', {}, ...(pendientes.concat(activos)).map(userRow)),
      )),
    ),
  );
};

function resolverPedido(id, estado) {
  const p = getPedidos(); const it = p.find((x) => x.id === id); if (!it) return;
  it.estado = estado; savePedidos(p);
  toast(estado === 'aprobado' ? 'Pedido aprobado ✓' : 'Pedido rechazado'); applyRole(); router();
}

function nuevoUsuarioForm() {
  const field = (l, c) => el('label', { class: 'field' }, el('span', {}, l), c);
  const form = el('form', { class: 'form-grid', onsubmit: (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form).entries());
    if (!d.nombre || !d.rol) return toast('Nombre y rol son obligatorios', 'err');
    users.unshift({ id: 'u' + Date.now(), nombre: d.nombre, rol: d.rol, email: d.email || '', sector: d.sector || '', curso: d.curso || '', estado: 'activo' });
    saveUsers(); toast('Usuario creado'); closeModal(); router();
  } },
    field('Nombre y apellido', el('input', { name: 'nombre', class: 'input', required: true })),
    field('Rol', el('select', { name: 'rol', class: 'input' }, el('option', { value: 'profesor' }, 'Profesor'), el('option', { value: 'alumno' }, 'Alumno'), el('option', { value: 'admin' }, 'Administrador'))),
    field('E-mail', el('input', { name: 'email', class: 'input', type: 'email' })),
    field('Sector / Curso', el('input', { name: 'sector', class: 'input', placeholder: 'Tornería o 6°2' })),
  );
  openModal('Nuevo usuario', [form]);
  $('#modalBody').append(el('div', { class: 'modal-foot', style: 'margin:20px -22px -22px' },
    el('button', { class: 'btn', onclick: closeModal }, 'Cancelar'),
    el('button', { class: 'btn btn-primary', onclick: () => form.requestSubmit() }, icon('check'), 'Crear')));
}

// ================================================================
//  ASISTENTE (chatbot guiado) · "Otto"
// ================================================================
let chatStarted = false;
function buildChat() {
  if ($('#chatLauncher')) return;
  const launcher = el('button', { id: 'chatLauncher', class: 'chat-launcher', hidden: true, onclick: openChat },
    icon('chat'), el('span', {}, 'Asistente'), el('span', { class: 'cl-ping', id: 'clPing' }));
  const panel = el('div', { id: 'chatPanel', class: 'chat-panel', hidden: true },
    el('div', { class: 'chat-head' },
      el('div', { class: 'ch-av' }, icon('wrench')),
      el('div', {}, el('div', { class: 'ch-name' }, 'Otto · Asistente'), el('div', { class: 'ch-status' }, 'en línea para ayudarte')),
      el('button', { class: 'ch-close', onclick: closeChat }, icon('close')),
    ),
    el('div', { class: 'chat-body', id: 'chatBody' }),
    el('div', { class: 'chat-chips', id: 'chatChips' }),
    el('form', { class: 'chat-input', id: 'chatForm', onsubmit: (e) => { e.preventDefault(); const i = $('#chatText'); const v = i.value.trim(); if (!v) return; i.value = ''; chatUser(v); } },
      el('input', { id: 'chatText', placeholder: 'Escribí tu pregunta…', autocomplete: 'off' }),
      el('button', { type: 'submit' }, icon('send')),
    ),
  );
  document.body.append(launcher, panel);
}
function openChat() { $('#chatPanel').hidden = false; $('#chatLauncher').hidden = true; const p = $('#clPing'); if (p) p.style.display = 'none'; if (!chatStarted) chatWelcome(false); setTimeout(() => $('#chatText') && $('#chatText').focus(), 100); }
function closeChat() { const p = $('#chatPanel'); if (p) p.hidden = true; const l = $('#chatLauncher'); if (l && currentUser) l.hidden = false; }
function chatReset() { chatStarted = false; const b = $('#chatBody'); if (b) b.replaceChildren(); }

function chatPush(role, html) {
  const b = $('#chatBody'); if (!b) return;
  const m = el('div', { class: 'msg ' + role }); m.innerHTML = html; b.append(m); b.scrollTop = b.scrollHeight;
}
function chatChips(list) {
  const c = $('#chatChips'); if (!c) return;
  c.replaceChildren(...list.map((ch) => el('button', { class: 'chat-chip', onclick: () => chatUser(ch) }, ch)));
}
function chatBotSay(html, chips) {
  const b = $('#chatBody'); if (!b) return;
  const typing = el('div', { class: 'msg bot typing' }, el('span', {}), el('span', {}), el('span', {}));
  b.append(typing); b.scrollTop = b.scrollHeight;
  setTimeout(() => { typing.remove(); chatPush('bot', html); if (chips) chatChips(chips); }, 520);
}
function chatUser(text) { chatPush('user', text.replace(/</g, '&lt;')); setTimeout(() => chatReply(text), 180); }

function chatWelcome(first) {
  chatStarted = true;
  const name = currentUser ? currentUser.nombre.split(' ')[0] : '';
  const rol = currentUser ? currentUser.rol : 'profesor';
  const saludo = first
    ? `¡Hola <b>${name}</b>! 👋 Soy <b>Otto</b>, el asistente de MantenimientOK. Tranquilo que no hace falta saber de computación: yo te voy guiando.`
    : `¡Hola de nuevo, <b>${name}</b>! ¿En qué te doy una mano?`;
  chatBotSay(saludo, chipsPorRol(rol));
}
function chipsPorRol(rol) {
  if (rol === 'alumno') return ['¿Qué tengo que hacer?', '¿Qué es el pase digital?', 'Ver un equipo', 'Hacer el tour'];
  if (rol === 'admin') return ['¿Cómo apruebo un profe?', '¿Cómo veo los pedidos?', 'Reportar una falla', 'Hacer el tour'];
  return ['¿Cómo reporto una falla?', '¿Cómo subo una foto?', '¿Cómo pido un repuesto?', 'Hacer el tour'];
}

const CHAT_INTENTS = [
  { k: ['tour', 'guia', 'guía', 'empez', 'guiad', 'recorr', 'mostrame'], r: () => ({ t: '¡Dale! Te hago un tour guiado por la pantalla. Mirá 👀', after: () => { closeChat(); setTimeout(startTour, 350); } }) },
  { k: ['falla', 'orden', 'ot', 'romp', 'rota', 'roto', 'anda mal', 'arregl', 'repar', 'se rompi'], r: () => ({
      t: can('ot') ? 'Para <b>reportar una falla</b>:<br>1) Entrá a <b>Panel docente</b> → “Reportar una falla”, o abrí el equipo y tocá <b>Reportar falla</b>.<br>2) Describí qué pasa y listo: se crea la orden de trabajo.<br>¿Querés que te la abra ahora?'
            : 'Las fallas las reportan los profes. Vos podés ver el estado de los equipos en la sección <b>Equipos</b>.',
      chips: can('ot') ? ['Sí, crear la orden', 'Ver equipos'] : ['Ver equipos'],
      act: { 'Sí, crear la orden': () => { closeChat(); ordenForm({ solicita: currentUser.nombre }); }, 'Ver equipos': () => { location.hash = '#/equipos'; } } }) },
  { k: ['foto', 'imagen', 'subir foto', 'cargar foto', 'sacar foto'], r: () => ({
      t: can('subir') ? 'Para <b>subir una foto</b> de una máquina:<br>1) Entrá a <b>Equipos</b> y abrí el equipo.<br>2) Tocá <b>Subir foto</b> y elegí la imagen (o arrastrála).<br>Queda guardada en la ficha para todos. 📸'
            : 'Las fotos las cargan los profes. Igual podés ver las fichas con foto en <b>Equipos</b>.',
      chips: ['Ir a Equipos', 'Volver al menú'],
      act: { 'Ir a Equipos': () => { location.hash = '#/equipos'; }, 'Volver al menú': () => chatWelcome(false) } }) },
  { k: ['repuesto', 'pieza', 'material', 'stock', 'comprar', 'pedir'], r: () => ({
      t: can('pedir') ? 'Para <b>pedir un repuesto</b>: Panel docente → “Pedir un repuesto”. Escribís qué necesitás y la cantidad, y el pedido le llega al <b>encargado</b> para que lo apruebe.'
            : 'En <b>Repuestos</b> ves el stock del taller y lo que está bajo mínimo.',
      chips: can('pedir') ? ['Pedir un repuesto', 'Ver stock'] : ['Ver stock'],
      act: { 'Pedir un repuesto': () => { closeChat(); pedirRepuestoForm(); }, 'Ver stock': () => { location.hash = '#/repuestos'; } } }) },
  { k: ['tarea', 'asign', 'alumno', 'estudiante'], r: () => ({
      t: currentUser.rol === 'alumno' ? 'En <b>Mis tareas</b> ves lo que te asignaron los profes. Cuando terminás una, tocás el cuadradito ✅ para marcarla como hecha.'
            : 'Para <b>asignar una tarea</b> a un alumno: Panel docente → “Asignar tarea a un alumno”. Elegís el alumno, la tarea y (opcional) el equipo.',
      chips: currentUser.rol === 'alumno' ? ['Ir a Mis tareas'] : ['Asignar una tarea'],
      act: { 'Ir a Mis tareas': () => { location.hash = '#/mis-tareas'; }, 'Asignar una tarea': () => { location.hash = '#/docente'; } } }) },
  { k: ['equipo', 'maquina', 'máquina', 'ficha', 'ver equipo', 'torno'], r: () => ({
      t: 'En <b>Equipos</b> está cada máquina del taller con su foto, ficha técnica, historial de reparaciones y planes. Tocá una tarjeta para abrir su ficha. 🛠️',
      chips: ['Ir a Equipos'], act: { 'Ir a Equipos': () => { location.hash = '#/equipos'; } } }) },
  { k: ['preventiv', 'plan', 'programad'], r: () => ({
      t: 'El <b>mantenimiento preventivo</b> son las tareas programadas para que las máquinas no se rompan (engrasar, revisar, limpiar). Desde <b>Preventivo</b> podés generar una orden con un click.',
      chips: ['Ir a Preventivo', 'Volver al menú'], act: { 'Ir a Preventivo': () => { location.hash = '#/preventivo'; }, 'Volver al menú': () => chatWelcome(false) } }) },
  { k: ['qr', 'codigo', 'código'], r: () => ({ t: 'Cada equipo tiene un <b>código QR</b> (lo ves al abrir su ficha, botón “Código QR”). Lo pegás en la máquina y, al escanearlo con el celu, se abre su ficha al toque. 📱' }) },
  { k: ['aprob', 'habilit', 'pendiente'], r: () => ({
      t: currentUser.rol === 'admin' ? 'En <b>Administración</b> ves los profes <b>pendientes</b> y los pedidos sin resolver. Tocás “Aprobar” y queda habilitado.'
            : 'Las aprobaciones las hace el encargado (admin).',
      chips: currentUser.rol === 'admin' ? ['Ir a Administración'] : [], act: { 'Ir a Administración': () => { location.hash = '#/admin'; } } }) },
  { k: ['pase', 'credencial', 'circul'], r: () => ({ t: 'El <b>pase digital</b> es tu credencial de taller: muestra tu nombre, curso, legajo y la tarea en la que estás. Lo encontrás en <b>Mis tareas</b>.', chips: currentUser.rol === 'alumno' ? ['Ir a Mis tareas'] : [], act: { 'Ir a Mis tareas': () => { location.hash = '#/mis-tareas'; } } }) },
  { k: ['que es', 'qué es', 'sistema', 'mantenimientok', 'para que sirve', 'para qué sirve'], r: () => ({
      t: '<b>MantenimientOK</b> es la página del taller para ordenar el mantenimiento: equipos con foto, órdenes de trabajo, repuestos, tareas para alumnos y reportes. Reemplaza al viejo sistema de Access. 😉',
      chips: ['Hacer el tour', 'Volver al menú'], act: { 'Volver al menú': () => chatWelcome(false) } }) },
  { k: ['gracias', 'genial', 'buenisimo', 'buenísimo', 'perfecto', 'ok dale'], r: () => ({ t: '¡De nada! 💪 Cualquier cosa, tocá el botón del asistente abajo a la derecha. Estoy siempre acá.' }) },
  { k: ['hola', 'buenas', 'buen dia', 'buen día', 'que tal'], r: () => ({ t: `¡Hola! ¿En qué te ayudo?`, chips: chipsPorRol(currentUser.rol) }) },
];

function chatReply(text) {
  const low = text.toLowerCase();
  let intent = CHAT_INTENTS.find((i) => i.k.some((k) => low.includes(k)));
  const res = intent ? intent.r() : {
    t: 'Mmm, no estoy seguro de eso 🤔. Pero puedo ayudarte con estas cosas:',
    chips: chipsPorRol(currentUser.rol),
  };
  chatBotSay(res.t, res.chips);
  if (res.after) setTimeout(res.after, 700);
  if (res.act) {
    const c = $('#chatChips');
    setTimeout(() => { $$('.chat-chip', c).forEach((btn) => { const fn = res.act[btn.textContent]; if (fn) btn.onclick = () => { fn(); }; }); }, 560);
  }
}

// ================================================================
//  TOUR GUIADO
// ================================================================
function tourSteps() {
  const base = [
    { sel: '.sidebar nav', t: 'Este es el menú. Desde acá entrás a cada sección. Según tu rol, vas a ver unas u otras.' },
    { sel: '#globalSearch', t: 'Buscador: escribí el nombre de una máquina, una orden o un repuesto y lo encontrás al toque.' },
    { sel: '#chatLauncher', t: 'Y este soy yo, el asistente 🤖. Si algo no sabés cómo hacerlo, tocá acá y te explico.' },
  ];
  if (currentUser.rol === 'profesor') base.splice(1, 0, { sel: 'a[data-route="docente"]', t: 'Tu lugar es el <b>Panel docente</b>: reportar fallas, subir fotos, pedir repuestos y asignar tareas. Todo con botones grandes.' });
  if (currentUser.rol === 'admin') base.splice(1, 0, { sel: 'a[data-route="admin"]', t: 'En <b>Administración</b> aprobás profes y resolvés pedidos del taller.' });
  if (currentUser.rol === 'alumno') base.splice(1, 0, { sel: 'a[data-route="mis-tareas"]', t: 'En <b>Mis tareas</b> ves lo que te asignaron y tu pase digital.' });
  return base;
}
let tourI = 0, tourList = [];
function startTour() {
  tourList = tourSteps().filter((s) => document.querySelector(s.sel)); tourI = 0;
  let layer = $('#tourLayer');
  if (!layer) { layer = el('div', { id: 'tourLayer', class: 'tour-layer' }, el('div', { class: 'tour-mask', id: 'tourMask' }), el('div', { class: 'tour-ring', id: 'tourRing' }), el('div', { class: 'tour-pop', id: 'tourPop' })); document.body.append(layer); }
  layer.hidden = false; renderTour();
  window.addEventListener('resize', renderTour);
}
function endTour() { const l = $('#tourLayer'); if (l) l.hidden = true; window.removeEventListener('resize', renderTour); }
function renderTour() {
  const step = tourList[tourI]; if (!step) return endTour();
  const target = document.querySelector(step.sel); if (!target) { tourI++; return renderTour(); }
  const r = target.getBoundingClientRect(), pad = 8;
  const ring = $('#tourRing'); ring.style.left = (r.left - pad) + 'px'; ring.style.top = (r.top - pad) + 'px'; ring.style.width = (r.width + pad * 2) + 'px'; ring.style.height = (r.height + pad * 2) + 'px';
  const mask = $('#tourMask');
  mask.style.clipPath = `polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 ${r.top - pad}px, ${r.left - pad}px ${r.top - pad}px, ${r.left - pad}px ${r.bottom + pad}px, ${r.right + pad}px ${r.bottom + pad}px, ${r.right + pad}px ${r.top - pad}px, 0 ${r.top - pad}px)`;
  const pop = $('#tourPop');
  pop.replaceChildren(
    el('div', { class: 'tp-step' }, `Paso ${tourI + 1} de ${tourList.length}`),
    el('div', { class: 'tp-title' }, 'Tour guiado'),
    el('div', { class: 'tp-text', html: step.t }),
    el('div', { class: 'tp-foot' },
      el('div', { class: 'tp-dots' }, ...tourList.map((_, i) => el('i', { class: i === tourI ? 'on' : '' }))),
      el('div', { style: 'display:flex;gap:7px' },
        el('button', { class: 'btn btn-sm', onclick: endTour }, 'Salir'),
        el('button', { class: 'btn btn-sm btn-primary', onclick: () => { tourI++; tourI >= tourList.length ? (endTour(), toast('¡Listo! Ya conocés lo básico 🎉')) : renderTour(); } }, tourI + 1 >= tourList.length ? 'Terminar' : 'Siguiente')),
    ),
  );
  let top = r.bottom + 14; if (top + 170 > innerHeight) top = Math.max(14, r.top - 184);
  let left = Math.min(Math.max(14, r.left), innerWidth - 314);
  pop.style.top = top + 'px'; pop.style.left = left + 'px';
}

// ================================================================
//  INIT
// ================================================================
buildTopbar();
buildChat();
window.addEventListener('hashchange', router);
if (currentUser) {
  buildTopbar(); applyRole(); $('#chatLauncher').hidden = false;
  loadNavCounts();
  router();
} else {
  showLogin();
}
