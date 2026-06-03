const Joi              = require('joi');
const platformService  = require('../services/platform.service');
const { ok, badRequest } = require('../utils/response');

async function metricas(req, res, next) {
  try {
    const data = await platformService.metricas();
    return ok(res, data);
  } catch (err) { next(err); }
}

async function listarTenants(req, res, next) {
  try {
    const data = await platformService.listarTenants();
    return ok(res, data);
  } catch (err) { next(err); }
}

async function obtenerTenant(req, res, next) {
  try {
    const data = await platformService.obtenerTenant(req.params.id);
    return ok(res, data);
  } catch (err) { next(err); }
}

async function toggleTenant(req, res, next) {
  try {
    const data = await platformService.toggleTenant(req.params.id);
    const estado = data.activo ? 'activada' : 'suspendida';
    return ok(res, data, `Empresa ${estado}`);
  } catch (err) { next(err); }
}

async function cambiarPlan(req, res, next) {
  try {
    const { error, value } = Joi.object({
      plan: Joi.string().valid('basico', 'pro', 'enterprise').required()
    }).validate(req.body, { abortEarly: false });

    if (error) return badRequest(res, 'Plan inválido', error.details.map(d => d.message));

    const data = await platformService.cambiarPlan(req.params.id, value.plan);
    return ok(res, data, `Plan actualizado a ${value.plan}`);
  } catch (err) { next(err); }
}

module.exports = { metricas, listarTenants, obtenerTenant, toggleTenant, cambiarPlan };
