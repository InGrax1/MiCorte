const Joi          = require('joi');
const ordenService = require('../services/orden.service');
const { ok, created, badRequest } = require('../utils/response');

const schemaItem = Joi.object({
  producto_id: Joi.string().uuid().required(),
  cantidad:    Joi.number().integer().positive().required()
});

const schemaCreate = Joi.object({
  sucursal_id:     Joi.string().uuid().required(),
  cliente_id:      Joi.string().uuid().required(),
  tipo_entrega:    Joi.string().valid('envio', 'recoger_tienda').required(),
  metodo_pago:     Joi.string().valid('online', 'efectivo').required(),
  items:           Joi.array().items(schemaItem).min(1).required(),
  costo_envio:      Joi.number().min(0).precision(2).optional(),
  descuento:        Joi.number().min(0).precision(2).optional(),
  puntos_a_canjear: Joi.number().integer().min(0).optional(),
  direccion_envio:  Joi.string().max(500).optional(),
  notas:            Joi.string().max(500).optional()
});

const schemaEstado = Joi.object({
  estado: Joi.string().valid('procesando', 'enviado', 'entregado', 'cancelado').required()
});

async function listar(req, res, next) {
  try {
    const data = await ordenService.listar(req.empresaId, req.query);
    return ok(res, data);
  } catch (err) { next(err); }
}

async function obtener(req, res, next) {
  try {
    const data = await ordenService.obtener(req.params.id, req.empresaId);
    return ok(res, data);
  } catch (err) { next(err); }
}

async function crear(req, res, next) {
  try {
    const { error, value } = schemaCreate.validate(req.body, { abortEarly: false });
    if (error) return badRequest(res, 'Datos inválidos', error.details.map(d => d.message));

    const data = await ordenService.crear(req.empresaId, value);
    return created(res, data, 'Orden creada');
  } catch (err) { next(err); }
}

async function cambiarEstado(req, res, next) {
  try {
    const { error, value } = schemaEstado.validate(req.body, { abortEarly: false });
    if (error) return badRequest(res, 'Datos inválidos', error.details.map(d => d.message));

    const data = await ordenService.cambiarEstado(req.params.id, req.empresaId, value.estado);
    return ok(res, data, `Orden marcada como ${value.estado}`);
  } catch (err) { next(err); }
}

module.exports = { listar, obtener, crear, cambiarEstado };
