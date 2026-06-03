const db             = require('../config/db');
const { v4: uuidv4 } = require('uuid');

async function findAll(empresa_id) {
  const [rows] = await db.execute(
    `SELECT id, empresa_id, nombre
     FROM categorias_producto
     WHERE empresa_id = ? AND deleted_at IS NULL
     ORDER BY nombre`,
    [empresa_id]
  );
  return rows;
}

async function findById(id, empresa_id) {
  const [rows] = await db.execute(
    `SELECT id, empresa_id, nombre
     FROM categorias_producto
     WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL`,
    [id, empresa_id]
  );
  return rows[0] || null;
}

async function findByNombre(nombre, empresa_id) {
  const [rows] = await db.execute(
    `SELECT id FROM categorias_producto
     WHERE nombre = ? AND empresa_id = ? AND deleted_at IS NULL`,
    [nombre, empresa_id]
  );
  return rows[0] || null;
}

async function create(data) {
  const id = uuidv4();
  await db.execute(
    `INSERT INTO categorias_producto (id, empresa_id, nombre) VALUES (?, ?, ?)`,
    [id, data.empresa_id, data.nombre]
  );
  return findById(id, data.empresa_id);
}

async function update(id, empresa_id, data) {
  await db.execute(
    `UPDATE categorias_producto SET nombre = ? WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL`,
    [data.nombre, id, empresa_id]
  );
  return findById(id, empresa_id);
}

async function softDelete(id, empresa_id) {
  await db.execute(
    `UPDATE categorias_producto SET deleted_at = NOW()
     WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL`,
    [id, empresa_id]
  );
}

module.exports = { findAll, findById, findByNombre, create, update, softDelete };
