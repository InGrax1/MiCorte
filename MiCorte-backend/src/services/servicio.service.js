const servicioRepo = require('../repositories/servicio.repository');
const sucursalRepo = require('../repositories/sucursal.repository');
const { AppError } = require('../utils/errors');

async function listar(empresa_id, sucursal_id) {
  return servicioRepo.findAll(empresa_id, sucursal_id || null);
}

async function obtener(id, empresa_id) {
  const servicio = await servicioRepo.findById(id, empresa_id);
  if (!servicio) throw new AppError('Servicio no encontrado', 404);
  return servicio;
}

async function crear(empresa_id, data) {
  return servicioRepo.create({ ...data, empresa_id });
}

async function actualizar(id, empresa_id, data) {
  const existe = await servicioRepo.findById(id, empresa_id);
  if (!existe) throw new AppError('Servicio no encontrado', 404);
  return servicioRepo.update(id, empresa_id, {
    nombre:      data.nombre      || existe.nombre,
    descripcion: data.descripcion ?? existe.descripcion,
    precio_base: data.precio_base ?? existe.precio_base,
    duracion_min: data.duracion_min ?? existe.duracion_min
  });
}

async function eliminar(id, empresa_id) {
  const existe = await servicioRepo.findById(id, empresa_id);
  if (!existe) throw new AppError('Servicio no encontrado', 404);
  await servicioRepo.softDelete(id, empresa_id);
}

async function asignarSucursal(id, empresa_id, sucursal_id, precio) {
  const servicio = await servicioRepo.findById(id, empresa_id);
  if (!servicio) throw new AppError('Servicio no encontrado', 404);
  const sucursal = await sucursalRepo.findById(sucursal_id, empresa_id);
  if (!sucursal) throw new AppError('Sucursal no encontrada', 404);
  await servicioRepo.assignToSucursal(id, sucursal_id, precio);
  return servicioRepo.findById(id, empresa_id);
}

async function removerSucursal(id, empresa_id, sucursal_id) {
  const servicio = await servicioRepo.findById(id, empresa_id);
  if (!servicio) throw new AppError('Servicio no encontrado', 404);
  await servicioRepo.removeFromSucursal(id, sucursal_id);
}

module.exports = { listar, obtener, crear, actualizar, eliminar, asignarSucursal, removerSucursal };
