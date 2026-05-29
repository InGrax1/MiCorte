const Joi           = require('joi');
const resenaService = require('../services/resena.service');
const { ok, badRequest } = require('../utils/response');

const schemaResponder = Joi.object({
  rating:     Joi.number().integer().min(1).max(5).required().messages({
    'any.required': 'La calificación es requerida',
    'number.min':   'La calificación mínima es 1',
    'number.max':   'La calificación máxima es 5'
  }),
  comentario: Joi.string().max(1000).optional().allow(null, '')
});

async function listar(req, res, next) {
  try {
    const filtros = {
      estilista_id:    req.query.estilista_id    || null,
      visible:         req.query.visible !== undefined ? req.query.visible === 'true' : null,
      solo_respondidas: req.query.solo_respondidas === 'true'
    };
    const data = await resenaService.listar(req.empresaId, filtros);
    return ok(res, data, 'Reseñas obtenidas');
  } catch (err) {
    next(err);
  }
}

async function obtenerPorToken(req, res, next) {
  try {
    const data = await resenaService.obtenerPorToken(req.params.token);
    return ok(res, data);
  } catch (err) {
    next(err);
  }
}

async function responder(req, res, next) {
  try {
    const { error, value } = schemaResponder.validate(req.body, { abortEarly: false });
    if (error) return badRequest(res, 'Datos inválidos', error.details.map(d => d.message));
    const data = await resenaService.responder(req.params.token, value.rating, value.comentario);
    return ok(res, data, 'Reseña enviada. Gracias por tu opinion');
  } catch (err) {
    next(err);
  }
}

async function toggleVisibilidad(req, res, next) {
  try {
    const data = await resenaService.toggleVisibilidad(req.params.id, req.empresaId);
    return ok(res, data, 'Visibilidad actualizada');
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, obtenerPorToken, responder, toggleVisibilidad };
