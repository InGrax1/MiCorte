const db             = require('../config/db');
const { v4: uuidv4 } = require('uuid');

async function findAll(empresa_id, sucursal_id) {
  let sql = `
    SELECT e.id, e.empresa_id, e.sucursal_id, e.usuario_id, e.nombre,
           e.especialidades, e.bio, e.foto_url, e.activo,
           e.created_at, e.updated_at,
           s.nombre AS sucursal_nombre,
           ROUND((
             SELECT AVG(r.rating)
             FROM resenas r
             WHERE r.estilista_id = e.id
               AND r.visible = 1
               AND r.rating IS NOT NULL
               AND r.deleted_at IS NULL
           ), 1) AS rating_promedio,
           (
             SELECT COUNT(*)
             FROM resenas r
             WHERE r.estilista_id = e.id
               AND r.visible = 1
               AND r.rating IS NOT NULL
               AND r.deleted_at IS NULL
           ) AS total_resenas
    FROM estilistas e
    JOIN sucursales s ON s.id = e.sucursal_id
    WHERE e.empresa_id = ? AND e.deleted_at IS NULL`;
  const params = [empresa_id];

  if (sucursal_id) {
    sql += ` AND e.sucursal_id = ?`;
    params.push(sucursal_id);
  }

  sql += ` ORDER BY e.nombre`;

  const [rows] = await db.execute(sql, params);
  return rows.map(parseEspecialidades);
}

async function findById(id, empresa_id) {
  const [rows] = await db.execute(
    `SELECT e.id, e.empresa_id, e.sucursal_id, e.usuario_id, e.nombre,
            e.especialidades, e.bio, e.foto_url, e.activo,
            e.created_at, e.updated_at,
            s.nombre AS sucursal_nombre,
            ROUND((
              SELECT AVG(r.rating)
              FROM resenas r
              WHERE r.estilista_id = e.id
                AND r.visible = 1
                AND r.rating IS NOT NULL
                AND r.deleted_at IS NULL
            ), 1) AS rating_promedio,
            (
              SELECT COUNT(*)
              FROM resenas r
              WHERE r.estilista_id = e.id
                AND r.visible = 1
                AND r.rating IS NOT NULL
                AND r.deleted_at IS NULL
            ) AS total_resenas
     FROM estilistas e
     JOIN sucursales s ON s.id = e.sucursal_id
     WHERE e.id = ? AND e.empresa_id = ? AND e.deleted_at IS NULL`,
    [id, empresa_id]
  );
  if (!rows[0]) return null;
  const estilista = parseEspecialidades(rows[0]);
  estilista.horarios = await findHorarios(id);
  return estilista;
}

async function findByUsuarioId(usuario_id, empresa_id) {
  const [rows] = await db.execute(
    `SELECT id FROM estilistas
     WHERE usuario_id = ? AND empresa_id = ? AND deleted_at IS NULL`,
    [usuario_id, empresa_id]
  );
  return rows[0] || null;
}

async function findHorarios(estilista_id) {
  const [rows] = await db.execute(
    `SELECT id, dia_semana, hora_inicio, hora_fin
     FROM horarios_estilistas
     WHERE estilista_id = ?
     ORDER BY dia_semana`,
    [estilista_id]
  );
  return rows;
}

async function createWithUsuario(data) {
  const conn = await db.getConnection();
  await conn.beginTransaction();
  try {
    const usuarioId   = uuidv4();
    const estilistaId = uuidv4();

    await conn.execute(
      `INSERT INTO usuarios (id, empresa_id, sucursal_id, nombre, email, password_hash)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [usuarioId, data.empresa_id, data.sucursal_id, data.nombre, data.email, data.password_hash]
    );

    const [[rol]] = await conn.execute(
      `SELECT id FROM roles WHERE nombre = 'estilista'`
    );
    await conn.execute(
      `INSERT INTO usuarios_roles (usuario_id, rol_id) VALUES (?, ?)`,
      [usuarioId, rol.id]
    );

    await conn.execute(
      `INSERT INTO estilistas
         (id, empresa_id, sucursal_id, usuario_id, nombre, especialidades, bio, foto_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        estilistaId, data.empresa_id, data.sucursal_id, usuarioId,
        data.nombre,
        data.especialidades ? JSON.stringify(data.especialidades) : null,
        data.bio      || null,
        data.foto_url || null
      ]
    );

    await conn.commit();
    return findById(estilistaId, data.empresa_id);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function update(id, empresa_id, data) {
  await db.execute(
    `UPDATE estilistas
     SET sucursal_id = ?, nombre = ?, especialidades = ?, bio = ?, foto_url = ?
     WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL`,
    [
      data.sucursal_id,
      data.nombre,
      data.especialidades ? JSON.stringify(data.especialidades) : null,
      data.bio      || null,
      data.foto_url || null,
      id, empresa_id
    ]
  );
  return findById(id, empresa_id);
}

async function replaceHorarios(estilista_id, horarios) {
  const conn = await db.getConnection();
  await conn.beginTransaction();
  try {
    await conn.execute(
      `DELETE FROM horarios_estilistas WHERE estilista_id = ?`,
      [estilista_id]
    );
    for (const h of horarios) {
      await conn.execute(
        `INSERT INTO horarios_estilistas (id, estilista_id, dia_semana, hora_inicio, hora_fin)
         VALUES (?, ?, ?, ?, ?)`,
        [uuidv4(), estilista_id, h.dia_semana, h.hora_inicio, h.hora_fin]
      );
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function softDelete(id, empresa_id) {
  await db.execute(
    `UPDATE estilistas SET deleted_at = NOW()
     WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL`,
    [id, empresa_id]
  );
}

// Devuelve el primer estilista activo de la sucursal que tenga disponibilidad
// para el slot solicitado (sin solapamiento de citas ni bloqueos).
async function findDisponibleParaSlot(empresa_id, sucursal_id, fecha_hora, duracion_min) {
  const dt = new Date(fecha_hora);
  const dia_semana = (dt.getUTCDay() + 6) % 7; // 0=Lun, 6=Dom
  const fechaMysql = dt.toISOString().slice(0, 19).replace('T', ' ');

  const [rows] = await db.execute(
    `SELECT e.id, e.nombre
     FROM estilistas e
     JOIN horarios_estilistas he ON he.estilista_id = e.id
     WHERE e.empresa_id = ?
       AND e.sucursal_id = ?
       AND e.activo = 1
       AND e.deleted_at IS NULL
       AND he.dia_semana = ?
       AND TIME(?) >= he.hora_inicio
       AND ADDTIME(TIME(?), SEC_TO_TIME(? * 60)) <= he.hora_fin
       AND NOT EXISTS (
         SELECT 1 FROM citas c
         WHERE c.estilista_id = e.id
           AND c.empresa_id = ?
           AND c.deleted_at IS NULL
           AND c.estado IN ('confirmada','en_proceso')
           AND c.fecha_hora < DATE_ADD(?, INTERVAL ? MINUTE)
           AND DATE_ADD(c.fecha_hora, INTERVAL c.duracion_min MINUTE) > ?
       )
       AND NOT EXISTS (
         SELECT 1 FROM bloqueos_agenda ba
         WHERE (ba.estilista_id = e.id
                OR (ba.estilista_id IS NULL AND ba.sucursal_id = e.sucursal_id))
           AND ba.deleted_at IS NULL
           AND ba.fecha_inicio < DATE_ADD(?, INTERVAL ? MINUTE)
           AND ba.fecha_fin > ?
       )
     LIMIT 1`,
    [
      empresa_id, sucursal_id, dia_semana,
      fechaMysql, fechaMysql, duracion_min,
      empresa_id, fechaMysql, duracion_min, fechaMysql,
      fechaMysql, duracion_min, fechaMysql
    ]
  );
  return rows[0] || null;
}

function parseEspecialidades(row) {
  if (row.especialidades) {
    try { row.especialidades = JSON.parse(row.especialidades); }
    catch { row.especialidades = []; }
  }
  return row;
}

module.exports = {
  findAll, findById, findByUsuarioId, findHorarios,
  createWithUsuario, update, replaceHorarios, softDelete,
  findDisponibleParaSlot
};
