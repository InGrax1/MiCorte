const db             = require('../config/db');
const { v4: uuidv4 } = require('uuid');

async function registrar({ empresa_id, usuario_id, entity_type, entity_id,
                            accion, snapshot_before, snapshot_after, ip, user_agent }) {
  await db.execute(
    `INSERT INTO logs_sistema
       (id, empresa_id, usuario_id, entity_type, entity_id,
        accion, snapshot_before, snapshot_after, ip, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      uuidv4(),
      empresa_id   || null,
      usuario_id   || null,
      entity_type,
      entity_id    || 'N/A',
      accion,
      snapshot_before ? JSON.stringify(snapshot_before) : null,
      snapshot_after  ? JSON.stringify(snapshot_after)  : null,
      ip           || null,
      user_agent   ? user_agent.slice(0, 255) : null
    ]
  );
}

module.exports = { registrar };
