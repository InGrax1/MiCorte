const db = require('../config/db');

async function getEmpresaId(sucursal_id) {
  const [rows] = await db.execute(
    `SELECT empresa_id, nombre FROM sucursales
     WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
    [sucursal_id]
  );
  return rows[0] || null;
}

async function findClienteByEmail(email, empresa_id) {
  const [rows] = await db.execute(
    `SELECT id, empresa_id, nombre, email, telefono,
            puntos_acumulados, fecha_nacimiento, activo
     FROM clientes
     WHERE email = ? AND empresa_id = ? AND deleted_at IS NULL LIMIT 1`,
    [email, empresa_id]
  );
  return rows[0] || null;
}

async function findClienteById(id, empresa_id) {
  const [rows] = await db.execute(
    `SELECT id, empresa_id, nombre, email, telefono,
            puntos_acumulados, fecha_nacimiento, activo, created_at
     FROM clientes
     WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL LIMIT 1`,
    [id, empresa_id]
  );
  return rows[0] || null;
}

async function getMisCitas(cliente_id, empresa_id) {
  const [rows] = await db.execute(
    `SELECT c.id, c.fecha_hora, c.estado, c.precio_final, c.duracion_min, c.notas_cliente,
            sv.nombre AS servicio_nombre,
            e.nombre  AS estilista_nombre,
            s.nombre  AS sucursal_nombre
     FROM citas c
     JOIN servicios  sv ON sv.id = c.servicio_id
     JOIN estilistas e  ON e.id  = c.estilista_id
     JOIN sucursales s  ON s.id  = c.sucursal_id
     WHERE c.cliente_id = ? AND c.empresa_id = ? AND c.deleted_at IS NULL
     ORDER BY c.fecha_hora DESC
     LIMIT 50`,
    [cliente_id, empresa_id]
  );
  return rows;
}

async function getMisOrdenes(cliente_id, empresa_id) {
  const [rows] = await db.execute(
    `SELECT o.id, o.created_at, o.estado, o.total, o.tipo_entrega, o.metodo_pago,
            s.nombre AS sucursal_nombre,
            (SELECT COUNT(*) FROM orden_items oi WHERE oi.orden_id = o.id) AS items_count
     FROM ordenes o
     JOIN sucursales s ON s.id = o.sucursal_id
     WHERE o.cliente_id = ? AND o.empresa_id = ? AND o.deleted_at IS NULL
     ORDER BY o.created_at DESC
     LIMIT 50`,
    [cliente_id, empresa_id]
  );
  return rows;
}

async function getMisMovimientos(cliente_id, empresa_id) {
  const [rows] = await db.execute(
    `SELECT id, tipo, puntos, descripcion, origen_tipo, created_at
     FROM movimientos_puntos
     WHERE cliente_id = ? AND empresa_id = ?
     ORDER BY created_at DESC
     LIMIT 100`,
    [cliente_id, empresa_id]
  );
  return rows;
}

async function saveOtp(cliente_id, codigo) {
  await db.execute(
    `UPDATE clientes
     SET otp_codigo = ?, otp_expires_at = DATE_ADD(NOW(), INTERVAL 10 MINUTE)
     WHERE id = ? AND deleted_at IS NULL`,
    [codigo, cliente_id]
  );
}

async function findByEmailAndOtp(email, empresa_id, codigo) {
  const [rows] = await db.execute(
    `SELECT id, empresa_id, nombre, email, telefono, puntos_acumulados, fecha_nacimiento, activo
     FROM clientes
     WHERE email = ? AND empresa_id = ? AND otp_codigo = ?
       AND otp_expires_at > NOW() AND deleted_at IS NULL LIMIT 1`,
    [email, empresa_id, codigo]
  );
  return rows[0] || null;
}

async function clearOtp(cliente_id) {
  await db.execute(
    `UPDATE clientes SET otp_codigo = NULL, otp_expires_at = NULL WHERE id = ?`,
    [cliente_id]
  );
}

module.exports = {
  getEmpresaId, findClienteByEmail, findClienteById,
  getMisCitas, getMisOrdenes, getMisMovimientos,
  saveOtp, findByEmailAndOtp, clearOtp,
};
