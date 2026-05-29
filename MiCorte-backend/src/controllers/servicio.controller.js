const Joi             = require('joi');
const servicioService = require('../services/servicio.service');
const { ok, created, badRequest } = require('../utils/response');

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const schemaCrear = Joi.object({
  nombre:      Joi.string().max(120).required().messages({
    'any.required': 'El nombre es requerido'
  }),
  descripcion: Joi.string().optional().allow(null, ''),
  precio_base: Joi.number().positive().required().messages({
    'any.required': 'El precio base es requerido',
    'number.positive': 'El precio base debe ser mayor a 0'
  }),
  duracion_min: Joi.number().integer().min(10).required().messages({
    'any.required': 'La duración es requerida',
    'number.min':   'La duración mínima es 10 minutos'
  })
});

const schemaActualizar = Joi.object({
  nombre:      Joi.string().max(120).optional(),
  descripcion: Joi.string().optional().allow(null, ''),
  precio_base: Joi.number().positive().optional(),
  duracion_min: Joi.number().integer().min(10).optional()
});

const schemaSucursal = Joi.object({
  sucursal_id: Joi.string().pattern(UUID_PATTERN).required().messages({
    'any.required': 'La sucursal es requerida'
  }),
  precio: Joi.number().positive().optional().allow(null)
});

async function listar(req, res, next) {
  try {
    const data = await servicioService.listar(req.empresaId, req.query.sucursal_id);
    return ok(res, data, 'Servicios obtenidos');
  } catch (err) {
    next(err);
  }
}

async function obtener(req, res, next) {
  try {
    const data = await servicioService.obtener(req.params.id, req.empresaId);
    return ok(res, data);
  } catch (err) {
    next(err);
  }
}

async function crear(req, res, next) {
  try {
    const { error, value } = schemaCrear.validate(req.body, { abortEarly: false });
    if (error) return badRequest(res, 'Datos inválidos', error.details.map(d => d.message));
    const data = await servicioService.crear(req.empresaId, value);
    return created(res, data, 'Servicio creado');
  } catch (err) {
    next(err);
  }
}

async function actualizar(req, res, next) {
  try {
    const { error, value } = schemaActualizar.validate(req.body, { abortEarly: false });
    if (error) return badRequest(res, 'Datos inválidos', error.details.map(d => d.message));
    const data = await servicioService.actualizar(req.params.id, req.empresaId, value);
    return ok(res, data, 'Servicio actualizado');
  } catch (err) {
    next(err);
  }
}

async function eliminar(req, res, next) {
  try {
    await servicioService.eliminar(req.params.id, req.empresaId);
    return ok(res, {}, 'Servicio eliminado');
  } catch (err) {
    next(err);
  }
}

async function asignarSucursal(req, res, next) {
  try {
    const { error, value } = schemaSucursal.validate(req.body, { abortEarly: false });
    if (error) return badRequest(res, 'Datos inválidos', error.details.map(d => d.message));
    const data = await servicioService.asignarSucursal(
      req.params.id, req.empresaId, value.sucursal_id, value.precio
    );
    return ok(res, data, 'Servicio asignado a sucursal');
  } catch (err) {
    next(err);
  }
}

async function removerSucursal(req, res, next) {
  try {
    await servicioService.removerSucursal(req.params.id, req.empresaId, req.params.sucursal_id);
    return ok(res, {}, 'Servicio removido de la sucursal');
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, obtener, crear, actualizar, eliminar, asignarSucursal, removerSucursal };
