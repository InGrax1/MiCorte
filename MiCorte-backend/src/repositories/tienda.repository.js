const db             = require('../config/db');
const { v4: uuidv4 } = require('uuid');

async function getSucursalInfo(sucursal_id) {
  const [rows] = await db.execute(
    `SELECT id, empresa_id, nombre, telefono, direccion
     FROM sucursales
     WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
    [sucursal_id]
  );
  return rows[0] || null;
}

async function getCategorias(empresa_id, sucursal_id) {
  const [rows] = await db.execute(
    `SELECT DISTINCT c.id, c.nombre
     FROM categorias_producto c
     JOIN productos p ON p.categoria_id = c.id
     LEFT JOIN inventario i ON i.producto_id = p.id AND i.sucursal_id = ?
     WHERE p.empresa_id = ? AND p.activo = 1 AND p.deleted_at IS NULL
       AND COALESCE(i.stock_actual, 0) > 0
       AND c.empresa_id = ? AND c.deleted_at IS NULL
     ORDER BY c.nombre`,
    [sucursal_id, empresa_id, empresa_id]
  );
  return rows;
}

async function getCatalogo(sucursal_id, empresa_id, filtros = {}) {
  let sql = `
    SELECT p.id, p.nombre, p.descripcion, p.marca, p.precio, p.sku,
           p.categoria_id, c.nombre AS categoria_nombre,
           COALESCE(i.stock_actual, 0) AS stock
    FROM productos p
    JOIN categorias_producto c ON c.id = p.categoria_id
    LEFT JOIN inventario i ON i.producto_id = p.id AND i.sucursal_id = ?
    WHERE p.empresa_id = ? AND p.activo = 1 AND p.deleted_at IS NULL
      AND COALESCE(i.stock_actual, 0) > 0`;
  const params = [sucursal_id, empresa_id];

  if (filtros.categoria_id) {
    sql += ` AND p.categoria_id = ?`;
    params.push(filtros.categoria_id);
  }
  if (filtros.q) {
    sql += ` AND (p.nombre LIKE ? OR p.marca LIKE ? OR p.descripcion LIKE ?)`;
    const like = `%${filtros.q}%`;
    params.push(like, like, like);
  }

  sql += ` ORDER BY c.nombre, p.nombre`;

  const [rows] = await db.execute(sql, params);
  return rows;
}

async function findOrCreateCliente(email, nombre, telefono, empresa_id) {
  const [existing] = await db.execute(
    `SELECT id, nombre, email, telefono, puntos_acumulados
     FROM clientes
     WHERE email = ? AND empresa_id = ? AND deleted_at IS NULL LIMIT 1`,
    [email, empresa_id]
  );
  if (existing.length > 0) return existing[0];

  const id = uuidv4();
  await db.execute(
    `INSERT INTO clientes (id, empresa_id, nombre, email, telefono, activo, puntos_acumulados)
     VALUES (?, ?, ?, ?, ?, 1, 0)`,
    [id, empresa_id, nombre, email, telefono || null]
  );
  return { id, nombre, email, telefono: telefono || null, puntos_acumulados: 0 };
}

module.exports = { getSucursalInfo, getCategorias, getCatalogo, findOrCreateCliente };
