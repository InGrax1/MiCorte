const Joi      = require('joi');
const tiendaSvc = require('../services/tienda.service');
const { ok, created, badRequest } = require('../utils/response');

async function sucursalInfo(req, res, next) {
  try {
    const data = await tiendaSvc.getSucursalInfo(req.params.sucursal_id);
    ok(res, data);
  } catch (err) { next(err); }
}

async function catalogo(req, res, next) {
  try {
    const filtros = {
      categoria_id: req.query.categoria_id || undefined,
      q:            req.query.q            || undefined,
    };
    const data = await tiendaSvc.getCatalogo(req.params.sucursal_id, filtros);
    ok(res, data);
  } catch (err) { next(err); }
}

async function categorias(req, res, next) {
  try {
    const data = await tiendaSvc.getCategorias(req.params.sucursal_id);
    ok(res, data);
  } catch (err) { next(err); }
}

const schemaOrden = Joi.object({
  nombre:          Joi.string().min(2).max(100).required(),
  email:           Joi.string().email().required(),
  telefono:        Joi.string().max(20).optional().allow('', null),
  tipo_entrega:    Joi.string().valid('envio', 'recoger_tienda').required(),
  direccion_envio: Joi.string().max(300).when('tipo_entrega', {
    is: 'envio', then: Joi.required(), otherwise: Joi.optional().allow('', null)
  }),
  notas:           Joi.string().max(500).optional().allow('', null),
  items:           Joi.array().items(
    Joi.object({
      producto_id: Joi.string().uuid().required(),
      cantidad:    Joi.number().integer().min(1).required(),
    })
  ).min(1).required(),
});

async function crearOrden(req, res, next) {
  try {
    const { error, value } = schemaOrden.validate(req.body, { abortEarly: false });
    if (error) return badRequest(res, 'Datos invalidos', error.details.map(d => d.message));

    const data = await tiendaSvc.crearOrden(req.params.sucursal_id, value);
    created(res, data, 'Orden creada correctamente');
  } catch (err) { next(err); }
}

module.exports = { sucursalInfo, catalogo, categorias, crearOrden };
