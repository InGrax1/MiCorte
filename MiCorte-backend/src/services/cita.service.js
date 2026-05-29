const citaRepo      = require('../repositories/cita.repository');
const estilistaRepo = require('../repositories/estilista.repository');
const servicioRepo  = require('../repositories/servicio.repository');
const clienteRepo   = require('../repositories/cliente.repository');
const pagoRepo      = require('../repositories/pago.repository');
const { AppError }  = require('../utils/errors');

// ── Transiciones de estado permitidas ─────────────────────────
// { estadoActual: { estadoDestino: [rolesPermitidos] } }
const TRANSITIONS = {
  pendiente_pago: {
    confirmada: ['super_admin', 'admin_sucursal']
  },
  confirmada: {
    en_proceso: ['estilista', 'admin_sucursal', 'super_admin'],
    cancelada:  ['admin_sucursal', 'super_admin'],
    no_show:    ['admin_sucursal', 'super_admin']
  },
  en_proceso: {
    completada: ['estilista', 'admin_sucursal', 'super_admin'],
    cancelada:  ['admin_sucursal', 'super_admin']
  }
};

// ── Helpers de disponibilidad ──────────────────────────────────

function timeToMinutes(timeStr) {
  const parts = timeStr.split(':').map(Number);
  return parts[0] * 60 + parts[1];
}

function minutesToTime(min) {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}

function generateSlots(horaInicio, horaFin, duracionMin) {
  const start = timeToMinutes(horaInicio);
  const end   = timeToMinutes(horaFin);
  const slots = [];
  for (let t = start; t + duracionMin <= end; t += duracionMin) {
    slots.push(minutesToTime(t));
  }
  return slots;
}

function isSlotAvailable(slotTimeStr, duracion, citas, bloqueos) {
  const slotMin = timeToMinutes(slotTimeStr);
  const slotEnd = slotMin + duracion;

  for (const cita of citas) {
    const citaDate = new Date(cita.fecha_hora);
    const citaMin  = citaDate.getUTCHours() * 60 + citaDate.getUTCMinutes();
    const citaEnd  = citaMin + cita.duracion_min;
    if (slotMin < citaEnd && slotEnd > citaMin) return false;
  }

  for (const bloqueo of bloqueos) {
    const bStart = new Date(bloqueo.fecha_inicio);
    const bEnd   = new Date(bloqueo.fecha_fin);
    const bStartMin = bStart.getUTCHours() * 60 + bStart.getUTCMinutes();
    const bEndMin   = bEnd.getUTCHours()   * 60 + bEnd.getUTCMinutes();
    if (slotMin < bEndMin && slotEnd > bStartMin) return false;
  }

  return true;
}

function getDayBoundaries(fecha) {
  const [y, m, d] = fecha.split('-').map(Number);
  const start = new Date(Date.UTC(y, m - 1, d));
  const end   = new Date(Date.UTC(y, m - 1, d + 1));
  return {
    fechaInicioDia:           start.toISOString().slice(0, 19).replace('T', ' '),
    fechaInicioDiaSiguiente:  end.toISOString().slice(0, 19).replace('T', ' ')
  };
}

// ── Servicios ─────────────────────────────────────────────────

async function listar(empresa_id, filtros, user) {
  const filtrosFinales = { ...filtros };

  // Estilistas solo ven sus propias citas
  const esExclusivamenteEstilista =
    user.roles.includes('estilista') &&
    !user.roles.includes('admin_sucursal') &&
    !user.roles.includes('super_admin');

  if (esExclusivamenteEstilista) {
    const perfil = await estilistaRepo.findByUsuarioId(user.id, empresa_id);
    if (!perfil) throw new AppError('Perfil de estilista no encontrado', 404);
    filtrosFinales.estilista_id = perfil.id;
  }

  return citaRepo.findAll(empresa_id, filtrosFinales);
}

async function obtener(id, empresa_id) {
  const cita = await citaRepo.findById(id, empresa_id);
  if (!cita) throw new AppError('Cita no encontrada', 404);
  return cita;
}

async function crear(empresa_id, data) {
  // 1. Validate related entities belong to tenant
  const cliente   = await clienteRepo.findById(data.cliente_id, empresa_id);
  if (!cliente)   throw new AppError('Cliente no encontrado', 404);

  const estilista = await estilistaRepo.findById(data.estilista_id, empresa_id);
  if (!estilista) throw new AppError('Estilista no encontrado', 404);

  if (estilista.sucursal_id !== data.sucursal_id) {
    throw new AppError('El estilista no pertenece a la sucursal indicada', 422);
  }

  const servicio = await servicioRepo.findById(data.servicio_id, empresa_id);
  if (!servicio) throw new AppError('Servicio no encontrado', 404);

  // 2. Resolve precio_final from servicios_sucursales
  const sucursalEntry = (servicio.sucursales || []).find(s => s.sucursal_id === data.sucursal_id);
  const precio_final  = sucursalEntry && sucursalEntry.precio != null
    ? sucursalEntry.precio
    : servicio.precio_base;

  // 3. fecha_hora must be in the future
  if (new Date(data.fecha_hora) <= new Date()) {
    throw new AppError('La fecha de la cita debe ser en el futuro', 422);
  }

  // 4. Overlap check
  const solapadas = await citaRepo.findOverlapping(
    data.estilista_id, empresa_id, data.fecha_hora, servicio.duracion_min
  );
  if (solapadas.length > 0) {
    throw new AppError('El estilista ya tiene una cita en ese horario', 409);
  }

  // 5. Create
  const cita = await citaRepo.create({
    empresa_id,
    sucursal_id:  data.sucursal_id,
    cliente_id:   data.cliente_id,
    estilista_id: data.estilista_id,
    servicio_id:  data.servicio_id,
    fecha_hora:   data.fecha_hora,
    duracion_min: servicio.duracion_min,
    precio_final,
    descuento:    0,
    metodo_pago:  data.metodo_pago,
    estado:       'pendiente_pago',
    notas_cliente: data.notas_cliente || null
  });

  // 6. Auto-crear registro de pago (best-effort — no bloquea la respuesta)
  pagoRepo.create({
    cita_id:    cita.id,
    empresa_id,
    monto:      cita.precio_final,
    metodo:     cita.metodo_pago,
    estado:     'pendiente'
  }).catch(err => console.error('[PAGO] Error auto-creando pago:', err.message));

  return cita;
}

async function cambiarEstado(id, empresa_id, nuevoEstado, userRoles) {
  const cita = await citaRepo.findById(id, empresa_id);
  if (!cita) throw new AppError('Cita no encontrada', 404);

  const transicionesDesdeActual = TRANSITIONS[cita.estado];
  if (!transicionesDesdeActual || !transicionesDesdeActual[nuevoEstado]) {
    throw new AppError(
      `No se puede cambiar de '${cita.estado}' a '${nuevoEstado}'`, 422
    );
  }

  const rolesPermitidos = transicionesDesdeActual[nuevoEstado];
  const tienePermiso = userRoles.some(r => rolesPermitidos.includes(r));
  if (!tienePermiso) {
    throw new AppError('No tienes permisos para este cambio de estado', 403);
  }

  await citaRepo.updateEstado(id, empresa_id, nuevoEstado);
  const citaActualizada = await citaRepo.findById(id, empresa_id);

  // Al completar una cita, generar solicitud de reseña (non-blocking)
  if (nuevoEstado === 'completada') {
    const resenaService = require('../services/resena.service');
    resenaService.generarParaCita(citaActualizada).catch(err =>
      console.error('[RESENA] Error generando reseña:', err.message)
    );
  }

  return citaActualizada;
}

async function eliminar(id, empresa_id) {
  const cita = await citaRepo.findById(id, empresa_id);
  if (!cita) throw new AppError('Cita no encontrada', 404);
  if (['completada', 'en_proceso'].includes(cita.estado)) {
    throw new AppError('No se puede eliminar una cita completada o en proceso', 422);
  }
  await citaRepo.softDelete(id, empresa_id);
}

async function disponibilidad(empresa_id, estilista_id, servicio_id, fecha) {
  const estilista = await estilistaRepo.findById(estilista_id, empresa_id);
  if (!estilista) throw new AppError('Estilista no encontrado', 404);

  const servicio = await servicioRepo.findById(servicio_id, empresa_id);
  if (!servicio) throw new AppError('Servicio no encontrado', 404);

  // dia_semana: 0=Lun … 6=Dom  (schema convention)
  const [y, m, d] = fecha.split('-').map(Number);
  const date      = new Date(Date.UTC(y, m - 1, d));
  const dia_semana = (date.getUTCDay() + 6) % 7;

  const horarios = await citaRepo.getHorariosEstilista(estilista_id, dia_semana);
  if (!horarios.length) return [];

  const { fechaInicioDia, fechaInicioDiaSiguiente } = getDayBoundaries(fecha);

  const [bloqueos, citasExistentes] = await Promise.all([
    citaRepo.getBloqueos(estilista_id, estilista.sucursal_id, empresa_id, fechaInicioDia, fechaInicioDiaSiguiente),
    citaRepo.getCitasDelDia(estilista_id, empresa_id, fechaInicioDia, fechaInicioDiaSiguiente)
  ]);

  const slotsDisponibles = [];
  for (const horario of horarios) {
    const slots = generateSlots(horario.hora_inicio, horario.hora_fin, servicio.duracion_min);
    for (const slot of slots) {
      if (isSlotAvailable(slot, servicio.duracion_min, citasExistentes, bloqueos)) {
        slotsDisponibles.push(slot);
      }
    }
  }

  return slotsDisponibles;
}

module.exports = { listar, obtener, crear, cambiarEstado, eliminar, disponibilidad };
