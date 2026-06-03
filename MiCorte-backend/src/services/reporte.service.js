const reporteRepo = require('../repositories/reporte.repository');
const excel       = require('../utils/excel');
const pdf         = require('../utils/pdf');

// Convierte fecha corta 'YYYY-MM-DD' al formato MySQL DATETIME
function toMysqlDate(fecha, endOfDay = false) {
  if (!fecha) return null;
  return endOfDay ? `${fecha} 23:59:59` : `${fecha} 00:00:00`;
}

// ── Ingresos ──────────────────────────────────────────────────

async function ingresos(empresa_id, filtros, formato) {
  const params = {
    fecha_inicio: toMysqlDate(filtros.fecha_inicio),
    fecha_fin:    toMysqlDate(filtros.fecha_fin, true),
    sucursal_id:  filtros.sucursal_id
  };

  const [data, resumen] = await Promise.all([
    reporteRepo.getIngresos(empresa_id, params),
    reporteRepo.getIngresosResumen(empresa_id, params)
  ]);

  if (formato === 'xlsx') return { buffer: await excel.buildIngresos(data, resumen, filtros), tipo: 'xlsx', nombre: 'ingresos' };
  if (formato === 'pdf')  return { buffer: await pdf.buildIngresosPDF(data, resumen, filtros), tipo: 'pdf',  nombre: 'ingresos' };
  return { data, resumen };
}

// ── Citas ─────────────────────────────────────────────────────

async function citas(empresa_id, filtros, formato) {
  const data = await reporteRepo.getCitas(empresa_id, filtros);

  if (formato === 'xlsx') return { buffer: await excel.buildCitas(data, filtros), tipo: 'xlsx', nombre: 'citas' };
  if (formato === 'pdf')  return { buffer: await pdf.buildCitasPDF(data, filtros), tipo: 'pdf',  nombre: 'citas' };
  return { data, total: data.length };
}

// ── Inventario ────────────────────────────────────────────────

async function inventario(empresa_id, filtros, formato) {
  const [data, resumen] = await Promise.all([
    reporteRepo.getInventario(empresa_id, filtros),
    reporteRepo.getInventarioResumen(empresa_id, filtros)
  ]);

  if (formato === 'xlsx') return { buffer: await excel.buildInventario(data, resumen), tipo: 'xlsx', nombre: 'inventario' };
  if (formato === 'pdf')  return { buffer: await pdf.buildInventarioPDF(data, resumen), tipo: 'pdf',  nombre: 'inventario' };
  return { data, resumen };
}

// ── No-shows ──────────────────────────────────────────────────

async function noShows(empresa_id, filtros, formato) {
  const params = {
    fecha_inicio: toMysqlDate(filtros.fecha_inicio),
    fecha_fin:    toMysqlDate(filtros.fecha_fin, true),
    sucursal_id:  filtros.sucursal_id
  };

  const [data, resumen] = await Promise.all([
    reporteRepo.getNoShows(empresa_id, params),
    reporteRepo.getNoShowsResumen(empresa_id, params)
  ]);

  if (formato === 'xlsx') return { buffer: await excel.buildNoShows(data, resumen, filtros), tipo: 'xlsx', nombre: 'no-shows' };
  if (formato === 'pdf')  return { buffer: await pdf.buildNoShowsPDF(data, resumen, filtros), tipo: 'pdf',  nombre: 'no-shows' };
  return { data, resumen };
}

// ── Estilistas ────────────────────────────────────────────────

async function estilistas(empresa_id, filtros, formato) {
  const params = {
    fecha_inicio: toMysqlDate(filtros.fecha_inicio),
    fecha_fin:    toMysqlDate(filtros.fecha_fin, true),
    sucursal_id:  filtros.sucursal_id
  };

  const data = await reporteRepo.getEstilistas(empresa_id, params);

  if (formato === 'xlsx') return { buffer: await excel.buildEstilistas(data, filtros), tipo: 'xlsx', nombre: 'estilistas' };
  if (formato === 'pdf')  return { buffer: await pdf.buildEstilistasPDF(data, filtros), tipo: 'pdf',  nombre: 'estilistas' };
  return { data, total: data.length };
}

module.exports = { ingresos, citas, inventario, noShows, estilistas };
