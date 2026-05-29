const Joi             = require('joi');
const sucursalService = require('../services/sucursal.service');
const { ok, created, badRequest } = require('../utils/response');

const schemaBase = Joi.object({
  nombre:        Joi.string().max(120).required().messages({
    'any.required':         'El nombre es requerido',
    'string.max':           'El nombre no puede superar 120 caracteres'
  }),
  direccion:     Joi.string().max(300).required().messages({
    'any.required':         'La dirección es requerida',
    'string.max':           'La dirección no puede superar 300 caracteres'
  }),
  ciudad:        Joi.string().max(80).optional().allow(null, ''),
  telefono:      Joi.string().max(20).optional().allow(null, ''),
  hora_apertura: Joi.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).required().messages({
    'any.required':         'La hora de apertura es requerida',
    'string.pattern.base':  'Formato de hora inválido (HH:MM o HH:MM:SS)'
  }),
  hora_cierre:   Joi.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).required().messages({
    'any.required':         'La hora de cierre es requerida',
    'string.pattern.base':  'Formato de hora inválido (HH:MM o HH:MM:SS)'
  }),
  latitud:       Joi.number().optional().allow(null),
  longitud:      Joi.number().optional().allow(null)
});

async function listar(req, res, next) {
  try {
    const data = await sucursalService.listar(req.empresaId);
    return ok(res, data, 'Sucursales obtenidas');
  } catch (err) {
    next(err);
  }
}

async function obtener(req, res, next) {
  try {
    const data = await sucursalService.obtener(req.params.id, req.empresaId);
    return ok(res, data);
  } catch (err) {
    next(err);
  }
}

async function crear(req, res, next) {
  try {
    const { error, value } = schemaBase.validate(req.body, { abortEarly: false });
    if (error) return badRequest(res, 'Datos inválidos', error.details.map(d => d.message));
    const data = await sucursalService.crear(req.empresaId, value);
    return created(res, data, 'Sucursal creada');
  } catch (err) {
    next(err);
  }
}

async function actualizar(req, res, next) {
  try {
    const { error, value } = schemaBase.validate(req.body, { abortEarly: false });
    if (error) return badRequest(res, 'Datos inválidos', error.details.map(d => d.message));
    const data = await sucursalService.actualizar(req.params.id, req.empresaId, value);
    return ok(res, data, 'Sucursal actualizada');
  } catch (err) {
    next(err);
  }
}

async function toggleActivo(req, res, next) {
  try {
    const data = await sucursalService.toggleActivo(req.params.id, req.empresaId);
    return ok(res, data, 'Estado de sucursal actualizado');
  } catch (err) {
    next(err);
  }
}

async function eliminar(req, res, next) {
  try {
    await sucursalService.eliminar(req.params.id, req.empresaId);
    return ok(res, {}, 'Sucursal eliminada');
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, obtener, crear, actualizar, toggleActivo, eliminar };
