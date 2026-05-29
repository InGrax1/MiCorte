const pagoService = require('../services/pago.service');
const { ok, badRequest } = require('../utils/response');

async function obtenerPorCita(req, res, next) {
  try {
    const data = await pagoService.obtenerPorCita(req.params.cita_id, req.empresaId);
    return ok(res, data);
  } catch (err) {
    next(err);
  }
}

async function confirmarEfectivo(req, res, next) {
  try {
    const data = await pagoService.confirmarEfectivo(req.params.cita_id, req.empresaId);
    return ok(res, data, 'Pago confirmado. La cita fue marcada como confirmada');
  } catch (err) {
    next(err);
  }
}

async function reembolsar(req, res, next) {
  try {
    const data = await pagoService.reembolsar(req.params.cita_id, req.empresaId);
    return ok(res, data, 'Reembolso registrado');
  } catch (err) {
    next(err);
  }
}

async function iniciarMercadoPago(req, res, next) {
  try {
    const data = await pagoService.iniciarMercadoPago(req.params.cita_id, req.empresaId);
    return ok(res, data, 'Preferencia de pago creada');
  } catch (err) {
    next(err);
  }
}

async function webhookMercadoPago(req, res, next) {
  try {
    const result = await pagoService.procesarWebhookMP(req.headers, req.body);
    return ok(res, result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  obtenerPorCita, confirmarEfectivo, reembolsar,
  iniciarMercadoPago, webhookMercadoPago
};
