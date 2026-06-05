const notaRepo     = require('../repositories/notaCliente.repository');
const clienteRepo  = require('../repositories/cliente.repository');
const estilistaRepo = require('../repositories/estilista.repository');
const { AppError } = require('../utils/errors');

async function listar(cliente_id, empresa_id) {
  // Validar que el cliente pertenece al tenant
  const cliente = await clienteRepo.findById(cliente_id, empresa_id);
  if (!cliente) throw new AppError('Cliente no encontrado', 404);
  return notaRepo.findByCliente(cliente_id, empresa_id);
}

async function crear(empresa_id, data) {
  // Validar cliente
  const cliente = await clienteRepo.findById(data.cliente_id, empresa_id);
  if (!cliente) throw new AppError('Cliente no encontrado', 404);

  // Obtener estilista_id desde el usuario autenticado si el rol es estilista,
  // o desde el body si es admin
  const estilista = await estilistaRepo.findByUsuarioId(data.usuario_id, empresa_id);
  if (!estilista) throw new AppError('Perfil de estilista no encontrado', 404);

  return notaRepo.create({
    empresa_id,
    cliente_id:   data.cliente_id,
    estilista_id: estilista.id,
    cita_id:      data.cita_id || null,
    nota:         data.nota
  });
}

module.exports = { listar, crear };
