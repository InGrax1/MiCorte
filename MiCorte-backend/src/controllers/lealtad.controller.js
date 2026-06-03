const Joi            = require('joi');
const lealtadService = require('../services/lealtad.service');
const { ok, badRequest } = require('../utils/response');

const schemaAjuste = Joi.object({
  cliente_id:  Joi.string().uuid().required(),
  puntos:      Joi.number().integer().not(0).required(),  // positivo=acumular, negativo=canjear
  descripcion: Joi.string().max(255).optional()
});

async function obtenerPorCliente(req, res, next) {
  try {
    const data = await lealtadService.obtenerPorCliente(req.params.cliente_id, req.empresaId);
    return ok(res, data);
  } catch (err) { next(err); }
}

async function ajusteManual(req, res, next) {
  try {
    const { error, value } = schemaAjuste.validate(req.body, { abortEarly: false });
    if (error) return badRequest(res, 'Datos inválidos', error.details.map(d => d.message));

    const data = await lealtadService.ajusteManual(req.empresaId, value);
    return ok(res, data, 'Puntos ajustados correctamente');
  } catch (err) { next(err); }
}

module.exports = { obtenerPorCliente, ajusteManual };
