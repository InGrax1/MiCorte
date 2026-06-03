const pagoOrdenService = require('../services/pagoOrden.service');
const { ok }           = require('../utils/response');

async function obtenerPorOrden(req, res, next) {
  try {
    const data = await pagoOrdenService.obtenerPorOrden(req.params.orden_id, req.empresaId);
    return ok(res, data);
  } catch (err) { next(err); }
}

async function confirmarEfectivo(req, res, next) {
  try {
    const data = await pagoOrdenService.confirmarEfectivo(req.params.orden_id, req.empresaId);
    return ok(res, data, 'Pago confirmado. La orden fue marcada como procesando');
  } catch (err) { next(err); }
}

module.exports = { obtenerPorOrden, confirmarEfectivo };
