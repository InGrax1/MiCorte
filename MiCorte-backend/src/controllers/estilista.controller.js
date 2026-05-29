const Joi              = require('joi');
const estilistaService = require('../services/estilista.service');
const { ok, created, badRequest } = require('../utils/response');

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const schemaCrear = Joi.object({
  nombre:         Joi.string().max(120).required().messages({
    'any.required': 'El nombre es requerido'
  }),
  email:          Joi.string().email().required().messages({
    'string.email': 'El email no tiene un formato válido',
    'any.required': 'El email es requerido'
  }),
  password:       Joi.string().min(6).required().messages({
    'string.min':   'La contraseña debe tener al menos 6 caracteres',
    'any.required': 'La contraseña es requerida'
  }),
  sucursal_id:    Joi.string().pattern(UUID_PATTERN).required().messages({
    'any.required': 'La sucursal es requerida'
  }),
  especialidades: Joi.array().items(Joi.string()).optional(),
  bio:            Joi.string().optional().allow(null, ''),
  foto_url:       Joi.string().uri().optional().allow(null, '')
});

const schemaActualizar = Joi.object({
  nombre:         Joi.string().max(120).optional(),
  sucursal_id:    Joi.string().pattern(UUID_PATTERN).optional(),
  especialidades: Joi.array().items(Joi.string()).optional(),
  bio:            Joi.string().optional().allow(null, ''),
  foto_url:       Joi.string().uri().optional().allow(null, '')
});

const schemaHorarios = Joi.array().items(
  Joi.object({
    dia_semana:  Joi.number().integer().min(0).max(6).required(),
    hora_inicio: Joi.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).required(),
    hora_fin:    Joi.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).required()
  })
).required();

async function listar(req, res, next) {
  try {
    const data = await estilistaService.listar(req.empresaId, req.query.sucursal_id);
    return ok(res, data, 'Estilistas obtenidos');
  } catch (err) {
    next(err);
  }
}

async function obtener(req, res, next) {
  try {
    const data = await estilistaService.obtener(req.params.id, req.empresaId);
    return ok(res, data);
  } catch (err) {
    next(err);
  }
}

async function crear(req, res, next) {
  try {
    const { error, value } = schemaCrear.validate(req.body, { abortEarly: false });
    if (error) return badRequest(res, 'Datos inválidos', error.details.map(d => d.message));
    const data = await estilistaService.crear(req.empresaId, value);
    return created(res, data, 'Estilista creado');
  } catch (err) {
    next(err);
  }
}

async function actualizar(req, res, next) {
  try {
    const { error, value } = schemaActualizar.validate(req.body, { abortEarly: false });
    if (error) return badRequest(res, 'Datos inválidos', error.details.map(d => d.message));
    const data = await estilistaService.actualizar(req.params.id, req.empresaId, value);
    return ok(res, data, 'Estilista actualizado');
  } catch (err) {
    next(err);
  }
}

async function obtenerHorarios(req, res, next) {
  try {
    const data = await estilistaService.obtenerHorarios(req.params.id, req.empresaId);
    return ok(res, data, 'Horarios obtenidos');
  } catch (err) {
    next(err);
  }
}

async function reemplazarHorarios(req, res, next) {
  try {
    const { error, value } = schemaHorarios.validate(req.body, { abortEarly: false });
    if (error) return badRequest(res, 'Datos de horarios inválidos', error.details.map(d => d.message));
    const data = await estilistaService.reemplazarHorarios(req.params.id, req.empresaId, value);
    return ok(res, data, 'Horarios actualizados');
  } catch (err) {
    next(err);
  }
}

async function eliminar(req, res, next) {
  try {
    await estilistaService.eliminar(req.params.id, req.empresaId);
    return ok(res, {}, 'Estilista eliminado');
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, obtener, crear, actualizar, obtenerHorarios, reemplazarHorarios, eliminar };
