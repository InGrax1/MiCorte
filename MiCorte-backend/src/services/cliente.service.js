const clienteRepo = require('../repositories/cliente.repository');
const { AppError } = require('../utils/errors');

async function listar(empresa_id, q) {
  return clienteRepo.findAll(empresa_id, q || null);
}

async function obtener(id, empresa_id) {
  const cliente = await clienteRepo.findById(id, empresa_id);
  if (!cliente) throw new AppError('Cliente no encontrado', 404);
  return cliente;
}

async function crear(empresa_id, data) {
  const duplicado = await clienteRepo.findByEmail(data.email, empresa_id);
  if (duplicado) throw new AppError('Ya existe un cliente con ese email en esta empresa', 409);
  return clienteRepo.create({ ...data, empresa_id });
}

async function actualizar(id, empresa_id, data) {
  const existe = await clienteRepo.findById(id, empresa_id);
  if (!existe) throw new AppError('Cliente no encontrado', 404);

  if (data.email && data.email !== existe.email) {
    const duplicado = await clienteRepo.findByEmail(data.email, empresa_id);
    if (duplicado) throw new AppError('Ya existe un cliente con ese email en esta empresa', 409);
  }

  return clienteRepo.update(id, empresa_id, {
    nombre:            data.nombre           || existe.nombre,
    email:             data.email            || existe.email,
    telefono:          data.telefono         ?? existe.telefono,
    fecha_nacimiento:  data.fecha_nacimiento ?? existe.fecha_nacimiento
  });
}

async function eliminar(id, empresa_id) {
  const existe = await clienteRepo.findById(id, empresa_id);
  if (!existe) throw new AppError('Cliente no encontrado', 404);
  await clienteRepo.softDelete(id, empresa_id);
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
