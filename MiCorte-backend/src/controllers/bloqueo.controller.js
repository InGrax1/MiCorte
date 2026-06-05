const Joi            = require('joi');
const bloqueoService = require('../services/bloqueo.service');
const { ok, created, badRequest } = require('../utils/response');

const schemaCreate = Joi.object({
  sucursal_id:  Joi.string().uuid().required(),
  estilista_id: Joi.string().uuid().optional(),         // null = bloquea toda la sucursal
  fecha_inicio: Joi.string().isoDate().required(),
  fecha_fin:    Joi.string().isoDate().required(),
  motivo:       Joi.string().max(255).optional()
});

async function listar(req, res, next) {
  try {
    const data = await bloqueoService.listar(req.empresaId, req.query);
    return ok(res, data);
  } catch (err) { next(err); }
}

async function crear(req, res, next) {
  try {
    const { error, value } = schemaCreate.validate(req.body, { abortEarly: false });
    if (error) return badRequest(res, 'Datos inválidos', error.details.map(d => d.message));

    const data = await bloqueoService.crear(req.empresaId, value);
    return created(res, data, 'Bloqueo creado');
  } catch (err) { next(err); }
}

async function eliminar(req, res, next) {
  try {
    await bloqueoService.eliminar(req.params.id, req.empresaId);
    return ok(res, null, 'Bloqueo eliminado');
  } catch (err) { next(err); }
}

module.exports = { listar, crear, eliminar };
