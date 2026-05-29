const db           = require('../config/db');
const { v4: uuidv4 } = require('uuid');

async function findAll(empresa_id) {
  const [rows] = await db.execute(
    `SELECT id, empresa_id, nombre, direccion, ciudad, telefono,
            latitud, longitud, hora_apertura, hora_cierre, activo,
            created_at, updated_at
     FROM sucursales
     WHERE empresa_id = ? AND deleted_at IS NULL
     ORDER BY nombre`,
    [empresa_id]
  );
  return rows;
}

async function findById(id, empresa_id) {
  const [rows] = await db.execute(
    `SELECT id, empresa_id, nombre, direccion, ciudad, telefono,
            latitud, longitud, hora_apertura, hora_cierre, activo,
            created_at, updated_at
     FROM sucursales
     WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL`,
    [id, empresa_id]
  );
  return rows[0] || null;
}

async function create(data) {
  const id = uuidv4();
  await db.execute(
    `INSERT INTO sucursales
       (id, empresa_id, nombre, direccion, ciudad, telefono,
        latitud, longitud, hora_apertura, hora_cierre)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, data.empresa_id, data.nombre, data.direccion,
      data.ciudad    || null, data.telefono  || null,
      data.latitud   || null, data.longitud  || null,
      data.hora_apertura, data.hora_cierre
    ]
  );
  return findById(id, data.empresa_id);
}

async function update(id, empresa_id, data) {
  await db.execute(
    `UPDATE sucursales
     SET nombre = ?, direccion = ?, ciudad = ?, telefono = ?,
         latitud = ?, longitud = ?, hora_apertura = ?, hora_cierre = ?
     WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL`,
    [
      data.nombre, data.direccion, data.ciudad || null, data.telefono || null,
      data.latitud ?? null, data.longitud ?? null,
      data.hora_apertura, data.hora_cierre,
      id, empresa_id
    ]
  );
  return findById(id, empresa_id);
}

async function toggleActivo(id, empresa_id) {
  await db.execute(
    `UPDATE sucursales SET activo = NOT activo
     WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL`,
    [id, empresa_id]
  );
  return findById(id, empresa_id);
}

async function softDelete(id, empresa_id) {
  await db.execute(
    `UPDATE sucursales SET deleted_at = NOW()
     WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL`,
    [id, empresa_id]
  );
}

module.exports = { findAll, findById, create, update, toggleActivo, softDelete };
