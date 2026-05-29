const Joi            = require('joi');
const clienteService = require('../services/cliente.service');
const { ok, created, badRequest } = require('../utils/response');

const schemaCrear = Joi.object({
  nombre:           Joi.string().max(120).required().messages({
    'any.required': 'El nombre es requerido'
  }),
  email:            Joi.string().email().required().messages({
    'string.email': 'El email no tiene un formato válido',
    'any.required': 'El email es requerido'
  }),
  telefono:         Joi.string().max(20).optional().allow(null, ''),
  fecha_nacimiento: Joi.string().isoDate().optional().allow(null, '').messages({
    'string.isoDate': 'La fecha de nacimiento debe tener formato YYYY-MM-DD'
  })
});

const schemaActualizar = Joi.object({
  nombre:           Joi.string().max(120).optional(),
  email:            Joi.string().email().optional().messages({
    'string.email': 'El email no tiene un formato válido'
  }),
  telefono:         Joi.string().max(20).optional().allow(null, ''),
  fecha_nacimiento: Joi.string().isoDate().optional().allow(null, '').messages({
    'string.isoDate': 'La fecha de nacimiento debe tener formato YYYY-MM-DD'
  })
});

async function listar(req, res, next) {
  try {
    const data = await clienteService.listar(req.empresaId, req.query.q);
    return ok(res, data, 'Clientes obtenidos');
  } catch (err) {
    next(err);
  }
}

async function obtener(req, res, next) {
  try {
    const data = await clienteService.obtener(req.params.id, req.empresaId);
    return ok(res, data);
  } catch (err) {
    next(err);
  }
}

async function crear(req, res, next) {
  try {
    const { error, value } = schemaCrear.validate(req.body, { abortEarly: false });
    if (error) return badRequest(res, 'Datos inválidos', error.details.map(d => d.message));
    const data = await clienteService.crear(req.empresaId, value);
    return created(res, data, 'Cliente creado');
  } catch (err) {
    next(err);
  }
}

async function actualizar(req, res, next) {
  try {
    const { error, value } = schemaActualizar.validate(req.body, { abortEarly: false });
    if (error) return badRequest(res, 'Datos inválidos', error.details.map(d => d.message));
    const data = await clienteService.actualizar(req.params.id, req.empresaId, value);
    return ok(res, data, 'Cliente actualizado');
  } catch (err) {
    next(err);
  }
}

async function eliminar(req, res, next) {
  try {
    await clienteService.eliminar(req.params.id, req.empresaId);
    return ok(res, {}, 'Cliente eliminado');
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
