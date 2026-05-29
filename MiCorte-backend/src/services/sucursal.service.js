const sucursalRepo = require('../repositories/sucursal.repository');
const { AppError } = require('../utils/errors');

async function listar(empresa_id) {
  return sucursalRepo.findAll(empresa_id);
}

async function obtener(id, empresa_id) {
  const sucursal = await sucursalRepo.findById(id, empresa_id);
  if (!sucursal) throw new AppError('Sucursal no encontrada', 404);
  return sucursal;
}

async function crear(empresa_id, data) {
  return sucursalRepo.create({ ...data, empresa_id });
}

async function actualizar(id, empresa_id, data) {
  const existe = await sucursalRepo.findById(id, empresa_id);
  if (!existe) throw new AppError('Sucursal no encontrada', 404);
  return sucursalRepo.update(id, empresa_id, data);
}

async function toggleActivo(id, empresa_id) {
  const existe = await sucursalRepo.findById(id, empresa_id);
  if (!existe) throw new AppError('Sucursal no encontrada', 404);
  return sucursalRepo.toggleActivo(id, empresa_id);
}

async function eliminar(id, empresa_id) {
  const existe = await sucursalRepo.findById(id, empresa_id);
  if (!existe) throw new AppError('Sucursal no encontrada', 404);
  await sucursalRepo.softDelete(id, empresa_id);
}

module.exports = { listar, obtener, crear, actualizar, toggleActivo, eliminar };
