const Joi             = require('joi');
const productoService = require('../services/producto.service');
const { ok, created, badRequest } = require('../utils/response');

const schemaCreate = Joi.object({
  categoria_id: Joi.string().uuid().required(),
  nombre:       Joi.string().max(150).required(),
  descripcion:  Joi.string().max(1000).optional(),
  marca:        Joi.string().max(80).optional(),
  precio:       Joi.number().positive().precision(2).required(),
  sku:          Joi.string().max(60).optional()
});

const schemaUpdate = Joi.object({
  categoria_id: Joi.string().uuid().optional(),
  nombre:       Joi.string().max(150).optional(),
  descripcion:  Joi.string().max(1000).allow(null, '').optional(),
  marca:        Joi.string().max(80).allow(null, '').optional(),
  precio:       Joi.number().positive().precision(2).optional(),
  sku:          Joi.string().max(60).allow(null, '').optional(),
  activo:       Joi.boolean().optional()
}).min(1);

async function listar(req, res, next) {
  try {
    const data = await productoService.listar(req.empresaId, req.query);
    return ok(res, data);
  } catch (err) { next(err); }
}

async function obtener(req, res, next) {
  try {
    const data = await productoService.obtener(req.params.id, req.empresaId);
    return ok(res, data);
  } catch (err) { next(err); }
}

async function crear(req, res, next) {
  try {
    const { error, value } = schemaCreate.validate(req.body, { abortEarly: false });
    if (error) return badRequest(res, 'Datos inválidos', error.details.map(d => d.message));

    const data = await productoService.crear(req.empresaId, value);
    return created(res, data, 'Producto creado');
  } catch (err) { next(err); }
}

async function editar(req, res, next) {
  try {
    const { error, value } = schemaUpdate.validate(req.body, { abortEarly: false });
    if (error) return badRequest(res, 'Datos inválidos', error.details.map(d => d.message));

    const data = await productoService.editar(req.params.id, req.empresaId, value);
    return ok(res, data, 'Producto actualizado');
  } catch (err) { next(err); }
}

async function eliminar(req, res, next) {
  try {
    await productoService.eliminar(req.params.id, req.empresaId);
    return ok(res, {}, 'Producto eliminado');
  } catch (err) { next(err); }
}

module.exports = { listar, obtener, crear, editar, eliminar };
