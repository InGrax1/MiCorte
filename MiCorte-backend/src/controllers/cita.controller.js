const Joi         = require('joi');
const citaService = require('../services/cita.service');
const { ok, created, badRequest } = require('../utils/response');

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const schemaCrear = Joi.object({
  cliente_id:    Joi.string().pattern(UUID_PATTERN).required().messages({
    'any.required': 'El cliente es requerido'
  }),
  estilista_id:  Joi.string().pattern(UUID_PATTERN).required().messages({
    'any.required': 'El estilista es requerido'
  }),
  servicio_id:   Joi.string().pattern(UUID_PATTERN).required().messages({
    'any.required': 'El servicio es requerido'
  }),
  sucursal_id:   Joi.string().pattern(UUID_PATTERN).required().messages({
    'any.required': 'La sucursal es requerida'
  }),
  fecha_hora:    Joi.string().isoDate().required().messages({
    'any.required': 'La fecha y hora son requeridas',
    'string.isoDate': 'La fecha debe tener formato ISO (YYYY-MM-DDTHH:MM:SS)'
  }),
  metodo_pago:   Joi.string().valid('online', 'efectivo').required().messages({
    'any.required': 'El método de pago es requerido',
    'any.only':     'El método de pago debe ser "online" o "efectivo"'
  }),
  notas_cliente:    Joi.string().optional().allow(null, ''),
  puntos_a_canjear: Joi.number().integer().min(0).optional()
});

const schemaEstado = Joi.object({
  estado: Joi.string()
    .valid('confirmada', 'en_proceso', 'completada', 'cancelada', 'no_show')
    .required()
    .messages({
      'any.required': 'El estado es requerido',
      'any.only':     'Estado no válido'
    })
});

const schemaDisponibilidad = Joi.object({
  estilista_id: Joi.string().pattern(UUID_PATTERN).required().messages({
    'any.required': 'El estilista_id es requerido'
  }),
  servicio_id:  Joi.string().pattern(UUID_PATTERN).required().messages({
    'any.required': 'El servicio_id es requerido'
  }),
  fecha:        Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({
    'any.required':        'La fecha es requerida',
    'string.pattern.base': 'La fecha debe tener formato YYYY-MM-DD'
  })
});

async function listar(req, res, next) {
  try {
    const filtros = {
      estilista_id: req.query.estilista_id || null,
      sucursal_id:  req.query.sucursal_id  || null,
      fecha_inicio: req.query.fecha_inicio || null,
      fecha_fin:    req.query.fecha_fin    || null,
      estado:       req.query.estado       || null
    };
    const data = await citaService.listar(req.empresaId, filtros, req.user);
    return ok(res, data, 'Citas obtenidas');
  } catch (err) {
    next(err);
  }
}

async function obtener(req, res, next) {
  try {
    const data = await citaService.obtener(req.params.id, req.empresaId);
    return ok(res, data);
  } catch (err) {
    next(err);
  }
}

async function crear(req, res, next) {
  try {
    const { error, value } = schemaCrear.validate(req.body, { abortEarly: false });
    if (error) return badRequest(res, 'Datos inválidos', error.details.map(d => d.message));
    const data = await citaService.crear(req.empresaId, value);
    return created(res, data, 'Cita agendada');
  } catch (err) {
    next(err);
  }
}

async function cambiarEstado(req, res, next) {
  try {
    const { error, value } = schemaEstado.validate(req.body, { abortEarly: false });
    if (error) return badRequest(res, 'Datos inválidos', error.details.map(d => d.message));
    const data = await citaService.cambiarEstado(
      req.params.id, req.empresaId, value.estado, req.user.roles
    );
    return ok(res, data, 'Estado actualizado');
  } catch (err) {
    next(err);
  }
}

async function eliminar(req, res, next) {
  try {
    await citaService.eliminar(req.params.id, req.empresaId);
    return ok(res, {}, 'Cita eliminada');
  } catch (err) {
    next(err);
  }
}

async function disponibilidad(req, res, next) {
  try {
    const { error, value } = schemaDisponibilidad.validate(req.query, { abortEarly: false });
    if (error) return badRequest(res, 'Parámetros inválidos', error.details.map(d => d.message));
    const slots = await citaService.disponibilidad(
      req.empresaId, value.estilista_id, value.servicio_id, value.fecha
    );
    return ok(res, { fecha: value.fecha, slots_disponibles: slots });
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, obtener, crear, cambiarEstado, eliminar, disponibilidad };
