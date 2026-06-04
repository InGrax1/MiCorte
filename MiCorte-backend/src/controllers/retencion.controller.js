const retService = require('../services/retencion.service');
const { ok }     = require('../utils/response');

async function resumen(req, res, next) {
  try {
    const data = await retService.resumen(req.empresaId, req.query);
    return ok(res, data);
  } catch (err) { next(err); }
}

async function enRiesgo(req, res, next) {
  try {
    const data = await retService.enRiesgo(req.empresaId, req.query);
    return ok(res, data);
  } catch (err) { next(err); }
}

async function topClientes(req, res, next) {
  try {
    const data = await retService.topClientes(req.empresaId, req.query);
    return ok(res, data);
  } catch (err) { next(err); }
}

async function cohortes(req, res, next) {
  try {
    const data = await retService.cohortes(req.empresaId, req.query);
    return ok(res, data);
  } catch (err) { next(err); }
}

module.exports = { resumen, enRiesgo, topClientes, cohortes };
