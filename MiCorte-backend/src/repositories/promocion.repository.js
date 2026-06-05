const db             = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// Convierte fecha ISO o string a 'YYYY-MM-DD' para columnas DATE de MySQL
function toMysqlDate(str) {
  if (!str) return null;
  return new Date(str).toISOString().slice(0, 10);
}

async function findAll(empresa_id, filtros = {}) {
  let sql = `
    SELECT
      p.id, p.empresa_id, p.nombre, p.tipo,
      p.descuento_tipo, p.descuento_valor,
      p.fecha_inicio, p.fecha_fin, p.activo, p.created_at,
      GROUP_CONCAT(ps.servicio_id) AS servicios_ids
    FROM promociones p
    LEFT JOIN promociones_servicios ps ON ps.promocion_id = p.id
    WHERE p.empresa_id = ? AND p.deleted_at IS NULL`;
  const params = [empresa_id];

  if (filtros.tipo) {
    sql += ` AND p.tipo = ?`;
    params.push(filtros.tipo);
  }
  if (filtros.activo !== undefined && filtros.activo !== null) {
    sql += ` AND p.activo = ?`;
    params.push(filtros.activo ? 1 : 0);
  }

  sql += ` GROUP BY p.id, p.empresa_id, p.nombre, p.tipo,
                    p.descuento_tipo, p.descuento_valor,
                    p.fecha_inicio, p.fecha_fin, p.activo, p.created_at
           ORDER BY p.created_at DESC`;

  const [rows] = await db.execute(sql, params);
  return rows.map(r => ({
    ...r,
    servicios_ids: r.servicios_ids ? r.servicios_ids.split(',') : []
  }));
}

async function findById(id, empresa_id) {
  const [rows] = await db.execute(
    `SELECT p.*, GROUP_CONCAT(ps.servicio_id) AS servicios_ids
     FROM promociones p
     LEFT JOIN promociones_servicios ps ON ps.promocion_id = p.id
     WHERE p.id = ? AND p.empresa_id = ? AND p.deleted_at IS NULL
     GROUP BY p.id`,
    [id, empresa_id]
  );
  if (!rows[0]) return null;
  return {
    ...rows[0],
    servicios_ids: rows[0].servicios_ids ? rows[0].servicios_ids.split(',') : []
  };
}

async function create(data) {
  const id = uuidv4();
  const conn = await db.getConnection();
  await conn.beginTransaction();
  try {
    await conn.execute(
      `INSERT INTO promociones
         (id, empresa_id, nombre, tipo, descuento_tipo, descuento_valor,
          fecha_inicio, fecha_fin, activo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        id, data.empresa_id, data.nombre, data.tipo,
        data.descuento_tipo, data.descuento_valor,
        toMysqlDate(data.fecha_inicio),
        toMysqlDate(data.fecha_fin)
      ]
    );

    if (data.servicios_ids && data.servicios_ids.length > 0) {
      for (const servicio_id of data.servicios_ids) {
        await conn.execute(
          `INSERT INTO promociones_servicios (promocion_id, servicio_id) VALUES (?, ?)`,
          [id, servicio_id]
        );
      }
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
  return findById(id, data.empresa_id);
}

async function update(id, empresa_id, data) {
  const conn = await db.getConnection();
  await conn.beginTransaction();
  try {
    await conn.execute(
      `UPDATE promociones
       SET nombre = ?, tipo = ?, descuento_tipo = ?, descuento_valor = ?,
           fecha_inicio = ?, fecha_fin = ?, activo = ?
       WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL`,
      [
        data.nombre, data.tipo, data.descuento_tipo, data.descuento_valor,
        toMysqlDate(data.fecha_inicio), toMysqlDate(data.fecha_fin),
        data.activo !== undefined ? (data.activo ? 1 : 0) : 1,
        id, empresa_id
      ]
    );

    // Reemplazar servicios asociados
    await conn.execute(
      `DELETE FROM promociones_servicios WHERE promocion_id = ?`, [id]
    );
    if (data.servicios_ids && data.servicios_ids.length > 0) {
      for (const servicio_id of data.servicios_ids) {
        await conn.execute(
          `INSERT INTO promociones_servicios (promocion_id, servicio_id) VALUES (?, ?)`,
          [id, servicio_id]
        );
      }
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
  return findById(id, empresa_id);
}

async function softDelete(id, empresa_id) {
  const [result] = await db.execute(
    `UPDATE promociones SET deleted_at = NOW()
     WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL`,
    [id, empresa_id]
  );
  return result.affectedRows > 0;
}

// Devuelve la primera promocion activa que aplica a un cliente y servicio en la fecha dada.
// Usada por cita.service.js al calcular precio_final.
async function findAplicable(empresa_id, servicio_id, cliente_fecha_nacimiento, fecha) {
  const hoy = fecha ? new Date(fecha) : new Date();

  // 1. Promocion de cumpleanos (tipo recurrente — mismo mes/dia)
  let cumpleanos = null;
  if (cliente_fecha_nacimiento) {
    const fn = new Date(cliente_fecha_nacimiento);
    if (fn.getMonth() === hoy.getMonth() && fn.getDate() === hoy.getDate()) {
      const [rows] = await db.execute(`
        SELECT p.*
        FROM promociones p
        LEFT JOIN promociones_servicios ps ON ps.promocion_id = p.id
        WHERE p.empresa_id = ? AND p.tipo = 'cumpleanos'
          AND p.activo = 1 AND p.deleted_at IS NULL
          AND (ps.servicio_id IS NULL OR ps.servicio_id = ?)
        LIMIT 1
      `, [empresa_id, servicio_id]);
      cumpleanos = rows[0] || null;
    }
  }
  if (cumpleanos) return cumpleanos;

  // 2. Promocion por fecha (fecha_especial, aniversario, manual) activa hoy
  const fechaStr = hoy.toISOString().slice(0, 10);
  const [rows] = await db.execute(`
    SELECT p.*
    FROM promociones p
    LEFT JOIN promociones_servicios ps ON ps.promocion_id = p.id
    WHERE p.empresa_id = ? AND p.tipo != 'cumpleanos'
      AND p.activo = 1 AND p.deleted_at IS NULL
      AND (p.fecha_inicio IS NULL OR p.fecha_inicio <= ?)
      AND (p.fecha_fin   IS NULL OR p.fecha_fin   >= ?)
      AND (ps.servicio_id IS NULL OR ps.servicio_id = ?)
    ORDER BY p.descuento_valor DESC
    LIMIT 1
  `, [empresa_id, fechaStr, fechaStr, servicio_id]);
  return rows[0] || null;
}

module.exports = { findAll, findById, create, update, softDelete, findAplicable };
