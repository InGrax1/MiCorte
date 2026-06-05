const db             = require('../config/db');
const { v4: uuidv4 } = require('uuid');

async function findByCliente(cliente_id, empresa_id) {
  const [rows] = await db.execute(`
    SELECT
      n.id, n.empresa_id, n.cliente_id, n.estilista_id, n.cita_id,
      n.nota, n.created_at,
      e.nombre AS estilista_nombre,
      c.fecha_hora AS cita_fecha
    FROM notas_cliente n
    JOIN estilistas e ON e.id = n.estilista_id
    LEFT JOIN citas c ON c.id = n.cita_id
    WHERE n.cliente_id = ? AND n.empresa_id = ?
    ORDER BY n.created_at DESC
  `, [cliente_id, empresa_id]);
  return rows;
}

async function create(data) {
  const id = uuidv4();
  await db.execute(
    `INSERT INTO notas_cliente
       (id, empresa_id, cliente_id, estilista_id, cita_id, nota)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.empresa_id,
      data.cliente_id,
      data.estilista_id,
      data.cita_id || null,
      data.nota
    ]
  );
  const [rows] = await db.execute(
    `SELECT n.id, n.empresa_id, n.cliente_id, n.estilista_id, n.cita_id,
            n.nota, n.created_at, e.nombre AS estilista_nombre
     FROM notas_cliente n
     JOIN estilistas e ON e.id = n.estilista_id
     WHERE n.id = ?`,
    [id]
  );
  return rows[0] || null;
}

module.exports = { findByCliente, create };
