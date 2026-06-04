const db = require('../config/db');

// ── Helpers ───────────────────────────────────────────────────

/**
 * Construye la clausula WHERE para citas completadas de un tenant,
 * con filtros opcionales de sucursal y rango de fechas.
 * @param {string} empresa_id
 * @param {object} filtros
 * @param {string} [alias='c'] alias de la tabla citas en el query
 */
function buildCitaWhere(empresa_id, filtros, alias = 'c') {
  const conds  = [
    `${alias}.empresa_id = ?`,
    `${alias}.estado = 'completada'`,
    `${alias}.deleted_at IS NULL`
  ];
  const params = [empresa_id];

  if (filtros.sucursal_id) {
    conds.push(`${alias}.sucursal_id = ?`);
    params.push(filtros.sucursal_id);
  }
  if (filtros.fecha_inicio) {
    conds.push(`${alias}.fecha_hora >= ?`);
    params.push(filtros.fecha_inicio + ' 00:00:00');
  }
  if (filtros.fecha_fin) {
    conds.push(`${alias}.fecha_hora <= ?`);
    params.push(filtros.fecha_fin + ' 23:59:59');
  }

  return { where: conds.join(' AND '), params };
}

// ── Resumen global de retencion ───────────────────────────────

async function getResumen(empresa_id, filtros = {}) {
  const { where, params } = buildCitaWhere(empresa_id, filtros);

  const [[row]] = await db.execute(`
    SELECT
      COUNT(*)                                                              AS total_clientes_activos,
      SUM(IF(total_visitas = 1, 1, 0))                                     AS solo_una_visita,
      SUM(IF(total_visitas > 1, 1, 0))                                     AS clientes_recurrentes,
      ROUND(SUM(IF(total_visitas > 1, 1, 0)) / COUNT(*) * 100, 1)         AS tasa_retencion_pct,
      SUM(IF(dias_ultima_visita <= 30, 1, 0))                              AS clientes_activos_recientes,
      SUM(IF(dias_ultima_visita BETWEEN 31 AND 60, 1, 0))                  AS clientes_en_riesgo,
      SUM(IF(dias_ultima_visita > 60, 1, 0))                               AS clientes_perdidos,
      ROUND(AVG(promedio_gasto), 2)                                         AS ticket_promedio,
      ROUND(SUM(total_gastado), 2)                                          AS ingresos_totales
    FROM (
      SELECT
        c.cliente_id,
        COUNT(*)                            AS total_visitas,
        DATEDIFF(NOW(), MAX(c.fecha_hora))   AS dias_ultima_visita,
        SUM(c.precio_final)                 AS total_gastado,
        AVG(c.precio_final)                 AS promedio_gasto
      FROM citas c
      WHERE ${where}
      GROUP BY c.cliente_id
    ) AS stats
  `, params);
  return row;
}

// ── Clientes en riesgo de abandono ───────────────────────────

async function getEnRiesgo(empresa_id, filtros = {}) {
  // Numeros validados — se interpolan directamente para evitar el bug de
  // mysql2 con LIMIT/HAVING en prepared statements (ER_WRONG_ARGUMENTS)
  const dias   = parseInt(filtros.dias   || 30, 10);
  const limite = parseInt(filtros.limite || 50, 10);

  const joinConds = [
    `c.empresa_id = ?`,
    `c.estado = 'completada'`,
    `c.deleted_at IS NULL`
  ];
  const params = [empresa_id];

  if (filtros.sucursal_id) {
    joinConds.push(`c.sucursal_id = ?`);
    params.push(filtros.sucursal_id);
  }

  params.push(empresa_id);

  const [rows] = await db.execute(`
    SELECT
      cl.id,
      cl.nombre,
      cl.email,
      cl.telefono,
      DATE_FORMAT(MAX(c.fecha_hora), '%Y-%m-%d') AS ultima_visita,
      DATEDIFF(NOW(), MAX(c.fecha_hora))          AS dias_sin_visita,
      COUNT(c.id)                                 AS total_visitas,
      ROUND(SUM(c.precio_final), 2)               AS total_gastado
    FROM clientes cl
    JOIN citas c ON c.cliente_id = cl.id AND ${joinConds.join(' AND ')}
    WHERE cl.empresa_id = ? AND cl.deleted_at IS NULL
    GROUP BY cl.id, cl.nombre, cl.email, cl.telefono
    HAVING DATEDIFF(NOW(), MAX(c.fecha_hora)) >= ${dias}
    ORDER BY dias_sin_visita DESC
    LIMIT ${limite}
  `, params);
  return rows;
}

// ── Top clientes por gasto o visitas ─────────────────────────

async function getTopClientes(empresa_id, filtros = {}) {
  const limite = parseInt(filtros.limite || 20, 10);
  // whitelist para ORDER BY dinamico; LIMIT se interpola (bug mysql2 con prepared stmts)
  const orden  = filtros.orden === 'visitas' ? 'total_visitas' : 'total_gastado';

  const joinConds = [
    `c.empresa_id = ?`,
    `c.estado = 'completada'`,
    `c.deleted_at IS NULL`
  ];
  const params = [empresa_id];

  if (filtros.sucursal_id) {
    joinConds.push(`c.sucursal_id = ?`);
    params.push(filtros.sucursal_id);
  }
  if (filtros.fecha_inicio) {
    joinConds.push(`c.fecha_hora >= ?`);
    params.push(filtros.fecha_inicio + ' 00:00:00');
  }
  if (filtros.fecha_fin) {
    joinConds.push(`c.fecha_hora <= ?`);
    params.push(filtros.fecha_fin + ' 23:59:59');
  }

  params.push(empresa_id);

  const [rows] = await db.execute(`
    SELECT
      cl.id,
      cl.nombre,
      cl.email,
      cl.telefono,
      COUNT(c.id)                                                     AS total_visitas,
      ROUND(SUM(c.precio_final), 2)                                   AS total_gastado,
      ROUND(AVG(c.precio_final), 2)                                   AS ticket_promedio,
      DATE_FORMAT(MIN(c.fecha_hora), '%Y-%m-%d')                      AS primera_visita,
      DATE_FORMAT(MAX(c.fecha_hora), '%Y-%m-%d')                      AS ultima_visita,
      DATEDIFF(NOW(), MAX(c.fecha_hora))                              AS dias_sin_visita,
      ROUND(
        DATEDIFF(MAX(c.fecha_hora), MIN(c.fecha_hora)) /
        NULLIF(COUNT(c.id) - 1, 0)
      , 0)                                                            AS dias_entre_visitas
    FROM clientes cl
    JOIN citas c ON c.cliente_id = cl.id AND ${joinConds.join(' AND ')}
    WHERE cl.empresa_id = ? AND cl.deleted_at IS NULL
    GROUP BY cl.id, cl.nombre, cl.email, cl.telefono
    ORDER BY ${orden} DESC
    LIMIT ${limite}
  `, params);
  return rows;
}

// ── Cohortes mensuales ────────────────────────────────────────

async function getCohortes(empresa_id, filtros = {}) {
  const params = [empresa_id];
  let extra = '';

  if (filtros.sucursal_id) {
    extra += ` AND c.sucursal_id = ?`;
    params.push(filtros.sucursal_id);
  }

  const [rows] = await db.execute(`
    SELECT
      DATE_FORMAT(primera_visita, '%Y-%m')                                   AS cohort_mes,
      COUNT(*)                                                                AS nuevos_clientes,
      SUM(IF(total_visitas >= 2, 1, 0))                                      AS regresaron,
      ROUND(SUM(IF(total_visitas >= 2, 1, 0)) / COUNT(*) * 100, 1)          AS tasa_retorno_pct,
      ROUND(AVG(total_visitas), 1)                                            AS promedio_visitas,
      ROUND(AVG(total_gastado), 2)                                            AS ltv_promedio
    FROM (
      SELECT
        c.cliente_id,
        MIN(c.fecha_hora)   AS primera_visita,
        COUNT(*)            AS total_visitas,
        SUM(c.precio_final) AS total_gastado
      FROM citas c
      WHERE c.empresa_id = ?
        AND c.estado = 'completada'
        AND c.deleted_at IS NULL${extra}
      GROUP BY c.cliente_id
    ) AS stats
    GROUP BY cohort_mes
    ORDER BY cohort_mes DESC
    LIMIT 12
  `, params);
  return rows;
}

module.exports = { getResumen, getEnRiesgo, getTopClientes, getCohortes };
