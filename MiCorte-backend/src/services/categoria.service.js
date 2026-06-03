const categoriaRepo = require('../repositories/categoria.repository');
const { AppError }  = require('../utils/errors');

async function listar(empresa_id) {
  return categoriaRepo.findAll(empresa_id);
}

async function crear(empresa_id, data) {
  const existe = await categoriaRepo.findByNombre(data.nombre, empresa_id);
  if (existe) throw new AppError('Ya existe una categoria con ese nombre', 409);

  return categoriaRepo.create({ empresa_id, ...data });
}

async function editar(id, empresa_id, data) {
  const categoria = await categoriaRepo.findById(id, empresa_id);
  if (!categoria) throw new AppError('Categoria no encontrada', 404);

  const duplicado = await categoriaRepo.findByNombre(data.nombre, empresa_id);
  if (duplicado && duplicado.id !== id) {
    throw new AppError('Ya existe otra categoria con ese nombre', 409);
  }

  return categoriaRepo.update(id, empresa_id, data);
}

async function eliminar(id, empresa_id) {
  const categoria = await categoriaRepo.findById(id, empresa_id);
  if (!categoria) throw new AppError('Categoria no encontrada', 404);
  await categoriaRepo.softDelete(id, empresa_id);
}

module.exports = { listar, crear, editar, eliminar };
