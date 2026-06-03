const Joi              = require('joi');
const categoriaService = require('../services/categoria.service');
const { ok, created, badRequest } = require('../utils/response');

const schemaBody = Joi.object({
  nombre: Joi.string().max(80).required()
});

async function listar(req, res, next) {
  try {
    const data = await categoriaService.listar(req.empresaId);
    return ok(res, data);
  } catch (err) { next(err); }
}

async function crear(req, res, next) {
  try {
    const { error, value } = schemaBody.validate(req.body, { abortEarly: false });
    if (error) return badRequest(res, 'Datos inválidos', error.details.map(d => d.message));

    const data = await categoriaService.crear(req.empresaId, value);
    return created(res, data, 'Categoria creada');
  } catch (err) { next(err); }
}

async function editar(req, res, next) {
  try {
    const { error, value } = schemaBody.validate(req.body, { abortEarly: false });
    if (error) return badRequest(res, 'Datos inválidos', error.details.map(d => d.message));

    const data = await categoriaService.editar(req.params.id, req.empresaId, value);
    return ok(res, data, 'Categoria actualizada');
  } catch (err) { next(err); }
}

async function eliminar(req, res, next) {
  try {
    await categoriaService.eliminar(req.params.id, req.empresaId);
    return ok(res, {}, 'Categoria eliminada');
  } catch (err) { next(err); }
}

module.exports = { listar, crear, editar, eliminar };
