const db = require('../config/db');

async function getKpis(empresa_id, sucursal_id) {
  const params = [empresa_id];
  let sucursalFilter = '';
  if (sucursal_id) {
    sucursalFilter = ' AND c.sucursal_id = ?';
    params.push(sucursal_id);
  }

  // Citas del día (confirmadas + en_proceso + completadas)
  const [citasHoy] = await db.execute(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN c.estado = 'completada'  THEN 1 ELSE 0 END) AS completadas,
       SUM(CASE WHEN c.estado IN ('confirmada','en_proceso') THEN 1 ELSE 0 END) AS pendientes,
       COALESCE(SUM(CASE WHEN c.estado = 'completada' THEN c.precio_final ELSE 0 END), 0) AS ingresos
     FROM citas c
     WHERE c.empresa_id = ?
       AND DATE(c.fecha_hora) = CURDATE()
       AND c.estado NOT IN ('cancelada','no_show')
       AND c.deleted_at IS NULL${sucursalFilter}`,
    params
  );

  // Estilista con más citas hoy
  const paramsEstilista = [empresa_id];
  let sucursalFilterEstilista = '';
  if (sucursal_id) {
    sucursalFilterEstilista = ' AND c.sucursal_id = ?';
    paramsEstilista.push(sucursal_id);
  }
  const [topEstilista] = await db.execute(
    `SELECT e.nombre AS estilista_nombre, COUNT(c.id) AS total_citas
     FROM citas c
     JOIN estilistas e ON e.id = c.estilista_id
     WHERE c.empresa_id = ?
       AND DATE(c.fecha_hora) = CURDATE()
       AND c.estado NOT IN ('cancelada','no_show')
       AND c.deleted_at IS NULL${sucursalFilterEstilista}
     GROUP BY c.estilista_id, e.nombre
     ORDER BY total_citas DESC
     LIMIT 1`,
    paramsEstilista
  );

  // Productos vendidos hoy (órdenes en estado procesando/enviado/entregado)
  const paramsOrden = [empresa_id];
  let sucursalFilterOrden = '';
  if (sucursal_id) {
    sucursalFilterOrden = ' AND o.sucursal_id = ?';
    paramsOrden.push(sucursal_id);
  }
  const [productosHoy] = await db.execute(
    `SELECT COALESCE(SUM(oi.cantidad), 0) AS total_productos,
            COALESCE(SUM(o.total), 0)     AS ingresos_tienda
     FROM ordenes o
     JOIN orden_items oi ON oi.orden_id = o.id
     WHERE o.empresa_id = ?
       AND DATE(o.created_at) = CURDATE()
       AND o.estado IN ('procesando','enviado','entregado')
       AND o.deleted_at IS NULL${sucursalFilterOrden}`,
    paramsOrden
  );

  // Nuevos clientes en el mes actual
  const [clientesMes] = await db.execute(
    `SELECT COUNT(*) AS total
     FROM clientes
     WHERE empresa_id = ?
       AND YEAR(created_at) = YEAR(CURDATE())
       AND MONTH(created_at) = MONTH(CURDATE())
       AND deleted_at IS NULL`,
    [empresa_id]
  );

  const citas = citasHoy[0];
  const productos = productosHoy[0];

  return {
    citas_hoy:              Number(citas.total),
    citas_completadas_hoy:  Number(citas.completadas),
    citas_pendientes_hoy:   Number(citas.pendientes),
    ingresos_citas_hoy:     Number(citas.ingresos),
    ingresos_tienda_hoy:    Number(productos.ingresos_tienda),
    productos_vendidos_hoy: Number(productos.total_productos),
    estilista_top_hoy:      topEstilista[0] || null,
    nuevos_clientes_mes:    Number(clientesMes[0].total)
  };
}

module.exports = { getKpis };
