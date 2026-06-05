const db             = require('../config/db');
const { v4: uuidv4 } = require('uuid');

async function findAll(empresa_id, filtros = {}) {
  let sql = `
    SELECT i.id, i.empresa_id, i.producto_id, i.sucursal_id,
           i.stock_actual, i.stock_minimo, i.updated_at,
           p.nombre AS producto_nombre, p.sku, p.precio,
           s.nombre AS sucursal_nombre
    FROM inventario i
    JOIN productos  p ON p.id = i.producto_id
    JOIN sucursales s ON s.id = i.sucursal_id
    WHERE i.empresa_id = ? AND p.deleted_at IS NULL`;
  const params = [empresa_id];

  if (filtros.sucursal_id) {
    sql += ` AND i.sucursal_id = ?`;
    params.push(filtros.sucursal_id);
  }
  if (filtros.producto_id) {
    sql += ` AND i.producto_id = ?`;
    params.push(filtros.producto_id);
  }
  if (filtros.bajo_minimo) {
    sql += ` AND i.stock_actual <= i.stock_minimo`;
  }

  sql += ` ORDER BY p.nombre, s.nombre`;

  const [rows] = await db.execute(sql, params);
  return rows;
}

async function findByProductoSucursal(producto_id, sucursal_id) {
  const [rows] = await db.execute(
    `SELECT * FROM inventario WHERE producto_id = ? AND sucursal_id = ?`,
    [producto_id, sucursal_id]
  );
  return rows[0] || null;
}

// Inicializa registro de inventario en 0 para un producto en una sucursal
async function initRegistro(empresa_id, producto_id, sucursal_id) {
  const existe = await findByProductoSucursal(producto_id, sucursal_id);
  if (existe) return existe;

  const id = uuidv4();
  await db.execute(
    `INSERT INTO inventario (id, empresa_id, producto_id, sucursal_id, stock_actual, stock_minimo)
     VALUES (?, ?, ?, ?, 0, 5)`,
    [id, empresa_id, producto_id, sucursal_id]
  );
  return findByProductoSucursal(producto_id, sucursal_id);
}

// Ajuste manual de stock (positivo = entrada, negativo = salida)
async function ajustar(producto_id, sucursal_id, empresa_id, cantidad, stock_minimo) {
  let sql, params;

  if (stock_minimo !== undefined) {
    sql = `UPDATE inventario
           SET stock_actual = stock_actual + ?, stock_minimo = ?
           WHERE producto_id = ? AND sucursal_id = ? AND empresa_id = ?`;
    params = [cantidad, stock_minimo, producto_id, sucursal_id, empresa_id];
  } else {
    sql = `UPDATE inventario
           SET stock_actual = stock_actual + ?
           WHERE producto_id = ? AND sucursal_id = ? AND empresa_id = ?`;
    params = [cantidad, producto_id, sucursal_id, empresa_id];
  }

  await db.execute(sql, params);
  return findByProductoSucursal(producto_id, sucursal_id);
}

// Descuenta stock — usado en transacciones de órdenes (recibe conn)
async function descontar(conn, producto_id, sucursal_id, empresa_id, cantidad) {
  await conn.execute(
    `UPDATE inventario
     SET stock_actual = stock_actual - ?
     WHERE producto_id = ? AND sucursal_id = ? AND empresa_id = ?`,
    [cantidad, producto_id, sucursal_id, empresa_id]
  );
}

// Repone stock — usado al cancelar una orden (recibe conn)
async function reponer(conn, producto_id, sucursal_id, empresa_id, cantidad) {
  await conn.execute(
    `UPDATE inventario
     SET stock_actual = stock_actual + ?
     WHERE producto_id = ? AND sucursal_id = ? AND empresa_id = ?`,
    [cantidad, producto_id, sucursal_id, empresa_id]
  );
}

// Valida que hay stock suficiente para una lista de items
// Retorna array con los productos sin stock suficiente
async function validarStock(sucursal_id, empresa_id, items) {
  const faltantes = [];
  for (const item of items) {
    const inv = await findByProductoSucursal(item.producto_id, sucursal_id);
    if (!inv || inv.stock_actual < item.cantidad) {
      faltantes.push({ producto_id: item.producto_id, disponible: inv?.stock_actual ?? 0 });
    }
  }
  return faltantes;
}

// Devuelve datos para la alerta de stock: info de producto, sucursal y email del admin
async function getInfoAlerta(producto_id, sucursal_id) {
  const [rows] = await db.execute(`
    SELECT i.stock_actual, i.stock_minimo,
           p.nombre   AS producto_nombre,
           s.nombre   AS sucursal_nombre,
           e.email_contacto AS admin_email
    FROM inventario i
    JOIN productos  p ON p.id = i.producto_id
    JOIN sucursales s ON s.id = i.sucursal_id
    JOIN empresas   e ON e.id = i.empresa_id
    WHERE i.producto_id = ? AND i.sucursal_id = ?
  `, [producto_id, sucursal_id]);
  return rows[0] || null;
}

module.exports = {
  findAll, findByProductoSucursal, initRegistro,
  ajustar, descontar, reponer, validarStock, getInfoAlerta
};
