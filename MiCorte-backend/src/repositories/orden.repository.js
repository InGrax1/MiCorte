const db             = require('../config/db');
const { v4: uuidv4 } = require('uuid');

async function findAll(empresa_id, filtros = {}) {
  let sql = `
    SELECT o.id, o.empresa_id, o.sucursal_id, o.cliente_id,
           o.tipo_entrega, o.metodo_pago, o.subtotal, o.costo_envio,
           o.descuento, o.total, o.estado, o.notas, o.created_at, o.updated_at,
           cl.nombre  AS cliente_nombre, cl.email AS cliente_email,
           s.nombre   AS sucursal_nombre
    FROM ordenes o
    JOIN clientes   cl ON cl.id = o.cliente_id
    JOIN sucursales s  ON s.id  = o.sucursal_id
    WHERE o.empresa_id = ? AND o.deleted_at IS NULL`;
  const params = [empresa_id];

  if (filtros.estado) {
    sql += ` AND o.estado = ?`;
    params.push(filtros.estado);
  }
  if (filtros.cliente_id) {
    sql += ` AND o.cliente_id = ?`;
    params.push(filtros.cliente_id);
  }
  if (filtros.sucursal_id) {
    sql += ` AND o.sucursal_id = ?`;
    params.push(filtros.sucursal_id);
  }

  sql += ` ORDER BY o.created_at DESC`;

  const [rows] = await db.execute(sql, params);
  return rows;
}

async function findById(id, empresa_id) {
  const [rows] = await db.execute(
    `SELECT o.id, o.empresa_id, o.sucursal_id, o.cliente_id,
            o.tipo_entrega, o.metodo_pago, o.subtotal, o.costo_envio,
            o.descuento, o.total, o.estado, o.direccion_envio, o.notas,
            o.created_at, o.updated_at,
            cl.nombre  AS cliente_nombre, cl.email AS cliente_email, cl.telefono AS cliente_telefono,
            s.nombre   AS sucursal_nombre
     FROM ordenes o
     JOIN clientes   cl ON cl.id = o.cliente_id
     JOIN sucursales s  ON s.id  = o.sucursal_id
     WHERE o.id = ? AND o.empresa_id = ? AND o.deleted_at IS NULL`,
    [id, empresa_id]
  );
  return rows[0] || null;
}

async function findItems(orden_id) {
  const [rows] = await db.execute(
    `SELECT oi.id, oi.orden_id, oi.producto_id, oi.cantidad, oi.precio_unit, oi.subtotal,
            p.nombre AS producto_nombre, p.sku, p.marca
     FROM orden_items oi
     JOIN productos p ON p.id = oi.producto_id
     WHERE oi.orden_id = ?`,
    [orden_id]
  );
  return rows;
}

// Crea la orden y sus items dentro de una transacción existente
async function createConItems(conn, empresa_id, data, items) {
  const orden_id = uuidv4();

  await conn.execute(
    `INSERT INTO ordenes
       (id, empresa_id, sucursal_id, cliente_id, tipo_entrega, metodo_pago,
        subtotal, costo_envio, descuento, total, estado, direccion_envio, notas)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendiente', ?, ?)`,
    [
      orden_id, empresa_id, data.sucursal_id, data.cliente_id,
      data.tipo_entrega, data.metodo_pago,
      data.subtotal, data.costo_envio || 0, data.descuento || 0, data.total,
      data.direccion_envio || null, data.notas || null
    ]
  );

  for (const item of items) {
    const item_id = uuidv4();
    await conn.execute(
      `INSERT INTO orden_items (id, orden_id, producto_id, cantidad, precio_unit, subtotal)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [item_id, orden_id, item.producto_id, item.cantidad, item.precio_unit, item.subtotal]
    );
  }

  return orden_id;
}

async function updateEstado(id, empresa_id, estado) {
  await db.execute(
    `UPDATE ordenes SET estado = ?
     WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL`,
    [estado, id, empresa_id]
  );
}

// Actualiza estado dentro de una transacción existente
async function updateEstadoConn(conn, id, empresa_id, estado) {
  await conn.execute(
    `UPDATE ordenes SET estado = ?
     WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL`,
    [estado, id, empresa_id]
  );
}

async function softDelete(id, empresa_id) {
  await db.execute(
    `UPDATE ordenes SET deleted_at = NOW()
     WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL`,
    [id, empresa_id]
  );
}

module.exports = {
  findAll, findById, findItems,
  createConItems, updateEstado, updateEstadoConn, softDelete
};
