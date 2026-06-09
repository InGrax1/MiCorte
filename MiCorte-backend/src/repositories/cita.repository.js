const db             = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// MySQL DATETIME no acepta el formato ISO 8601 con T y Z.
// Convierte cualquier fecha a 'YYYY-MM-DD HH:MM:SS' (UTC).
function toMysql(fechaIso) {
  if (!fechaIso) return null;
  return new Date(fechaIso).toISOString().slice(0, 19).replace('T', ' ');
}

async function findAll(empresa_id, filtros = {}) {
  let sql = `
    SELECT c.id, c.empresa_id, c.sucursal_id, c.cliente_id, c.estilista_id,
           c.servicio_id, c.fecha_hora, c.duracion_min, c.precio_final,
           c.descuento, c.metodo_pago, c.estado, c.notas_cliente,
           c.checkin_at, c.created_at, c.updated_at,
           cl.nombre  AS cliente_nombre,  cl.email AS cliente_email,
           e.nombre   AS estilista_nombre,
           s.nombre   AS servicio_nombre,
           suc.nombre AS sucursal_nombre
    FROM citas c
    JOIN clientes cl   ON cl.id  = c.cliente_id
    JOIN estilistas e  ON e.id   = c.estilista_id
    JOIN servicios s   ON s.id   = c.servicio_id
    JOIN sucursales suc ON suc.id = c.sucursal_id
    WHERE c.empresa_id = ? AND c.deleted_at IS NULL`;
  const params = [empresa_id];

  if (filtros.estilista_id) {
    sql += ` AND c.estilista_id = ?`;
    params.push(filtros.estilista_id);
  }
  if (filtros.sucursal_id) {
    sql += ` AND c.sucursal_id = ?`;
    params.push(filtros.sucursal_id);
  }
  if (filtros.fecha_inicio) {
    sql += ` AND c.fecha_hora >= ?`;
    params.push(toMysql(filtros.fecha_inicio));
  }
  if (filtros.fecha_fin) {
    sql += ` AND c.fecha_hora <= ?`;
    params.push(toMysql(filtros.fecha_fin));
  }
  if (filtros.estado) {
    sql += ` AND c.estado = ?`;
    params.push(filtros.estado);
  }

  sql += ` ORDER BY c.fecha_hora DESC`;

  const [rows] = await db.execute(sql, params);
  return rows;
}

async function findById(id, empresa_id) {
  const [rows] = await db.execute(
    `SELECT c.id, c.empresa_id, c.sucursal_id, c.cliente_id, c.estilista_id,
            c.servicio_id, c.fecha_hora, c.duracion_min, c.precio_final,
            c.descuento, c.metodo_pago, c.estado, c.notas_cliente,
            c.checkin_at, c.created_at, c.updated_at,
            cl.nombre  AS cliente_nombre,  cl.email AS cliente_email,
                                           cl.telefono AS cliente_telefono,
                                           cl.fecha_nacimiento AS cliente_fecha_nacimiento,
            e.nombre   AS estilista_nombre,
            s.nombre   AS servicio_nombre,
            suc.nombre AS sucursal_nombre
     FROM citas c
     JOIN clientes cl    ON cl.id  = c.cliente_id
     JOIN estilistas e   ON e.id   = c.estilista_id
     JOIN servicios s    ON s.id   = c.servicio_id
     JOIN sucursales suc ON suc.id = c.sucursal_id
     WHERE c.id = ? AND c.empresa_id = ? AND c.deleted_at IS NULL`,
    [id, empresa_id]
  );
  return rows[0] || null;
}

async function findOverlapping(estilista_id, empresa_id, fecha_hora, duracion_min) {
  const fh = toMysql(fecha_hora);
  const [rows] = await db.execute(
    `SELECT id FROM citas
     WHERE estilista_id = ?
       AND empresa_id   = ?
       AND deleted_at   IS NULL
       AND estado IN ('confirmada', 'en_proceso')
       AND fecha_hora < DATE_ADD(?, INTERVAL ? MINUTE)
       AND DATE_ADD(fecha_hora, INTERVAL duracion_min MINUTE) > ?`,
    [estilista_id, empresa_id, fh, duracion_min, fh]
  );
  return rows;
}

async function getHorariosEstilista(estilista_id, dia_semana) {
  const [rows] = await db.execute(
    `SELECT hora_inicio, hora_fin
     FROM horarios_estilistas
     WHERE estilista_id = ? AND dia_semana = ?`,
    [estilista_id, dia_semana]
  );
  return rows;
}

async function getBloqueos(estilista_id, sucursal_id, empresa_id, fechaInicioDia, fechaInicioDiaSiguiente) {
  const [rows] = await db.execute(
    `SELECT id, estilista_id, fecha_inicio, fecha_fin, motivo
     FROM bloqueos_agenda
     WHERE empresa_id  = ?
       AND sucursal_id = ?
       AND (estilista_id = ? OR estilista_id IS NULL)
       AND deleted_at IS NULL
       AND fecha_inicio < ?
       AND fecha_fin    > ?`,
    [empresa_id, sucursal_id, estilista_id, fechaInicioDiaSiguiente, fechaInicioDia]
  );
  return rows;
}

async function getCitasDelDia(estilista_id, empresa_id, fechaInicioDia, fechaInicioDiaSiguiente) {
  const [rows] = await db.execute(
    `SELECT fecha_hora, duracion_min
     FROM citas
     WHERE estilista_id = ?
       AND empresa_id   = ?
       AND deleted_at   IS NULL
       AND estado IN ('confirmada', 'en_proceso')
       AND fecha_hora >= ?
       AND fecha_hora  < ?`,
    [estilista_id, empresa_id, fechaInicioDia, fechaInicioDiaSiguiente]
  );
  return rows;
}

async function create(data) {
  const id = uuidv4();
  await db.execute(
    `INSERT INTO citas
       (id, empresa_id, sucursal_id, cliente_id, estilista_id, servicio_id,
        fecha_hora, duracion_min, precio_final, descuento, metodo_pago, estado, notas_cliente)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, data.empresa_id, data.sucursal_id, data.cliente_id,
      data.estilista_id, data.servicio_id, toMysql(data.fecha_hora),
      data.duracion_min, data.precio_final, data.descuento || 0,
      data.metodo_pago, data.estado, data.notas_cliente || null
    ]
  );
  return findById(id, data.empresa_id);
}

async function updateEstado(id, empresa_id, estado) {
  await db.execute(
    `UPDATE citas SET estado = ?
     WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL`,
    [estado, id, empresa_id]
  );
}

async function softDelete(id, empresa_id) {
  await db.execute(
    `UPDATE citas SET deleted_at = NOW()
     WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL`,
    [id, empresa_id]
  );
}

async function marcarResenaEnviada(id) {
  await db.execute(
    `UPDATE citas SET resena_enviada = 1 WHERE id = ?`,
    [id]
  );
}

module.exports = {
  findAll, findById, findOverlapping,
  getHorariosEstilista, getBloqueos, getCitasDelDia,
  create, updateEstado, softDelete, marcarResenaEnviada
};
