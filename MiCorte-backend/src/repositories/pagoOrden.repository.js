const db             = require('../config/db');
const { v4: uuidv4 } = require('uuid');

async function findByOrdenId(orden_id, empresa_id) {
  const [rows] = await db.execute(
    `SELECT id, orden_id, empresa_id, monto, metodo, estado,
            referencia_externa, pagado_at, created_at, updated_at
     FROM pagos_orden
     WHERE orden_id = ? AND empresa_id = ?`,
    [orden_id, empresa_id]
  );
  return rows[0] || null;
}

// Crea el pago dentro de una transacción existente
async function createConn(conn, data) {
  const id = uuidv4();
  await conn.execute(
    `INSERT INTO pagos_orden (id, orden_id, empresa_id, monto, metodo, estado)
     VALUES (?, ?, ?, ?, ?, 'pendiente')`,
    [id, data.orden_id, data.empresa_id, data.monto, data.metodo]
  );
  return id;
}

async function marcarPagado(orden_id, referencia_externa) {
  await db.execute(
    `UPDATE pagos_orden
     SET estado = 'pagado', pagado_at = NOW(), referencia_externa = ?
     WHERE orden_id = ?`,
    [referencia_externa || null, orden_id]
  );
}

async function marcarReembolsado(orden_id) {
  await db.execute(
    `UPDATE pagos_orden SET estado = 'reembolsado' WHERE orden_id = ?`,
    [orden_id]
  );
}

module.exports = { findByOrdenId, createConn, marcarPagado, marcarReembolsado };
