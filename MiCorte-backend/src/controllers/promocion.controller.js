const Joi              = require('joi');
const promocionService = require('../services/promocion.service');
const { ok, created, badRequest } = require('../utils/response');

const schemaBase = {
  nombre:          Joi.string().max(120).required(),
  tipo:            Joi.string().valid('cumpleanos','fecha_especial','aniversario','manual').required(),
  descuento_tipo:  Joi.string().valid('porcentaje','monto_fijo').required(),
  descuento_valor: Joi.number().positive().required(),
  fecha_inicio:    Joi.string().isoDate().optional(),
  fecha_fin:       Joi.string().isoDate().optional(),
  servicios_ids:   Joi.array().items(Joi.string().uuid()).optional()
};

const schemaCreate = Joi.object(schemaBase);
const schemaUpdate = Joi.object({
  ...schemaBase,
  nombre:          Joi.string().max(120).optional(),
  tipo:            Joi.string().valid('cumpleanos','fecha_especial','aniversario','manual').optional(),
  descuento_tipo:  Joi.string().valid('porcentaje','monto_fijo').optional(),
  descuento_valor: Joi.number().positive().optional(),
  activo:          Joi.boolean().optional()
});

async function listar(req, res, next) {
  try {
    const data = await promocionService.listar(req.empresaId, req.query);
    return ok(res, data);
  } catch (err) { next(err); }
}

async function obtener(req, res, next) {
  try {
    const data = await promocionService.obtener(req.params.id, req.empresaId);
    return ok(res, data);
  } catch (err) { next(err); }
}

async function crear(req, res, next) {
  try {
    const { error, value } = schemaCreate.validate(req.body, { abortEarly: false });
    if (error) return badRequest(res, 'Datos inválidos', error.details.map(d => d.message));
    const data = await promocionService.crear(req.empresaId, value);
    return created(res, data, 'Promoción creada');
  } catch (err) { next(err); }
}

async function actualizar(req, res, next) {
  try {
    const { error, value } = schemaUpdate.validate(req.body, { abortEarly: false });
    if (error) return badRequest(res, 'Datos inválidos', error.details.map(d => d.message));
    const data = await promocionService.actualizar(req.params.id, req.empresaId, value);
    return ok(res, data, 'Promoción actualizada');
  } catch (err) { next(err); }
}

async function eliminar(req, res, next) {
  try {
    await promocionService.eliminar(req.params.id, req.empresaId);
    return ok(res, null, 'Promoción eliminada');
  } catch (err) { next(err); }
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
