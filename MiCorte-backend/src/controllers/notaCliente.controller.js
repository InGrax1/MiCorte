const Joi              = require('joi');
const notaService      = require('../services/notaCliente.service');
const { ok, created, badRequest } = require('../utils/response');

const schemaCreate = Joi.object({
  cliente_id: Joi.string().uuid().required(),
  cita_id:    Joi.string().uuid().optional(),
  nota:       Joi.string().min(1).max(2000).required()
});

async function listar(req, res, next) {
  try {
    const data = await notaService.listar(req.params.cliente_id, req.empresaId);
    return ok(res, data);
  } catch (err) { next(err); }
}

async function crear(req, res, next) {
  try {
    const { error, value } = schemaCreate.validate(req.body, { abortEarly: false });
    if (error) return badRequest(res, 'Datos inválidos', error.details.map(d => d.message));

    const data = await notaService.crear(req.empresaId, {
      ...value,
      usuario_id: req.user.id   // para resolver el perfil de estilista
    });
    return created(res, data, 'Nota agregada');
  } catch (err) { next(err); }
}

module.exports = { listar, crear };
