const Joi               = require('joi');
const inventarioService = require('../services/inventario.service');
const { ok, badRequest } = require('../utils/response');

const schemaAjuste = Joi.object({
  cantidad:    Joi.number().integer().not(0).required(),  // positivo o negativo
  stock_minimo: Joi.number().integer().min(0).optional()
});

async function listar(req, res, next) {
  try {
    const data = await inventarioService.listar(req.empresaId, req.query);
    return ok(res, data);
  } catch (err) { next(err); }
}

async function ajustar(req, res, next) {
  try {
    const { error, value } = schemaAjuste.validate(req.body, { abortEarly: false });
    if (error) return badRequest(res, 'Datos inválidos', error.details.map(d => d.message));

    const { producto_id, sucursal_id } = req.params;
    const data = await inventarioService.ajustar(producto_id, sucursal_id, req.empresaId, value);
    return ok(res, data, 'Stock ajustado');
  } catch (err) { next(err); }
}

module.exports = { listar, ajustar };
