const db             = require('../config/db');
const { v4: uuidv4 } = require('uuid');

async function findAll(empresa_id, filtros = {}) {
  let sql = `
    SELECT p.id, p.empresa_id, p.categoria_id, p.nombre, p.descripcion,
           p.marca, p.precio, p.sku, p.activo, p.created_at, p.updated_at,
           c.nombre AS categoria_nombre
    FROM productos p
    JOIN categorias_producto c ON c.id = p.categoria_id
    WHERE p.empresa_id = ? AND p.deleted_at IS NULL`;
  const params = [empresa_id];

  if (filtros.categoria_id) {
    sql += ` AND p.categoria_id = ?`;
    params.push(filtros.categoria_id);
  }
  if (filtros.activo !== undefined) {
    sql += ` AND p.activo = ?`;
    params.push(filtros.activo ? 1 : 0);
  }
  if (filtros.q) {
    sql += ` AND (p.nombre LIKE ? OR p.marca LIKE ? OR p.sku LIKE ?)`;
    const like = `%${filtros.q}%`;
    params.push(like, like, like);
  }

  sql += ` ORDER BY p.nombre`;

  const [rows] = await db.execute(sql, params);
  return rows;
}

async function findById(id, empresa_id) {
  const [rows] = await db.execute(
    `SELECT p.id, p.empresa_id, p.categoria_id, p.nombre, p.descripcion,
            p.marca, p.precio, p.sku, p.activo, p.created_at, p.updated_at,
            c.nombre AS categoria_nombre
     FROM productos p
     JOIN categorias_producto c ON c.id = p.categoria_id
     WHERE p.id = ? AND p.empresa_id = ? AND p.deleted_at IS NULL`,
    [id, empresa_id]
  );
  return rows[0] || null;
}

async function create(data) {
  const id = uuidv4();
  await db.execute(
    `INSERT INTO productos
       (id, empresa_id, categoria_id, nombre, descripcion, marca, precio, sku, activo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, data.empresa_id, data.categoria_id, data.nombre,
      data.descripcion || null, data.marca || null,
      data.precio, data.sku || null, 1
    ]
  );
  return findById(id, data.empresa_id);
}

async function update(id, empresa_id, data) {
  await db.execute(
    `UPDATE productos
     SET categoria_id = ?, nombre = ?, descripcion = ?, marca = ?,
         precio = ?, sku = ?, activo = ?
     WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL`,
    [
      data.categoria_id, data.nombre, data.descripcion || null,
      data.marca || null, data.precio, data.sku || null,
      data.activo !== undefined ? (data.activo ? 1 : 0) : 1,
      id, empresa_id
    ]
  );
  return findById(id, empresa_id);
}

async function softDelete(id, empresa_id) {
  await db.execute(
    `UPDATE productos SET deleted_at = NOW()
     WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL`,
    [id, empresa_id]
  );
}

// Obtiene todas las sucursales del tenant para inicializar inventario
async function getSucursalesIds(empresa_id) {
  const [rows] = await db.execute(
    `SELECT id FROM sucursales WHERE empresa_id = ? AND deleted_at IS NULL`,
    [empresa_id]
  );
  return rows.map(r => r.id);
}

module.exports = { findAll, findById, create, update, softDelete, getSucursalesIds };
