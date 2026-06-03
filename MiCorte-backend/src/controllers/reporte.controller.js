const reporteService = require('../services/reporte.service');
const { ok, badRequest } = require('../utils/response');

const FORMATOS = ['json', 'xlsx', 'pdf'];

const MIME = {
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pdf:  'application/pdf'
};

// Envía el archivo como descarga o responde JSON
function sendReporte(res, resultado, nombre) {
  if (resultado.buffer) {
    const ext  = resultado.tipo;
    const fecha = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', MIME[ext]);
    res.setHeader('Content-Disposition', `attachment; filename="${nombre}_${fecha}.${ext}"`);
    return res.send(resultado.buffer);
  }
  return ok(res, resultado);
}

function getFormato(query) {
  const fmt = (query.formato || 'json').toLowerCase();
  return FORMATOS.includes(fmt) ? fmt : 'json';
}

async function ingresos(req, res, next) {
  try {
    const fmt = getFormato(req.query);
    const resultado = await reporteService.ingresos(req.empresaId, req.query, fmt);
    return sendReporte(res, resultado, 'ingresos');
  } catch (err) { next(err); }
}

async function citas(req, res, next) {
  try {
    const fmt = getFormato(req.query);
    const resultado = await reporteService.citas(req.empresaId, req.query, fmt);
    return sendReporte(res, resultado, 'citas');
  } catch (err) { next(err); }
}

async function inventario(req, res, next) {
  try {
    const fmt = getFormato(req.query);
    const resultado = await reporteService.inventario(req.empresaId, req.query, fmt);
    return sendReporte(res, resultado, 'inventario');
  } catch (err) { next(err); }
}

async function noShows(req, res, next) {
  try {
    const fmt = getFormato(req.query);
    const resultado = await reporteService.noShows(req.empresaId, req.query, fmt);
    return sendReporte(res, resultado, 'no-shows');
  } catch (err) { next(err); }
}

async function estilistas(req, res, next) {
  try {
    const fmt = getFormato(req.query);
    const resultado = await reporteService.estilistas(req.empresaId, req.query, fmt);
    return sendReporte(res, resultado, 'estilistas');
  } catch (err) { next(err); }
}

module.exports = { ingresos, citas, inventario, noShows, estilistas };
