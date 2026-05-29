const db             = require('../config/db');
const { v4: uuidv4 } = require('uuid');

async function findAll(empresa_id, q) {
  let sql = `
    SELECT id, empresa_id, nombre, email, telefono,
           fecha_nacimiento, puntos_acumulados, activo,
           created_at, updated_at
    FROM clientes
    WHERE empresa_id = ? AND deleted_at IS NULL`;
  const params = [empresa_id];

  if (q) {
    sql += ` AND (nombre LIKE ? OR email LIKE ? OR telefono LIKE ?)`;
    const like = `%${q}%`;
    params.push(like, like, like);
  }

  sql += ` ORDER BY nombre`;

  const [rows] = await db.execute(sql, params);
  return rows;
}

async function findById(id, empresa_id) {
  const [rows] = await db.execute(
    `SELECT id, empresa_id, nombre, email, telefono,
            fecha_nacimiento, puntos_acumulados, activo,
            created_at, updated_at
     FROM clientes
     WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL`,
    [id, empresa_id]
  );
  return rows[0] || null;
}

async function findByEmail(email, empresa_id) {
  const [rows] = await db.execute(
    `SELECT id FROM clientes
     WHERE email = ? AND empresa_id = ? AND deleted_at IS NULL`,
    [email, empresa_id]
  );
  return rows[0] || null;
}

async function create(data) {
  const id = uuidv4();
  await db.execute(
    `INSERT INTO clientes (id, empresa_id, nombre, email, telefono, fecha_nacimiento)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      id, data.empresa_id, data.nombre, data.email,
      data.telefono        || null,
      data.fecha_nacimiento || null
    ]
  );
  return findById(id, data.empresa_id);
}

async function update(id, empresa_id, data) {
  await db.execute(
    `UPDATE clientes
     SET nombre = ?, email = ?, telefono = ?, fecha_nacimiento = ?
     WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL`,
    [
      data.nombre, data.email,
      data.telefono         || null,
      data.fecha_nacimiento || null,
      id, empresa_id
    ]
  );
  return findById(id, empresa_id);
}

async function softDelete(id, empresa_id) {
  await db.execute(
    `UPDATE clientes SET deleted_at = NOW()
     WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL`,
    [id, empresa_id]
  );
}

module.exports = { findAll, findById, findByEmail, create, update, softDelete };
