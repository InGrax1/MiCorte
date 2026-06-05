const db = require('../config/db');

// Citas confirmadas y en_proceso de hoy para una sucursal
async function getCitasHoy(sucursal_id) {
  const [rows] = await db.execute(`
    SELECT
      c.id, c.fecha_hora, c.estado, c.checkin_at,
      c.duracion_min, c.notas_cliente,
      cl.nombre   AS cliente_nombre,
      cl.telefono AS cliente_telefono,
      e.nombre    AS estilista_nombre,
      s.nombre    AS servicio_nombre,
      suc.id      AS sucursal_id,
      suc.nombre  AS sucursal_nombre
    FROM sucursales suc
    JOIN citas c     ON c.sucursal_id = suc.id AND c.deleted_at IS NULL
    JOIN clientes cl ON cl.id = c.cliente_id
    JOIN estilistas e ON e.id = c.estilista_id
    JOIN servicios  s ON s.id = c.servicio_id
    WHERE suc.id = ?
      AND suc.deleted_at IS NULL
      AND c.estado IN ('confirmada', 'en_proceso')
      AND DATE(c.fecha_hora) = CURDATE()
    ORDER BY c.fecha_hora ASC
  `, [sucursal_id]);
  return rows;
}

// Verifica que la cita pertenece a la sucursal y está en estado válido
async function findCitaParaCheckin(cita_id, sucursal_id) {
  const [rows] = await db.execute(`
    SELECT c.id, c.estado, c.sucursal_id,
           cl.nombre AS cliente_nombre
    FROM citas c
    JOIN clientes cl ON cl.id = c.cliente_id
    WHERE c.id = ? AND c.sucursal_id = ? AND c.deleted_at IS NULL
  `, [cita_id, sucursal_id]);
  return rows[0] || null;
}

// Busca citas de hoy por nombre de cliente (para cuando no tienen QR)
async function buscarPorNombre(sucursal_id, nombre) {
  const [rows] = await db.execute(`
    SELECT
      c.id, c.fecha_hora, c.estado,
      cl.nombre  AS cliente_nombre,
      e.nombre   AS estilista_nombre,
      s.nombre   AS servicio_nombre
    FROM citas c
    JOIN clientes   cl ON cl.id = c.cliente_id
    JOIN estilistas e  ON e.id  = c.estilista_id
    JOIN servicios  s  ON s.id  = c.servicio_id
    WHERE c.sucursal_id = ?
      AND c.deleted_at IS NULL
      AND c.estado = 'confirmada'
      AND DATE(c.fecha_hora) = CURDATE()
      AND cl.nombre LIKE ?
    ORDER BY c.fecha_hora ASC
    LIMIT 10
  `, [sucursal_id, `%${nombre}%`]);
  return rows;
}

// Registra el check-in: checkin_at + estado -> en_proceso
async function registrarCheckin(cita_id) {
  await db.execute(
    `UPDATE citas
     SET checkin_at = NOW(), estado = 'en_proceso'
     WHERE id = ? AND estado = 'confirmada' AND deleted_at IS NULL`,
    [cita_id]
  );

  const [rows] = await db.execute(`
    SELECT c.id, c.estado, c.checkin_at, c.fecha_hora,
           cl.nombre AS cliente_nombre,
           e.nombre  AS estilista_nombre,
           s.nombre  AS servicio_nombre
    FROM citas c
    JOIN clientes   cl ON cl.id = c.cliente_id
    JOIN estilistas e  ON e.id  = c.estilista_id
    JOIN servicios  s  ON s.id  = c.servicio_id
    WHERE c.id = ?
  `, [cita_id]);
  return rows[0] || null;
}

module.exports = { getCitasHoy, findCitaParaCheckin, buscarPorNombre, registrarCheckin };
