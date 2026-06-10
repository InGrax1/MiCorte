const Joi           = require('joi');
const portalService = require('../services/portal.service');
const { ok, created, badRequest } = require('../utils/response');

const schemaSolicitar = Joi.object({
  email:       Joi.string().email().required(),
  sucursal_id: Joi.string().uuid().required(),
});

const schemaVerificar = Joi.object({
  email:       Joi.string().email().required(),
  sucursal_id: Joi.string().uuid().required(),
  codigo:      Joi.string().length(6).pattern(/^\d{6}$/).required().messages({
    'string.length':  'El codigo debe tener 6 digitos',
    'string.pattern': 'El codigo debe ser numerico',
  }),
});

async function solicitarAcceso(req, res, next) {
  try {
    const { error, value } = schemaSolicitar.validate(req.body, { abortEarly: false });
    if (error) return badRequest(res, 'Datos invalidos', error.details.map(d => d.message));
    const data = await portalService.solicitarAcceso(value.email, value.sucursal_id);
    return ok(res, data);
  } catch (err) { next(err); }
}

async function verificarOtp(req, res, next) {
  try {
    const { error, value } = schemaVerificar.validate(req.body, { abortEarly: false });
    if (error) return badRequest(res, 'Datos invalidos', error.details.map(d => d.message));
    const data = await portalService.verificarOtp(value.email, value.sucursal_id, value.codigo);
    return ok(res, data, 'Bienvenido');
  } catch (err) { next(err); }
}

async function me(req, res, next) {
  try {
    const data = await portalService.getMe(req.clienteId, req.empresaId);
    return ok(res, data);
  } catch (err) { next(err); }
}

async function misCitas(req, res, next) {
  try {
    const data = await portalService.getMisCitas(req.clienteId, req.empresaId);
    return ok(res, data);
  } catch (err) { next(err); }
}

async function misOrdenes(req, res, next) {
  try {
    const data = await portalService.getMisOrdenes(req.clienteId, req.empresaId);
    return ok(res, data);
  } catch (err) { next(err); }
}

async function misMovimientos(req, res, next) {
  try {
    const data = await portalService.getMisMovimientos(req.clienteId, req.empresaId);
    return ok(res, data);
  } catch (err) { next(err); }
}

module.exports = { solicitarAcceso, verificarOtp, me, misCitas, misOrdenes, misMovimientos };
