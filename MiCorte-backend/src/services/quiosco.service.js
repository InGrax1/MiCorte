const quioscoRepo = require('../repositories/quiosco.repository');
const { AppError } = require('../utils/errors');

async function citasHoy(sucursal_id) {
  const citas = await quioscoRepo.getCitasHoy(sucursal_id);
  if (citas.length === 0) {
    // Puede ser que la sucursal no exista o no tenga citas — devolvemos vacío
    return { sucursal_nombre: null, citas: [] };
  }
  return {
    sucursal_nombre: citas[0].sucursal_nombre,
    citas: citas.map(c => ({
      id:                c.id,
      fecha_hora:        c.fecha_hora,
      estado:            c.estado,
      checkin_at:        c.checkin_at,
      cliente_nombre:    c.cliente_nombre,
      estilista_nombre:  c.estilista_nombre,
      servicio_nombre:   c.servicio_nombre,
      duracion_min:      c.duracion_min
    }))
  };
}

async function buscar(sucursal_id, nombre) {
  if (!nombre || nombre.trim().length < 2) {
    throw new AppError('Ingresa al menos 2 caracteres para buscar', 400);
  }
  return quioscoRepo.buscarPorNombre(sucursal_id, nombre.trim());
}

async function checkin(sucursal_id, cita_id) {
  const cita = await quioscoRepo.findCitaParaCheckin(cita_id, sucursal_id);

  if (!cita) throw new AppError('Cita no encontrada en esta sucursal', 404);
  if (cita.estado === 'en_proceso') throw new AppError('El check-in ya fue registrado', 409);
  if (cita.estado !== 'confirmada') {
    throw new AppError(`No se puede hacer check-in en una cita con estado "${cita.estado}"`, 400);
  }

  return quioscoRepo.registrarCheckin(cita_id);
}

module.exports = { citasHoy, buscar, checkin };
