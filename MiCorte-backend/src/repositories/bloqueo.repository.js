const db             = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// MySQL DATETIME no acepta ISO 8601 — convierte a 'YYYY-MM-DD HH:MM:SS'
function toMysqlDatetime(str) {
  const d = new Date(str);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

async function findAll(empresa_id, filtros = {}) {
  const conds  = ['b.empresa_id = ?', 'b.deleted_at IS NULL'];
  const params = [empresa_id];

  if (filtros.sucursal_id) {
    conds.push('b.sucursal_id = ?');
    params.push(filtros.sucursal_id);
  }
  if (filtros.estilista_id) {
    conds.push('b.estilista_id = ?');
    params.push(filtros.estilista_id);
  }
  if (filtros.desde) {
    conds.push('b.fecha_fin >= ?');
    params.push(filtros.desde + ' 00:00:00');
  }
  if (filtros.hasta) {
    conds.push('b.fecha_inicio <= ?');
    params.push(filtros.hasta + ' 23:59:59');
  }

  const [rows] = await db.execute(`
    SELECT
      b.id, b.empresa_id, b.sucursal_id, b.estilista_id,
      b.fecha_inicio, b.fecha_fin, b.motivo, b.created_at,
      suc.nombre  AS sucursal_nombre,
      e.nombre    AS estilista_nombre
    FROM bloqueos_agenda b
    JOIN sucursales suc ON suc.id = b.sucursal_id
    LEFT JOIN estilistas e ON e.id = b.estilista_id
    WHERE ${conds.join(' AND ')}
    ORDER BY b.fecha_inicio ASC
  `, params);
  return rows;
}

async function findById(id, empresa_id) {
  const [rows] = await db.execute(
    `SELECT * FROM bloqueos_agenda
     WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL`,
    [id, empresa_id]
  );
  return rows[0] || null;
}

async function create(data) {
  const id = uuidv4();
  await db.execute(
    `INSERT INTO bloqueos_agenda
       (id, empresa_id, sucursal_id, estilista_id, fecha_inicio, fecha_fin, motivo)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.empresa_id,
      data.sucursal_id,
      data.estilista_id || null,
      toMysqlDatetime(data.fecha_inicio),
      toMysqlDatetime(data.fecha_fin),
      data.motivo || null
    ]
  );
  return findById(id, data.empresa_id);
}

async function softDelete(id, empresa_id) {
  const [result] = await db.execute(
    `UPDATE bloqueos_agenda
     SET deleted_at = NOW()
     WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL`,
    [id, empresa_id]
  );
  return result.affectedRows > 0;
}

module.exports = { findAll, findById, create, softDelete };
