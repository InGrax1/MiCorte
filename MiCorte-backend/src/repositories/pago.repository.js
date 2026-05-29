const db             = require('../config/db');
const { v4: uuidv4 } = require('uuid');

async function findByCitaId(cita_id, empresa_id) {
  const [rows] = await db.execute(
    `SELECT id, cita_id, empresa_id, monto, metodo, estado,
            referencia_externa, pagado_at, created_at, updated_at
     FROM pagos_cita
     WHERE cita_id = ? AND empresa_id = ?`,
    [cita_id, empresa_id]
  );
  return rows[0] || null;
}

// Sin filtro de tenant — usado por el webhook de MercadoPago
async function findByCitaIdPublic(cita_id) {
  const [rows] = await db.execute(
    `SELECT id, cita_id, empresa_id, monto, metodo, estado,
            referencia_externa, pagado_at, created_at, updated_at
     FROM pagos_cita
     WHERE cita_id = ?`,
    [cita_id]
  );
  return rows[0] || null;
}

async function create(data) {
  const id = uuidv4();
  await db.execute(
    `INSERT INTO pagos_cita (id, cita_id, empresa_id, monto, metodo, estado)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, data.cita_id, data.empresa_id, data.monto, data.metodo, data.estado || 'pendiente']
  );
  return findByCitaIdPublic(data.cita_id);
}

async function marcarPagado(cita_id, referencia_externa) {
  await db.execute(
    `UPDATE pagos_cita
     SET estado = 'pagado', pagado_at = NOW(),
         referencia_externa = COALESCE(?, referencia_externa)
     WHERE cita_id = ?`,
    [referencia_externa || null, cita_id]
  );
}

async function marcarReembolsado(cita_id) {
  await db.execute(
    `UPDATE pagos_cita SET estado = 'reembolsado' WHERE cita_id = ?`,
    [cita_id]
  );
}

module.exports = {
  findByCitaId, findByCitaIdPublic,
  create, marcarPagado, marcarReembolsado
};
