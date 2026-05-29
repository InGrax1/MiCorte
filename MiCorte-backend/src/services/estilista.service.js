const bcrypt        = require('bcryptjs');
const estilistaRepo = require('../repositories/estilista.repository');
const usuarioRepo   = require('../repositories/usuario.repository');
const sucursalRepo  = require('../repositories/sucursal.repository');
const { AppError }  = require('../utils/errors');

async function listar(empresa_id, sucursal_id) {
  return estilistaRepo.findAll(empresa_id, sucursal_id || null);
}

async function obtener(id, empresa_id) {
  const estilista = await estilistaRepo.findById(id, empresa_id);
  if (!estilista) throw new AppError('Estilista no encontrado', 404);
  return estilista;
}

async function crear(empresa_id, data) {
  // Validate sucursal belongs to tenant
  const sucursal = await sucursalRepo.findById(data.sucursal_id, empresa_id);
  if (!sucursal) throw new AppError('Sucursal no encontrada', 404);

  // Email must be globally unique (usuarios.email has a UNIQUE key)
  const usuarioExiste = await usuarioRepo.findByEmail(data.email);
  if (usuarioExiste) throw new AppError('El email ya está en uso', 409);

  const password_hash = await bcrypt.hash(data.password, 12);

  return estilistaRepo.createWithUsuario({
    empresa_id,
    sucursal_id:    data.sucursal_id,
    nombre:         data.nombre,
    email:          data.email,
    password_hash,
    especialidades: data.especialidades || null,
    bio:            data.bio            || null,
    foto_url:       data.foto_url       || null
  });
}

async function actualizar(id, empresa_id, data) {
  const existe = await estilistaRepo.findById(id, empresa_id);
  if (!existe) throw new AppError('Estilista no encontrado', 404);

  if (data.sucursal_id) {
    const sucursal = await sucursalRepo.findById(data.sucursal_id, empresa_id);
    if (!sucursal) throw new AppError('Sucursal no encontrada', 404);
  }

  return estilistaRepo.update(id, empresa_id, {
    sucursal_id:    data.sucursal_id    || existe.sucursal_id,
    nombre:         data.nombre         || existe.nombre,
    especialidades: data.especialidades ?? existe.especialidades,
    bio:            data.bio            ?? existe.bio,
    foto_url:       data.foto_url       ?? existe.foto_url
  });
}

async function obtenerHorarios(id, empresa_id) {
  const existe = await estilistaRepo.findById(id, empresa_id);
  if (!existe) throw new AppError('Estilista no encontrado', 404);
  return estilistaRepo.findHorarios(id);
}

async function reemplazarHorarios(id, empresa_id, horarios) {
  const existe = await estilistaRepo.findById(id, empresa_id);
  if (!existe) throw new AppError('Estilista no encontrado', 404);
  await estilistaRepo.replaceHorarios(id, horarios);
  return estilistaRepo.findHorarios(id);
}

async function eliminar(id, empresa_id) {
  const existe = await estilistaRepo.findById(id, empresa_id);
  if (!existe) throw new AppError('Estilista no encontrado', 404);
  await estilistaRepo.softDelete(id, empresa_id);
}

module.exports = { listar, obtener, crear, actualizar, obtenerHorarios, reemplazarHorarios, eliminar };
