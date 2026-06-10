const db          = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const citaService = require('./cita.service');
const { AppError } = require('../utils/errors');

// ── Helpers ────────────────────────────────────────────────────
function timeToMin(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
function minToTime(m) { return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; }

function generateSlots(inicio, fin, duracion) {
  const slots = [];
  for (let t = timeToMin(inicio); t + duracion <= timeToMin(fin); t += duracion)
    slots.push(minToTime(t));
  return slots;
}

function slotLibre(slot, duracion, citas, bloqueos) {
  const s = timeToMin(slot), e = s + duracion;
  for (const c of citas) {
    const dt = new Date(c.fecha_hora);
    const cm = dt.getUTCHours() * 60 + dt.getUTCMinutes();
    if (s < cm + c.duracion_min && e > cm) return false;
  }
  for (const b of bloqueos) {
    const bs = new Date(b.fecha_inicio), be = new Date(b.fecha_fin);
    const bm = bs.getUTCHours() * 60 + bs.getUTCMinutes();
    const bem = be.getUTCHours() * 60 + be.getUTCMinutes();
    if (s < bem && e > bm) return false;
  }
  return true;
}

async function getEmpresaId(sucursal_id) {
  const [rows] = await db.execute(
    'SELECT empresa_id FROM sucursales WHERE id = ? AND deleted_at IS NULL LIMIT 1',
    [sucursal_id]
  );
  if (!rows.length) throw new AppError('Sucursal no encontrada', 404);
  return rows[0].empresa_id;
}

// ── Endpoints públicos ─────────────────────────────────────────

async function listarSucursales() {
  const [rows] = await db.execute(
    'SELECT id, nombre, direccion, telefono FROM sucursales WHERE deleted_at IS NULL ORDER BY nombre'
  );
  return rows;
}

async function listarServicios(sucursal_id) {
  const empresa_id = await getEmpresaId(sucursal_id);
  const [rows] = await db.execute(
    `SELECT s.id, s.nombre, s.descripcion, s.duracion_min,
            COALESCE(ss.precio, s.precio_base) AS precio
     FROM servicios s
     JOIN servicios_sucursales ss ON ss.servicio_id = s.id AND ss.sucursal_id = ? AND ss.activo = 1
     WHERE s.empresa_id = ? AND s.activo = 1 AND s.deleted_at IS NULL
     ORDER BY s.nombre`,
    [sucursal_id, empresa_id]
  );
  return rows;
}

async function listarEstilistas(sucursal_id) {
  const empresa_id = await getEmpresaId(sucursal_id);
  const [rows] = await db.execute(
    `SELECT e.id, e.nombre, e.foto_url, e.especialidades,
            ROUND((SELECT AVG(r.rating) FROM resenas r
                   WHERE r.estilista_id = e.id AND r.visible = 1
                     AND r.rating IS NOT NULL AND r.deleted_at IS NULL), 1) AS rating_promedio,
            (SELECT COUNT(*) FROM resenas r
             WHERE r.estilista_id = e.id AND r.visible = 1
               AND r.rating IS NOT NULL AND r.deleted_at IS NULL) AS total_resenas
     FROM estilistas e
     WHERE e.sucursal_id = ? AND e.empresa_id = ? AND e.activo = 1 AND e.deleted_at IS NULL
     ORDER BY e.nombre`,
    [sucursal_id, empresa_id]
  );
  return rows;
}

async function getSlots(sucursal_id, servicio_id, fecha, estilista_id) {
  const empresa_id = await getEmpresaId(sucursal_id);

  const [servicios] = await db.execute(
    'SELECT duracion_min FROM servicios WHERE id = ? AND empresa_id = ? AND activo = 1 AND deleted_at IS NULL LIMIT 1',
    [servicio_id, empresa_id]
  );
  if (!servicios.length) throw new AppError('Servicio no encontrado', 404);
  const duracion = Number(servicios[0].duracion_min);

  // Estilistas a evaluar
  let estilistas;
  if (estilista_id) {
    const [r] = await db.execute(
      'SELECT id, nombre FROM estilistas WHERE id = ? AND sucursal_id = ? AND empresa_id = ? AND activo = 1 AND deleted_at IS NULL LIMIT 1',
      [estilista_id, sucursal_id, empresa_id]
    );
    estilistas = r;
  } else {
    const [r] = await db.execute(
      'SELECT id, nombre FROM estilistas WHERE sucursal_id = ? AND empresa_id = ? AND activo = 1 AND deleted_at IS NULL',
      [sucursal_id, empresa_id]
    );
    estilistas = r;
  }
  if (!estilistas.length) return [];

  const [y, m, d] = fecha.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dia_semana = (dt.getUTCDay() + 6) % 7;
  const fechaIni = dt.toISOString().slice(0, 19).replace('T', ' ');
  const fechaFin = new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 19).replace('T', ' ');

  // slot -> lista de estilistas disponibles
  const slotMap = {};

  // Horario default cuando el estilista no tiene horarios configurados
  const HORARIO_DEFAULT = [{ hora_inicio: '09:00', hora_fin: '18:00' }];

  for (const est of estilistas) {
    const [horariosDia] = await db.execute(
      'SELECT hora_inicio, hora_fin FROM horarios_estilistas WHERE estilista_id = ? AND dia_semana = ?',
      [est.id, dia_semana]
    );

    // Si el estilista tiene horarios configurados pero no para este dia, es su dia libre
    // Si no tiene ningun horario configurado, usar default (9-18)
    let horarios;
    if (horariosDia.length > 0) {
      horarios = horariosDia;
    } else {
      const [[{ total }]] = await db.execute(
        'SELECT COUNT(*) AS total FROM horarios_estilistas WHERE estilista_id = ?',
        [est.id]
      );
      if (Number(total) > 0) continue; // tiene horarios pero no este dia → dia libre
      horarios = HORARIO_DEFAULT;       // sin horarios configurados → usar default
    }

    const [citas] = await db.execute(
      `SELECT fecha_hora, duracion_min FROM citas
       WHERE estilista_id = ? AND empresa_id = ? AND deleted_at IS NULL
         AND estado IN ('pendiente_pago','confirmada','en_proceso')
         AND fecha_hora >= ? AND fecha_hora < ?`,
      [est.id, empresa_id, fechaIni, fechaFin]
    );

    const [bloqueos] = await db.execute(
      `SELECT fecha_inicio, fecha_fin FROM bloqueos_agenda
       WHERE empresa_id = ? AND sucursal_id = ?
         AND (estilista_id = ? OR estilista_id IS NULL)
         AND deleted_at IS NULL AND fecha_inicio < ? AND fecha_fin > ?`,
      [empresa_id, sucursal_id, est.id, fechaFin, fechaIni]
    );

    for (const h of horarios) {
      for (const slot of generateSlots(h.hora_inicio, h.hora_fin, duracion)) {
        if (slotLibre(slot, duracion, citas, bloqueos)) {
          if (!slotMap[slot]) slotMap[slot] = [];
          slotMap[slot].push({ id: est.id, nombre: est.nombre });
        }
      }
    }
  }

  return Object.entries(slotMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([hora, estilistas]) => ({ hora, estilistas }));
}

async function crear(sucursal_id, { nombre, email, telefono, servicio_id, fecha_hora, estilista_id, notas }) {
  const empresa_id = await getEmpresaId(sucursal_id);

  // Buscar o crear cliente
  const [existing] = await db.execute(
    'SELECT id FROM clientes WHERE email = ? AND empresa_id = ? AND deleted_at IS NULL LIMIT 1',
    [email, empresa_id]
  );

  let cliente_id;
  if (existing.length) {
    cliente_id = existing[0].id;
  } else {
    cliente_id = uuidv4();
    await db.execute(
      'INSERT INTO clientes (id, empresa_id, nombre, email, telefono) VALUES (?, ?, ?, ?, ?)',
      [cliente_id, empresa_id, nombre, email, telefono || null]
    );
  }

  // Crear cita usando el servicio existente (valida solapamientos, asigna estilista, etc.)
  const cita = await citaService.crear(empresa_id, {
    cliente_id,
    sucursal_id,
    servicio_id,
    fecha_hora,
    metodo_pago: 'efectivo',
    estilista_id: estilista_id || null,
    notas_cliente: notas || null,
  });

  return cita;
}

module.exports = { listarSucursales, listarServicios, listarEstilistas, getSlots, crear };
