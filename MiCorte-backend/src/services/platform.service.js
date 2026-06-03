const platformRepo = require('../repositories/platform.repository');
const { AppError }  = require('../utils/errors');

const PLANES_VALIDOS = ['basico', 'pro', 'enterprise'];

async function metricas() {
  return platformRepo.getMetricas();
}

async function listarTenants() {
  return platformRepo.getEmpresas();
}

async function obtenerTenant(id) {
  const empresa = await platformRepo.getEmpresaById(id);
  if (!empresa) throw new AppError('Empresa no encontrada', 404);
  return empresa;
}

async function toggleTenant(id) {
  const empresa = await platformRepo.getEmpresaById(id);
  if (!empresa) throw new AppError('Empresa no encontrada', 404);
  return platformRepo.toggleActivo(id);
}

async function cambiarPlan(id, plan) {
  if (!PLANES_VALIDOS.includes(plan)) {
    throw new AppError(`Plan inválido. Opciones: ${PLANES_VALIDOS.join(', ')}`, 400);
  }
  const empresa = await platformRepo.getEmpresaById(id);
  if (!empresa) throw new AppError('Empresa no encontrada', 404);
  return platformRepo.cambiarPlan(id, plan);
}

module.exports = { metricas, listarTenants, obtenerTenant, toggleTenant, cambiarPlan };
