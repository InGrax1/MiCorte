const db             = require('../config/db');
const { v4: uuidv4 } = require('uuid');

async function findAll(empresa_id, sucursal_id) {
  let sql = `
    SELECT e.id, e.empresa_id, e.sucursal_id, e.usuario_id, e.nombre,
           e.especialidades, e.bio, e.foto_url, e.activo,
           e.created_at, e.updated_at,
           s.nombre AS sucursal_nombre
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
            s.nombre AS sucursal_nombre
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

function parseEspecialidades(row) {
  if (row.especialidades) {
    try { row.especialidades = JSON.parse(row.especialidades); }
    catch { row.especialidades = []; }
  }
  return row;
}

module.exports = {
  findAll, findById, findByUsuarioId, findHorarios,
  createWithUsuario, update, replaceHorarios, softDelete
};
