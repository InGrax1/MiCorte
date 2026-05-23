/**
 * usuario.repository.js
 * Solo habla con MySQL. Sin lógica de negocio.
 * Cada método recibe empresa_id para garantizar el aislamiento de tenant.
 */
const db = require('../config/db');

/**
 * Busca un usuario por email (para login).
 * Incluye el rol vía JOIN para tenerlo disponible en el token.
 * No filtra por empresa_id aquí: el email es único global en la tabla usuarios
 * pero sí lo devolvemos para que el service pueda validar el tenant.
 */
async function findByEmail(email) {
  const [rows] = await db.execute(
    `SELECT
        u.id,
        u.empresa_id,
        u.sucursal_id,
        u.nombre,
        u.email,
        u.password_hash,
        u.activo,
        GROUP_CONCAT(r.nombre) AS roles
     FROM usuarios u
     LEFT JOIN usuarios_roles ur ON ur.usuario_id = u.id
     LEFT JOIN roles r           ON r.id = ur.rol_id
     WHERE u.email = ?
       AND u.deleted_at IS NULL
     GROUP BY u.id`,
    [email]
  );
  return rows[0] || null;
}

/**
 * Busca un usuario por ID.
 * Siempre filtra por empresa_id (tenant guard).
 */
async function findById(id, empresa_id) {
  const [rows] = await db.execute(
    `SELECT
        u.id,
        u.empresa_id,
        u.sucursal_id,
        u.nombre,
        u.email,
        u.activo,
        GROUP_CONCAT(r.nombre) AS roles
     FROM usuarios u
     LEFT JOIN usuarios_roles ur ON ur.usuario_id = u.id
     LEFT JOIN roles r           ON r.id = ur.rol_id
     WHERE u.id = ?
       AND u.empresa_id = ?
       AND u.deleted_at IS NULL
     GROUP BY u.id`,
    [id, empresa_id]
  );
  return rows[0] || null;
}

/**
 * Actualiza la fecha de último login.
 */
async function updateLastLogin(id) {
  await db.execute(
    `UPDATE usuarios SET ultimo_login = NOW() WHERE id = ?`,
    [id]
  );
}

module.exports = { findByEmail, findById, updateLastLogin };
