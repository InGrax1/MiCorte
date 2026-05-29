const db             = require('../config/db');
const { v4: uuidv4 } = require('uuid');

async function findAll(empresa_id, sucursal_id) {
  let sql, params;

  if (sucursal_id) {
    sql = `
      SELECT s.id, s.empresa_id, s.nombre, s.descripcion,
             s.precio_base, s.duracion_min, s.activo,
             s.created_at, s.updated_at,
             COALESCE(ss.precio, s.precio_base) AS precio_sucursal,
             ss.activo AS activo_sucursal
      FROM servicios s
      JOIN servicios_sucursales ss ON ss.servicio_id = s.id AND ss.sucursal_id = ?
      WHERE s.empresa_id = ? AND s.deleted_at IS NULL AND ss.activo = 1
      ORDER BY s.nombre`;
    params = [sucursal_id, empresa_id];
  } else {
    sql = `
      SELECT id, empresa_id, nombre, descripcion,
             precio_base, duracion_min, activo,
             created_at, updated_at
      FROM servicios
      WHERE empresa_id = ? AND deleted_at IS NULL
      ORDER BY nombre`;
    params = [empresa_id];
  }

  const [rows] = await db.execute(sql, params);
  return rows;
}

async function findById(id, empresa_id) {
  const [rows] = await db.execute(
    `SELECT id, empresa_id, nombre, descripcion,
            precio_base, duracion_min, activo,
            created_at, updated_at
     FROM servicios
     WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL`,
    [id, empresa_id]
  );
  if (!rows[0]) return null;

  const servicio = rows[0];
  const [sucursales] = await db.execute(
    `SELECT ss.sucursal_id, ss.precio, ss.activo,
            suc.nombre AS sucursal_nombre
     FROM servicios_sucursales ss
     JOIN sucursales suc ON suc.id = ss.sucursal_id AND suc.deleted_at IS NULL
     WHERE ss.servicio_id = ?`,
    [id]
  );
  servicio.sucursales = sucursales;
  return servicio;
}

async function create(data) {
  const id = uuidv4();
  await db.execute(
    `INSERT INTO servicios (id, empresa_id, nombre, descripcion, precio_base, duracion_min)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, data.empresa_id, data.nombre, data.descripcion || null, data.precio_base, data.duracion_min]
  );
  return findById(id, data.empresa_id);
}

async function update(id, empresa_id, data) {
  await db.execute(
    `UPDATE servicios
     SET nombre = ?, descripcion = ?, precio_base = ?, duracion_min = ?
     WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL`,
    [data.nombre, data.descripcion || null, data.precio_base, data.duracion_min, id, empresa_id]
  );
  return findById(id, empresa_id);
}

async function softDelete(id, empresa_id) {
  await db.execute(
    `UPDATE servicios SET deleted_at = NOW()
     WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL`,
    [id, empresa_id]
  );
}

async function assignToSucursal(servicio_id, sucursal_id, precio) {
  await db.execute(
    `INSERT INTO servicios_sucursales (servicio_id, sucursal_id, precio)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE precio = VALUES(precio), activo = 1`,
    [servicio_id, sucursal_id, precio || null]
  );
}

async function removeFromSucursal(servicio_id, sucursal_id) {
  await db.execute(
    `DELETE FROM servicios_sucursales
     WHERE servicio_id = ? AND sucursal_id = ?`,
    [servicio_id, sucursal_id]
  );
}

module.exports = {
  findAll, findById, create, update, softDelete,
  assignToSucursal, removeFromSucursal
};
