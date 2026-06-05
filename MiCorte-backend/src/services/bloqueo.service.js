const bloqueoRepo  = require('../repositories/bloqueo.repository');
const sucursalRepo = require('../repositories/sucursal.repository');
const { AppError } = require('../utils/errors');

async function listar(empresa_id, query) {
  return bloqueoRepo.findAll(empresa_id, {
    sucursal_id:  query.sucursal_id  || null,
    estilista_id: query.estilista_id || null,
    desde:        query.desde        || null,
    hasta:        query.hasta        || null
  });
}

async function crear(empresa_id, data) {
  // Validar que la sucursal pertenece al tenant
  const sucursal = await sucursalRepo.findById(data.sucursal_id, empresa_id);
  if (!sucursal) throw new AppError('Sucursal no encontrada', 404);

  // fecha_fin debe ser posterior a fecha_inicio
  if (new Date(data.fecha_fin) <= new Date(data.fecha_inicio)) {
    throw new AppError('La fecha de fin debe ser posterior a la fecha de inicio', 400);
  }

  return bloqueoRepo.create({ ...data, empresa_id });
}

async function eliminar(id, empresa_id) {
  const deleted = await bloqueoRepo.softDelete(id, empresa_id);
  if (!deleted) throw new AppError('Bloqueo no encontrado', 404);
}

module.exports = { listar, crear, eliminar };
