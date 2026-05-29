const db             = require('../config/db');
const { v4: uuidv4 } = require('uuid');

async function findAll(empresa_id, filtros = {}) {
  let sql = `
    SELECT r.id, r.empresa_id, r.cita_id, r.cliente_id, r.estilista_id,
           r.token, r.token_exp, r.rating, r.comentario, r.visible,
           r.created_at, r.respondido_at,
           cl.nombre  AS cliente_nombre,
           e.nombre   AS estilista_nombre,
           suc.nombre AS sucursal_nombre
    FROM resenas r
    JOIN clientes cl    ON cl.id  = r.cliente_id
    JOIN estilistas e   ON e.id   = r.estilista_id
    JOIN citas c        ON c.id   = r.cita_id
    JOIN sucursales suc ON suc.id = c.sucursal_id
    WHERE r.empresa_id = ? AND r.deleted_at IS NULL`;
  const params = [empresa_id];

  if (filtros.estilista_id) {
    sql += ` AND r.estilista_id = ?`;
    params.push(filtros.estilista_id);
  }
  if (filtros.visible !== undefined && filtros.visible !== null) {
    sql += ` AND r.visible = ?`;
    params.push(filtros.visible ? 1 : 0);
  }
  if (filtros.solo_respondidas) {
    sql += ` AND r.respondido_at IS NOT NULL`;
  }

  sql += ` ORDER BY r.created_at DESC`;

  const [rows] = await db.execute(sql, params);
  return rows;
}

async function findByToken(token) {
  const [rows] = await db.execute(
    `SELECT r.id, r.empresa_id, r.cita_id, r.cliente_id, r.estilista_id,
            r.token, r.token_exp, r.rating, r.comentario, r.visible,
            r.created_at, r.respondido_at,
            cl.nombre  AS cliente_nombre,  cl.email AS cliente_email,
            e.nombre   AS estilista_nombre,
            suc.nombre AS sucursal_nombre
     FROM resenas r
     JOIN clientes cl    ON cl.id  = r.cliente_id
     JOIN estilistas e   ON e.id   = r.estilista_id
     JOIN citas c        ON c.id   = r.cita_id
     JOIN sucursales suc ON suc.id = c.sucursal_id
     WHERE r.token = ? AND r.deleted_at IS NULL`,
    [token]
  );
  return rows[0] || null;
}

async function findByCitaId(cita_id, empresa_id) {
  const [rows] = await db.execute(
    `SELECT id FROM resenas WHERE cita_id = ? AND empresa_id = ? AND deleted_at IS NULL`,
    [cita_id, empresa_id]
  );
  return rows[0] || null;
}

async function create(data) {
  const id    = uuidv4();
  const token = uuidv4();
  await db.execute(
    `INSERT INTO resenas
       (id, empresa_id, cita_id, cliente_id, estilista_id, token, token_exp)
     VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
    [id, data.empresa_id, data.cita_id, data.cliente_id, data.estilista_id, token]
  );
  return findByToken(token);
}

async function submitResena(token, rating, comentario) {
  await db.execute(
    `UPDATE resenas
     SET rating = ?, comentario = ?, respondido_at = NOW()
     WHERE token = ? AND deleted_at IS NULL`,
    [rating, comentario || null, token]
  );
}

async function toggleVisibilidad(id, empresa_id) {
  await db.execute(
    `UPDATE resenas SET visible = NOT visible
     WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL`,
    [id, empresa_id]
  );
  const [rows] = await db.execute(
    `SELECT id, visible FROM resenas WHERE id = ? AND empresa_id = ?`,
    [id, empresa_id]
  );
  return rows[0] || null;
}

module.exports = {
  findAll, findByToken, findByCitaId,
  create, submitResena, toggleVisibilidad
};
