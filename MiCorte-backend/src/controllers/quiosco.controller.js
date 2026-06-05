const Joi            = require('joi');
const quioscoService = require('../services/quiosco.service');
const { ok, badRequest } = require('../utils/response');

async function citasHoy(req, res, next) {
  try {
    const data = await quioscoService.citasHoy(req.params.sucursal_id);
    return ok(res, data);
  } catch (err) { next(err); }
}

async function buscar(req, res, next) {
  try {
    const data = await quioscoService.buscar(req.params.sucursal_id, req.query.nombre);
    return ok(res, data);
  } catch (err) { next(err); }
}

async function checkin(req, res, next) {
  try {
    const { error, value } = Joi.object({
      cita_id: Joi.string().uuid().required()
    }).validate(req.body, { abortEarly: false });

    if (error) return badRequest(res, 'Datos inválidos', error.details.map(d => d.message));

    const data = await quioscoService.checkin(req.params.sucursal_id, value.cita_id);
    return ok(res, data, 'Check-in registrado. El estilista ha sido notificado.');
  } catch (err) { next(err); }
}

module.exports = { citasHoy, buscar, checkin };
