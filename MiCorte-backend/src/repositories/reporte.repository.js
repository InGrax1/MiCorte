const db = require('../config/db');

// ── Ingresos ──────────────────────────────────────────────────
// Ingresos por citas completadas, agrupados por servicio y estilista
async function getIngresos(empresa_id, { fecha_inicio, fecha_fin, sucursal_id }) {
  let sql = `
    SELECT
      DATE(c.fecha_hora)         AS fecha,
      suc.nombre                 AS sucursal,
      e.nombre                   AS estilista,
      s.nombre                   AS servicio,
      COUNT(c.id)                AS total_citas,
      SUM(c.precio_final)        AS ingresos,
      SUM(c.descuento)           AS descuentos,
      SUM(c.precio_final - c.descuento) AS ingresos_netos
    FROM citas c
    JOIN sucursales suc ON suc.id = c.sucursal_id
    JOIN estilistas e   ON e.id   = c.estilista_id
    JOIN servicios  s   ON s.id   = c.servicio_id
    WHERE c.empresa_id = ?
      AND c.estado     = 'completada'
      AND c.deleted_at IS NULL`;
  const params = [empresa_id];

  if (fecha_inicio) { sql += ` AND c.fecha_hora >= ?`; params.push(fecha_inicio); }
  if (fecha_fin)    { sql += ` AND c.fecha_hora <= ?`; params.push(fecha_fin); }
  if (sucursal_id)  { sql += ` AND c.sucursal_id = ?`; params.push(sucursal_id); }

  sql += ` GROUP BY DATE(c.fecha_hora), c.sucursal_id, c.estilista_id, c.servicio_id
           ORDER BY fecha DESC, ingresos DESC`;

  const [rows] = await db.execute(sql, params);
  return rows;
}

async function getIngresosResumen(empresa_id, { fecha_inicio, fecha_fin, sucursal_id }) {
  let sql = `
    SELECT
      COUNT(c.id)                          AS total_citas,
      SUM(c.precio_final)                  AS ingresos_brutos,
      SUM(c.descuento)                     AS total_descuentos,
      SUM(c.precio_final - c.descuento)    AS ingresos_netos,
      AVG(c.precio_final)                  AS ticket_promedio
    FROM citas c
    WHERE c.empresa_id = ?
      AND c.estado     = 'completada'
      AND c.deleted_at IS NULL`;
  const params = [empresa_id];

  if (fecha_inicio) { sql += ` AND c.fecha_hora >= ?`; params.push(fecha_inicio); }
  if (fecha_fin)    { sql += ` AND c.fecha_hora <= ?`; params.push(fecha_fin); }
  if (sucursal_id)  { sql += ` AND c.sucursal_id = ?`; params.push(sucursal_id); }

  const [rows] = await db.execute(sql, params);
  return rows[0];
}

// ── Citas del día/rango ───────────────────────────────────────
async function getCitas(empresa_id, { fecha, sucursal_id, estilista_id }) {
  let sql = `
    SELECT
      c.id,
      DATE_FORMAT(c.fecha_hora, '%H:%i') AS hora,
      DATE(c.fecha_hora)                 AS fecha,
      cl.nombre                          AS cliente,
      cl.telefono                        AS cliente_telefono,
      e.nombre                           AS estilista,
      s.nombre                           AS servicio,
      c.duracion_min,
      c.precio_final,
      c.metodo_pago,
      c.estado,
      suc.nombre                         AS sucursal
    FROM citas c
    JOIN clientes   cl  ON cl.id  = c.cliente_id
    JOIN estilistas e   ON e.id   = c.estilista_id
    JOIN servicios  s   ON s.id   = c.servicio_id
    JOIN sucursales suc ON suc.id = c.sucursal_id
    WHERE c.empresa_id  = ?
      AND c.deleted_at  IS NULL`;
  const params = [empresa_id];

  if (fecha) {
    sql += ` AND DATE(c.fecha_hora) = ?`;
    params.push(fecha);
  }
  if (sucursal_id)  { sql += ` AND c.sucursal_id  = ?`; params.push(sucursal_id); }
  if (estilista_id) { sql += ` AND c.estilista_id = ?`; params.push(estilista_id); }

  sql += ` ORDER BY c.fecha_hora ASC`;

  const [rows] = await db.execute(sql, params);
  return rows;
}

// ── Inventario con valuación ──────────────────────────────────
async function getInventario(empresa_id, { sucursal_id }) {
  let sql = `
    SELECT
      suc.nombre                             AS sucursal,
      c.nombre                               AS categoria,
      p.nombre                               AS producto,
      p.sku,
      p.marca,
      p.precio                               AS precio_unitario,
      i.stock_actual,
      i.stock_minimo,
      (i.stock_actual * p.precio)            AS valuacion,
      IF(i.stock_actual <= i.stock_minimo, 'BAJO', 'OK') AS alerta
    FROM inventario i
    JOIN productos          p   ON p.id   = i.producto_id
    JOIN categorias_producto c  ON c.id   = p.categoria_id
    JOIN sucursales         suc ON suc.id = i.sucursal_id
    WHERE i.empresa_id  = ?
      AND p.deleted_at  IS NULL
      AND p.activo      = 1`;
  const params = [empresa_id];

  if (sucursal_id) { sql += ` AND i.sucursal_id = ?`; params.push(sucursal_id); }

  sql += ` ORDER BY suc.nombre, c.nombre, p.nombre`;

  const [rows] = await db.execute(sql, params);
  return rows;
}

async function getInventarioResumen(empresa_id, { sucursal_id }) {
  let sql = `
    SELECT
      COUNT(i.id)                       AS total_productos,
      SUM(i.stock_actual * p.precio)    AS valuacion_total,
      SUM(IF(i.stock_actual <= i.stock_minimo, 1, 0)) AS productos_bajo_minimo
    FROM inventario i
    JOIN productos p ON p.id = i.producto_id
    WHERE i.empresa_id = ? AND p.deleted_at IS NULL AND p.activo = 1`;
  const params = [empresa_id];

  if (sucursal_id) { sql += ` AND i.sucursal_id = ?`; params.push(sucursal_id); }

  const [rows] = await db.execute(sql, params);
  return rows[0];
}

// ── No-shows y cancelaciones ──────────────────────────────────
async function getNoShows(empresa_id, { fecha_inicio, fecha_fin, sucursal_id }) {
  let sql = `
    SELECT
      DATE(c.fecha_hora)  AS fecha,
      suc.nombre          AS sucursal,
      e.nombre            AS estilista,
      cl.nombre           AS cliente,
      cl.telefono         AS cliente_telefono,
      s.nombre            AS servicio,
      c.estado,
      c.precio_final      AS ingreso_perdido
    FROM citas c
    JOIN sucursales suc ON suc.id = c.sucursal_id
    JOIN estilistas e   ON e.id   = c.estilista_id
    JOIN clientes   cl  ON cl.id  = c.cliente_id
    JOIN servicios  s   ON s.id   = c.servicio_id
    WHERE c.empresa_id = ?
      AND c.estado     IN ('no_show', 'cancelada')
      AND c.deleted_at IS NULL`;
  const params = [empresa_id];

  if (fecha_inicio) { sql += ` AND c.fecha_hora >= ?`; params.push(fecha_inicio); }
  if (fecha_fin)    { sql += ` AND c.fecha_hora <= ?`; params.push(fecha_fin); }
  if (sucursal_id)  { sql += ` AND c.sucursal_id = ?`; params.push(sucursal_id); }

  sql += ` ORDER BY fecha DESC`;

  const [rows] = await db.execute(sql, params);
  return rows;
}

async function getNoShowsResumen(empresa_id, { fecha_inicio, fecha_fin, sucursal_id }) {
  let sql = `
    SELECT
      COUNT(*)                                           AS total,
      SUM(IF(estado = 'no_show',  1, 0))                AS no_shows,
      SUM(IF(estado = 'cancelada', 1, 0))               AS canceladas,
      SUM(precio_final)                                  AS ingresos_perdidos
    FROM citas
    WHERE empresa_id = ?
      AND estado IN ('no_show', 'cancelada')
      AND deleted_at IS NULL`;
  const params = [empresa_id];

  if (fecha_inicio) { sql += ` AND fecha_hora >= ?`; params.push(fecha_inicio); }
  if (fecha_fin)    { sql += ` AND fecha_hora <= ?`; params.push(fecha_fin); }
  if (sucursal_id)  { sql += ` AND sucursal_id = ?`; params.push(sucursal_id); }

  const [rows] = await db.execute(sql, params);
  return rows[0];
}

// ── Rendimiento por estilista ─────────────────────────────────
async function getEstilistas(empresa_id, { fecha_inicio, fecha_fin, sucursal_id }) {
  let sql = `
    SELECT
      e.nombre                                              AS estilista,
      suc.nombre                                            AS sucursal,
      COUNT(c.id)                                           AS total_citas,
      SUM(IF(c.estado = 'completada', 1, 0))               AS completadas,
      SUM(IF(c.estado = 'no_show',   1, 0))                AS no_shows,
      SUM(IF(c.estado = 'cancelada', 1, 0))                AS canceladas,
      SUM(IF(c.estado = 'completada', c.precio_final, 0))  AS ingresos_generados,
      ROUND(
        SUM(IF(c.estado = 'no_show', 1, 0)) * 100.0 / NULLIF(COUNT(c.id), 0)
      , 1)                                                  AS tasa_no_show_pct
    FROM citas c
    JOIN estilistas e   ON e.id   = c.estilista_id
    JOIN sucursales suc ON suc.id = c.sucursal_id
    WHERE c.empresa_id  = ?
      AND c.deleted_at  IS NULL`;
  const params = [empresa_id];

  if (fecha_inicio) { sql += ` AND c.fecha_hora >= ?`; params.push(fecha_inicio); }
  if (fecha_fin)    { sql += ` AND c.fecha_hora <= ?`; params.push(fecha_fin); }
  if (sucursal_id)  { sql += ` AND c.sucursal_id = ?`; params.push(sucursal_id); }

  sql += ` GROUP BY c.estilista_id, c.sucursal_id
           ORDER BY ingresos_generados DESC`;

  const [rows] = await db.execute(sql, params);
  return rows;
}

module.exports = {
  getIngresos, getIngresosResumen,
  getCitas,
  getInventario, getInventarioResumen,
  getNoShows, getNoShowsResumen,
  getEstilistas
};
