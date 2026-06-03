const db = require('../config/db');

// ── Métricas globales ─────────────────────────────────────────

async function getMetricas() {
  const [[tenants], [citas], [ordenes], [usuarios]] = await Promise.all([
    db.execute(`
      SELECT
        COUNT(*)                                   AS total_tenants,
        SUM(IF(activo = 1, 1, 0))                  AS tenants_activos,
        SUM(IF(activo = 0, 1, 0))                  AS tenants_inactivos,
        SUM(IF(plan = 'basico',     1, 0))          AS plan_basico,
        SUM(IF(plan = 'pro',        1, 0))          AS plan_pro,
        SUM(IF(plan = 'enterprise', 1, 0))          AS plan_enterprise
      FROM empresas
      WHERE deleted_at IS NULL
    `),
    db.execute(`
      SELECT
        COUNT(*)                                              AS total_citas,
        SUM(IF(estado = 'completada', 1, 0))                 AS completadas,
        SUM(IF(estado = 'cancelada',  1, 0))                 AS canceladas,
        SUM(IF(estado = 'no_show',    1, 0))                 AS no_shows,
        SUM(IF(estado = 'completada', precio_final, 0))      AS ingresos_totales,
        COUNT(DISTINCT empresa_id)                           AS tenants_con_citas
      FROM citas
      WHERE deleted_at IS NULL
    `),
    db.execute(`
      SELECT
        COUNT(*)                                         AS total_ordenes,
        SUM(IF(estado = 'entregado', 1, 0))             AS entregadas,
        SUM(IF(estado = 'entregado', total, 0))         AS ingresos_ordenes
      FROM ordenes
      WHERE deleted_at IS NULL
    `),
    db.execute(`
      SELECT COUNT(*) AS total_usuarios
      FROM usuarios
      WHERE deleted_at IS NULL
    `)
  ]);

  return {
    tenants:  tenants[0],
    citas:    citas[0],
    ordenes:  ordenes[0],
    usuarios: usuarios[0]
  };
}

// ── Listado de tenants ────────────────────────────────────────

async function getEmpresas() {
  const [rows] = await db.execute(`
    SELECT
      e.id, e.nombre, e.slug, e.email_contacto, e.telefono,
      e.plan, e.activo, e.created_at,
      COUNT(DISTINCT s.id)                                         AS sucursales,
      COUNT(DISTINCT u.id)                                         AS usuarios,
      COUNT(DISTINCT c.id)                                         AS total_citas,
      SUM(IF(c.estado = 'completada', c.precio_final, 0))         AS ingresos_totales,
      MAX(c.created_at)                                            AS ultima_cita
    FROM empresas e
    LEFT JOIN sucursales s ON s.empresa_id = e.id AND s.deleted_at IS NULL
    LEFT JOIN usuarios   u ON u.empresa_id = e.id AND u.deleted_at IS NULL
    LEFT JOIN citas      c ON c.empresa_id = e.id AND c.deleted_at IS NULL
    WHERE e.deleted_at IS NULL
    GROUP BY e.id, e.nombre, e.slug, e.email_contacto, e.telefono, e.plan, e.activo, e.created_at
    ORDER BY e.created_at DESC
  `);
  return rows;
}

async function getEmpresaById(id) {
  const [[empresa], [sucursales], [citasRows], [usuariosRows], [clientesRows]] = await Promise.all([
    db.execute(
      `SELECT id, nombre, slug, logo_url, color_primario, telefono,
              email_contacto, plan, activo, created_at, updated_at
       FROM empresas WHERE id = ? AND deleted_at IS NULL`,
      [id]
    ),
    db.execute(
      `SELECT id, nombre, ciudad, activo
       FROM sucursales WHERE empresa_id = ? AND deleted_at IS NULL`,
      [id]
    ),
    db.execute(`
      SELECT
        COUNT(*)                                          AS total_citas,
        SUM(IF(estado = 'completada', precio_final, 0))  AS ingresos_totales,
        SUM(IF(estado = 'completada', 1, 0))             AS citas_completadas,
        SUM(IF(estado = 'no_show',    1, 0))             AS no_shows
      FROM citas
      WHERE empresa_id = ? AND deleted_at IS NULL
    `, [id]),
    db.execute(
      `SELECT COUNT(*) AS total_usuarios FROM usuarios WHERE empresa_id = ? AND deleted_at IS NULL`,
      [id]
    ),
    db.execute(
      `SELECT COUNT(*) AS total_clientes FROM clientes WHERE empresa_id = ? AND deleted_at IS NULL`,
      [id]
    )
  ]);

  if (!empresa[0]) return null;

  const metricas = {
    ...citasRows[0],
    total_usuarios: usuariosRows[0].total_usuarios,
    total_clientes: clientesRows[0].total_clientes
  };

  return { ...empresa[0], sucursales, metricas };
}

// ── Toggle activo ─────────────────────────────────────────────

async function toggleActivo(id) {
  await db.execute(
    `UPDATE empresas SET activo = IF(activo = 1, 0, 1) WHERE id = ? AND deleted_at IS NULL`,
    [id]
  );
  const [rows] = await db.execute(
    `SELECT id, nombre, activo FROM empresas WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
}

// ── Cambiar plan ──────────────────────────────────────────────

async function cambiarPlan(id, plan) {
  await db.execute(
    `UPDATE empresas SET plan = ? WHERE id = ? AND deleted_at IS NULL`,
    [plan, id]
  );
  const [rows] = await db.execute(
    `SELECT id, nombre, plan FROM empresas WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
}

module.exports = { getMetricas, getEmpresas, getEmpresaById, toggleActivo, cambiarPlan };
