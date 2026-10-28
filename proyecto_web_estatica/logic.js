/* Capa de datos local: reemplaza al backend FastAPI.
   Opera 100% en el navegador sobre window.GMAO_DATA (datos reales del taller).
   Las mutaciones (crear/editar/borrar OT, generar preventiva, alta técnico)
   viven en memoria durante la sesión — ideal para demostrar. */
(function () {
  const D = window.GMAO_DATA;
  const HORAS = 2112;
  const today = () => new Date().toISOString().slice(0, 10);
  const low = (s) => (s || '').toString().toLowerCase();
  const has = (v, q) => low(v).includes(low(q));
  let seqOrden = Math.max(0, ...D.ordenes.map((o) => o.id || 0));
  let seqTec = Math.max(0, ...D.tecnicos.map((t) => t.id || 0));

  const clone = (x) => JSON.parse(JSON.stringify(x));

  function log(tipo, entidad, id, detalle) {
    D.actividad.unshift({ tipo, entidad, entidad_id: id, detalle, ts: new Date().toISOString().slice(0, 16).replace('T', ' ') });
  }

  // ------- equipos: n_ot / n_planes por match -------
  const otsDeEquipo = (e) => D.ordenes.filter((o) => o.equipo_id === e.id || o.codmaq === e.codigo || o.codmaq === e.denominacion);
  const planesDeEquipo = (e) => D.planes.filter((p) => p.equipo_id === e.id || p.codmaq === e.codigo || p.codmaq === e.denominacion);
  const motoresDeEquipo = (e) => D.motores.filter((m) => m.equipo_id === e.id || m.codigo === e.codigo || m.codigo === e.denominacion);

  function months(n) {
    const out = [];
    const d = new Date(); d.setDate(1);
    for (let i = n - 1; i >= 0; i--) {
      const dt = new Date(d.getFullYear(), d.getMonth() - i, 1);
      out.push(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`);
    }
    return out;
  }

  function panel() {
    const abiertas = D.ordenes.filter((o) => o.estado === 'pendiente' || o.estado === 'en_proceso');
    const t = today();
    const vencidas = abiertas.filter((o) => o.vence && o.vence < t);
    const estadosMap = {};
    D.ordenes.forEach((o) => { estadosMap[o.estado] = (estadosMap[o.estado] || 0) + 1; });
    const estados = Object.entries(estadosMap).map(([estado, c]) => ({ estado, c })).sort((a, b) => b.c - a.c);

    const totalPlanes = D.planes.length;
    const cumplidos = new Set(D.planes.filter((p) => D.ordenes.some((o) => o.codmaq === p.codmaq && low(o.tipo_mant).startsWith('prevent'))).map((p) => p.id)).size;
    const cumplimiento = totalPlanes ? Math.round((cumplidos / totalPlanes) * 1000) / 10 : 0;

    const corr = D.ordenes.filter((o) => low(o.tipo_mant).startsWith('correct'));
    const ttrArr = corr.filter((o) => o.hs_hom != null).map((o) => o.hs_hom);
    const mttr = ttrArr.length ? Math.round((ttrArr.reduce((a, b) => a + b, 0) / ttrArr.length) * 100) / 100 : 0;
    const fallas = corr.filter((o) => o.fecha_solic).length;
    const mtbf = fallas ? Math.round((HORAS / fallas) * 100) / 100 : null;
    const disponibilidad = mtbf && mttr ? Math.round((mtbf / (mtbf + mttr)) * 10000) / 100 : (mtbf ? 100 : null);

    const bajoMin = D.repuestos.filter((r) => r.bajo_min);

    const serie = months(6).map((m) => ({
      mes: m,
      correctivo: D.ordenes.filter((o) => (o.fecha_solic || '').slice(0, 7) === m && low(o.tipo_mant).startsWith('correct')).length,
      preventivo: D.ordenes.filter((o) => (o.fecha_solic || '').slice(0, 7) === m && low(o.tipo_mant).startsWith('prevent')).length,
    }));

    const grp = (arr, key) => {
      const m = {};
      arr.forEach((o) => { const k = o[key] || (key === 'sector' ? 'Sin sector' : 'MEDIA'); m[k] = (m[k] || 0) + 1; });
      return Object.entries(m).map(([k, c]) => ({ [key]: k, c })).sort((a, b) => b.c - a.c);
    };
    const por_sector = grp(D.ordenes, 'sector').slice(0, 8);
    const por_prioridad = grp(abiertas, 'prioridad');
    const equipos_por_sector = (() => { const m = {}; D.equipos.forEach((e) => { const k = e.sector || 'Sin sector'; m[k] = (m[k] || 0) + 1; }); return Object.entries(m).map(([sector, c]) => ({ sector, c })).sort((a, b) => b.c - a.c); })();

    const top_equipos = D.equipos.map((e) => ({ id: e.id, denominacion: e.denominacion, codigo: e.codigo, foto: e.foto, n_ot: otsDeEquipo(e).length }))
      .filter((e) => e.n_ot > 0).sort((a, b) => b.n_ot - a.n_ot).slice(0, 5);

    const proximos = abiertas.filter((o) => o.vence).sort((a, b) => (a.vence < b.vence ? -1 : 1)).slice(0, 6)
      .map((o) => ({ id: o.id, nro_solic: o.nro_solic, codmaq: o.codmaq, prioridad: o.prioridad, vence: o.vence, estado: o.estado }));

    return {
      totales: { equipos: D.equipos.length, ordenes: D.ordenes.length, planes: D.planes.length, repuestos: D.repuestos.length, tecnicos: D.tecnicos.length },
      ordenes_abiertas: abiertas.length, ordenes_vencidas: vencidas.length,
      cumplimiento_preventivo: cumplimiento, mtbf, mttr, disponibilidad,
      estados, repuestos_bajo_min: clone(bajoMin), serie_mensual: serie,
      por_sector, por_prioridad, equipos_por_sector, top_equipos,
      proximos_vencimientos: proximos, actividad: D.actividad.slice(0, 8),
    };
  }

  function buscar(q) {
    const lim = (arr) => arr.slice(0, 6);
    return {
      equipos: lim(D.equipos.filter((e) => has(e.denominacion, q) || has(e.codigo, q) || has(e.marca, q) || has(e.modelo, q))).map((e) => ({ id: e.id, denominacion: e.denominacion, codigo: e.codigo, sector: e.sector, foto: e.foto })),
      ordenes: lim(D.ordenes.filter((o) => has(o.nro_solic, q) || has(o.codmaq, q) || has(o.solicita, q) || has(o.tipo_desperfecto, q))).map((o) => ({ id: o.id, nro_solic: o.nro_solic, codmaq: o.codmaq, estado: o.estado, tipo_mant: o.tipo_mant })),
      repuestos: lim(D.repuestos.filter((r) => has(r.parte, q) || has(r.marca, q) || has(r.especificacion, q) || has(r.nro, q))).map((r) => ({ id: r.id, nro: r.nro, parte: r.parte, marca: r.marca, especificacion: r.especificacion })),
      tecnicos: lim(D.tecnicos.filter((t) => has(t.nombre, q) || has(t.funcion, q))).map((t) => ({ id: t.id, nombre: t.nombre, funcion: t.funcion, sector: t.sector })),
    };
  }

  function listarEquipos(q, sector) {
    let arr = D.equipos.slice();
    if (q) arr = arr.filter((e) => has(e.denominacion, q) || has(e.codigo, q) || has(e.marca, q) || has(e.modelo, q));
    if (sector) arr = arr.filter((e) => e.sector === sector);
    arr.sort((a, b) => low(a.denominacion).localeCompare(low(b.denominacion)));
    return arr.map((e) => ({ ...e, n_ot: otsDeEquipo(e).length, n_planes: planesDeEquipo(e).length }));
  }

  function detalleEquipo(id) {
    const e = D.equipos.find((x) => x.id === id);
    if (!e) throw new Error('404');
    const ots = otsDeEquipo(e).slice().sort((a, b) => ((a.fecha_solic || '') < (b.fecha_solic || '') ? 1 : -1));
    return { equipo: clone(e), motores: clone(motoresDeEquipo(e)), ordenes: clone(ots), planes: clone(planesDeEquipo(e)) };
  }

  function withVencida(o) { const t = today(); return { ...o, vencida: !!(o.vence && o.vence < t && (o.estado === 'pendiente' || o.estado === 'en_proceso')) }; }

  function listarOrdenes(qs) {
    let arr = D.ordenes.slice();
    const estado = qs.get('estado'), q = qs.get('q'), tipo = qs.get('tipo');
    if (estado) arr = arr.filter((o) => o.estado === estado);
    if (tipo) arr = arr.filter((o) => low(o.tipo_mant).startsWith(low(tipo)));
    if (q) arr = arr.filter((o) => has(o.nro_solic, q) || has(o.codmaq, q) || has(o.sector, q) || has(o.solicita, q) || has(o.tipo_desperfecto, q));
    arr.sort((a, b) => { const av = a.fecha_solic || '', bv = b.fecha_solic || ''; if (!av && bv) return 1; if (av && !bv) return -1; if (av !== bv) return av < bv ? 1 : -1; return b.id - a.id; });
    return arr.map(withVencida);
  }

  function detalleOrden(id) {
    const o = D.ordenes.find((x) => x.id === id);
    if (!o) throw new Error('404');
    const d = clone(o);
    if (o.equipo_id) { const e = D.equipos.find((x) => x.id === o.equipo_id); if (e) d.equipo = { id: e.id, denominacion: e.denominacion, codigo: e.codigo, foto: e.foto }; }
    return d;
  }

  const SLA = { ALTA: 3, MEDIA: 7, BAJA: 15 };
  function vencePara(fecha, prioridad) {
    if (!fecha) return null;
    const d = new Date(fecha + 'T00:00:00'); d.setDate(d.getDate() + (SLA[(prioridad || 'MEDIA').toUpperCase()] || 7));
    return d.toISOString().slice(0, 10);
  }

  function crearOrden(b) {
    let eid = null;
    if (b.codmaq) { const e = D.equipos.find((x) => x.codigo === b.codmaq || x.denominacion === b.codmaq); eid = e ? e.id : null; }
    const o = {
      id: ++seqOrden, nro_solic: b.nro_solic || null, tipo_mant: b.tipo_mant || null, fecha_solic: b.fecha_solic || null,
      sector: b.sector || null, solicita: b.solicita || null, prioridad: b.prioridad || 'MEDIA', estado: b.estado || 'pendiente',
      equipo_id: eid, codmaq: b.codmaq || null, tipo_desperfecto: b.tipo_desperfecto || null, accion_realizada: b.accion_realizada || null,
      ejecuta: b.ejecuta || null, caracter: b.caracter || null, observ_generales: b.observ_generales || null,
      fecha_ini: b.fecha_ini || null, fecha_fin: b.fecha_fin || null, hs_hom: b.hs_hom != null ? Number(b.hs_hom) : null,
      vence: vencePara(b.fecha_solic, b.prioridad), foto: null, fuente: 'manual',
    };
    D.ordenes.push(o);
    log('alta', 'orden', o.id, `OT ${o.nro_solic || '#' + o.id} creada`);
    return detalleOrden(o.id);
  }

  function actualizarOrden(id, b) {
    const o = D.ordenes.find((x) => x.id === id);
    if (!o) throw new Error('404');
    const prevEstado = o.estado;
    if (b.estado === 'cerrada' && !b.fecha_fin && !o.fecha_fin) b.fecha_fin = today();
    Object.keys(b).forEach((k) => { o[k] = b[k]; });
    if (o.hs_hom != null) o.hs_hom = Number(o.hs_hom);
    if (b.estado && b.estado !== prevEstado) log('estado', 'orden', id, `OT ${o.nro_solic || '#' + id}: ${prevEstado} → ${b.estado}`);
    else log('edicion', 'orden', id, `OT ${o.nro_solic || '#' + id} editada`);
    return detalleOrden(id);
  }

  function borrarOrden(id) {
    const i = D.ordenes.findIndex((x) => x.id === id);
    if (i >= 0) { const nro = D.ordenes[i].nro_solic; D.ordenes.splice(i, 1); log('baja', 'orden', id, `OT ${nro || '#' + id} eliminada`); }
    return { ok: true };
  }

  function listarPlanes(q) {
    let arr = D.planes.slice();
    if (q) arr = arr.filter((p) => has(p.codmaq, q) || has(p.parte, q) || has(p.tarea, q) || has(p.detalle, q));
    arr.sort((a, b) => low(a.codmaq).localeCompare(low(b.codmaq)));
    return clone(arr);
  }

  function generarOt(pid) {
    const p = D.planes.find((x) => x.id === pid);
    if (!p) throw new Error('404');
    const nro = 'PREV-' + new Date().toISOString().slice(2, 16).replace(/[-:T]/g, '');
    const o = {
      id: ++seqOrden, nro_solic: nro, tipo_mant: 'Preventivo', fecha_solic: today(), sector: null,
      solicita: 'Sistema (plan preventivo)', prioridad: 'MEDIA', estado: 'pendiente', equipo_id: p.equipo_id || null,
      codmaq: p.codmaq, tipo_desperfecto: p.parte, accion_realizada: p.detalle, ejecuta: p.ejecuta, caracter: 'PROGRAMADO',
      observ_generales: p.observ, fecha_ini: null, fecha_fin: null, hs_hom: null, vence: today(), foto: null, fuente: 'preventivo',
    };
    D.ordenes.push(o);
    log('alta', 'orden', o.id, `OT preventiva ${nro} generada del plan #${pid}`);
    return detalleOrden(o.id);
  }

  function listarRepuestos(bajo, q) {
    let arr = D.repuestos.slice();
    if (bajo) arr = arr.filter((r) => r.bajo_min);
    if (q) arr = arr.filter((r) => has(r.parte, q) || has(r.marca, q) || has(r.especificacion, q) || has(r.proveedor, q));
    arr.sort((a, b) => (b.bajo_min || 0) - (a.bajo_min || 0) || low(a.parte).localeCompare(low(b.parte)));
    return clone(arr);
  }

  function listarTecnicos() {
    return D.tecnicos.map((t) => ({ ...t, n_ot: D.ordenes.filter((o) => has(o.ejecuta, t.nombre)).length }));
  }
  function crearTecnico(b) {
    if (!b.nombre) throw new Error('nombre requerido');
    const t = { id: ++seqTec, nombre: b.nombre, sector: b.sector || null, funcion: b.funcion || null, email: b.email || null, fecha_alta: today() };
    D.tecnicos.push(t); log('alta', 'tecnico', t.id, `Técnico ${t.nombre} dado de alta`);
    return clone(t);
  }

  function catalogos() {
    return {
      sectores: clone(D.sectores), tipos_mant: clone(D.tipos_mant), caracteres_mant: clone(D.caracteres_mant),
      acciones_mant: clone(D.acciones_mant), ejecutantes: clone(D.ejecutantes),
      prioridades: [{ id: 1, nombre: 'ALTA' }, { id: 2, nombre: 'MEDIA' }, { id: 3, nombre: 'BAJA' }],
    };
  }

  function reporteMtbf() {
    const m = {};
    D.ordenes.filter((o) => low(o.tipo_mant).startsWith('correct')).forEach((o) => {
      const k = o.codmaq || '(sin equipo)';
      m[k] = m[k] || { equipo: k, fallas: 0, ttr: [], horas: 0 };
      m[k].fallas++; if (o.hs_hom != null) { m[k].ttr.push(o.hs_hom); m[k].horas += o.hs_hom; }
    });
    return Object.values(m).map((r) => ({ equipo: r.equipo, fallas: r.fallas, mttr: r.ttr.length ? Math.round((r.ttr.reduce((a, b) => a + b, 0) / r.ttr.length) * 100) / 100 : 0, mtbf: r.fallas ? Math.round((HORAS / r.fallas) * 100) / 100 : null, horas: Math.round(r.horas * 10) / 10 })).sort((a, b) => b.fallas - a.fallas);
  }
  function reporteCostos() {
    const m = {};
    D.ordenes.forEach((o) => {
      const k = o.sector || '(sin sector)';
      m[k] = m[k] || { sector: k, ots: 0, horas: 0, correctivas: 0, preventivas: 0 };
      m[k].ots++; m[k].horas += o.hs_hom || 0;
      if (low(o.tipo_mant).startsWith('correct')) m[k].correctivas++;
      if (low(o.tipo_mant).startsWith('prevent')) m[k].preventivas++;
    });
    return Object.values(m).map((r) => ({ ...r, horas: Math.round(r.horas * 10) / 10 })).sort((a, b) => b.horas - a.horas);
  }

  // ------- router -------
  window.LOCAL_API = async function (path, opts) {
    opts = opts || {};
    const method = opts.method || 'GET';
    const body = opts.body || {};
    const u = new URL(path, 'http://x');
    const p = u.pathname, qs = u.searchParams;
    let m;
    if (p === '/api/panel') return panel();
    if (p === '/api/buscar') return buscar(qs.get('q') || '');
    if (p === '/api/catalogos') return catalogos();
    if (p === '/api/actividad') return D.actividad.slice(0, +(qs.get('limit') || 30));
    if (p === '/api/equipos') return listarEquipos(qs.get('q'), qs.get('sector'));
    if ((m = p.match(/^\/api\/equipos\/(\d+)$/))) return detalleEquipo(+m[1]);
    if (p === '/api/ordenes' && method === 'GET') return listarOrdenes(qs);
    if (p === '/api/ordenes' && method === 'POST') return crearOrden(body);
    if ((m = p.match(/^\/api\/ordenes\/(\d+)$/))) {
      if (method === 'GET') return detalleOrden(+m[1]);
      if (method === 'PATCH') return actualizarOrden(+m[1], body);
      if (method === 'DELETE') return borrarOrden(+m[1]);
    }
    if (p === '/api/planes') return listarPlanes(qs.get('q'));
    if ((m = p.match(/^\/api\/planes\/(\d+)\/generar-ot$/))) return generarOt(+m[1]);
    if (p === '/api/repuestos') return listarRepuestos(qs.get('bajo_min') === 'true', qs.get('q'));
    if (p === '/api/tecnicos' && method === 'GET') return listarTecnicos();
    if (p === '/api/tecnicos' && method === 'POST') return crearTecnico(body);
    if (p === '/api/reportes/mtbf') return reporteMtbf();
    if (p === '/api/reportes/costos') return reporteCostos();
    throw new Error('Ruta no encontrada: ' + p);
  };
})();
