const db             = require('../config/db');
const { v4: uuidv4 } = require('uuid');

async function findMovimientos(cliente_id, empresa_id) {
  const [rows] = await db.execute(
    `SELECT id, empresa_id, cliente_id, tipo, puntos,
            origen_tipo, origen_id, descripcion, created_at
     FROM movimientos_puntos
     WHERE cliente_id = ? AND empresa_id = ?
     ORDER BY created_at DESC`,
    [cliente_id, empresa_id]
  );
  return rows;
}

async function registrarMovimiento(data) {
  const id = uuidv4();
  await db.execute(
    `INSERT INTO movimientos_puntos
       (id, empresa_id, cliente_id, tipo, puntos, origen_tipo, origen_id, descripcion)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, data.empresa_id, data.cliente_id, data.tipo, data.puntos,
      data.origen_tipo, data.origen_id || null, data.descripcion || null
    ]
  );
  return id;
}

// Actualiza puntos_acumulados del cliente
async function actualizarPuntos(cliente_id, empresa_id, delta) {
  await db.execute(
    `UPDATE clientes
     SET puntos_acumulados = GREATEST(0, puntos_acumulados + ?)
     WHERE id = ? AND empresa_id = ?`,
    [delta, cliente_id, empresa_id]
  );
}

async function getPuntosCliente(cliente_id, empresa_id) {
  const [rows] = await db.execute(
    `SELECT puntos_acumulados FROM clientes
     WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL`,
    [cliente_id, empresa_id]
  );
  return rows[0] || null;
}

module.exports = {
  findMovimientos, registrarMovimiento, actualizarPuntos, getPuntosCliente
};
