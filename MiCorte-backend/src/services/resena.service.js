const resenaRepo   = require('../repositories/resena.repository');
const citaRepo     = require('../repositories/cita.repository');
const { sendResena } = require('../utils/email');
const { AppError } = require('../utils/errors');

async function listar(empresa_id, filtros) {
  return resenaRepo.findAll(empresa_id, filtros);
}

async function obtenerPorToken(token) {
  const resena = await resenaRepo.findByToken(token);
  if (!resena) throw new AppError('Enlace de reseña no válido', 404);
  if (new Date(resena.token_exp) < new Date()) {
    throw new AppError('Este enlace de reseña ha expirado', 410);
  }
  return resena;
}

async function responder(token, rating, comentario) {
  const resena = await resenaRepo.findByToken(token);
  if (!resena) throw new AppError('Enlace de reseña no válido', 404);

  if (new Date(resena.token_exp) < new Date()) {
    throw new AppError('Este enlace de reseña ha expirado', 410);
  }
  if (resena.respondido_at) {
    throw new AppError('Esta reseña ya fue respondida', 409);
  }

  await resenaRepo.submitResena(token, rating, comentario);
  return resenaRepo.findByToken(token);
}

async function generarParaCita(cita) {
  // Idempotente: no genera duplicados si ya existe
  const existe = await resenaRepo.findByCitaId(cita.id, cita.empresa_id);
  if (existe) return;

  const resena = await resenaRepo.create({
    empresa_id:   cita.empresa_id,
    cita_id:      cita.id,
    cliente_id:   cita.cliente_id,
    estilista_id: cita.estilista_id
  });

  // Marcar en la cita que se envió la solicitud de reseña
  await citaRepo.marcarResenaEnviada(cita.id);

  // Enviar email — puede fallar sin revertir la reseña creada
  await sendResena({
    ...resena,
    sucursal_nombre: cita.sucursal_nombre
  });
}

async function toggleVisibilidad(id, empresa_id) {
  const existe = await resenaRepo.findAll(empresa_id, {});
  const resena = existe.find(r => r.id === id);
  if (!resena) throw new AppError('Reseña no encontrada', 404);
  return resenaRepo.toggleVisibilidad(id, empresa_id);
}

module.exports = { listar, obtenerPorToken, responder, generarParaCita, toggleVisibilidad };
