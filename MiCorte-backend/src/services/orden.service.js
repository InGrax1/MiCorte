const db              = require('../config/db');
const ordenRepo       = require('../repositories/orden.repository');
const pagoOrdenRepo   = require('../repositories/pagoOrden.repository');
const inventarioRepo  = require('../repositories/inventario.repository');
const productoRepo    = require('../repositories/producto.repository');
const lealtadRepo     = require('../repositories/lealtad.repository');
const clienteRepo     = require('../repositories/cliente.repository');
const { AppError }    = require('../utils/errors');

// Puntos por cada peso MXN gastado (configurable via .env)
const PUNTOS_POR_PESO = parseFloat(process.env.PUNTOS_POR_PESO || '0.1');

// Máquina de estados de órdenes
const TRANSITIONS = {
  pendiente:   ['procesando', 'cancelado'],
  procesando:  ['enviado',    'cancelado'],
  enviado:     ['entregado',  'cancelado'],
  entregado:   [],
  cancelado:   []
};

async function listar(empresa_id, filtros) {
  return ordenRepo.findAll(empresa_id, filtros);
}

async function obtener(id, empresa_id) {
  const orden = await ordenRepo.findById(id, empresa_id);
  if (!orden) throw new AppError('Orden no encontrada', 404);
  const items = await ordenRepo.findItems(id);
  return { ...orden, items };
}

async function crear(empresa_id, data) {
  const { sucursal_id, cliente_id, items, tipo_entrega, metodo_pago,
          costo_envio = 0, descuento = 0, direccion_envio, notas } = data;

  // 1. Validar cliente
  const cliente = await clienteRepo.findById(cliente_id, empresa_id);
  if (!cliente) throw new AppError('Cliente no encontrado', 404);

  // 2. Validar cada producto, calcular precios y verificar stock
  const itemsCompletos = [];
  for (const item of items) {
    const producto = await productoRepo.findById(item.producto_id, empresa_id);
    if (!producto) throw new AppError(`Producto ${item.producto_id} no encontrado`, 404);
    if (!producto.activo) throw new AppError(`El producto "${producto.nombre}" no está disponible`, 422);
    itemsCompletos.push({
      producto_id: item.producto_id,
      cantidad:    item.cantidad,
      precio_unit: producto.precio,
      subtotal:    parseFloat((producto.precio * item.cantidad).toFixed(2))
    });
  }

  // 3. Validar stock para todos los items en la sucursal
  const faltantes = await inventarioRepo.validarStock(sucursal_id, empresa_id, itemsCompletos);
  if (faltantes.length > 0) {
    throw new AppError(
      `Stock insuficiente para ${faltantes.length} producto(s)`,
      422,
      faltantes
    );
  }

  // 4. Calcular totales
  const subtotal = parseFloat(itemsCompletos.reduce((s, i) => s + i.subtotal, 0).toFixed(2));
  const total    = parseFloat((subtotal + costo_envio - descuento).toFixed(2));

  // 5. Transacción: crear orden + items + descontar stock + crear pago
  const conn = await db.getConnection();
  await conn.beginTransaction();
  try {
    const orden_id = await ordenRepo.createConItems(conn, empresa_id, {
      sucursal_id, cliente_id, tipo_entrega, metodo_pago,
      subtotal, costo_envio, descuento, total,
      direccion_envio, notas
    }, itemsCompletos);

    // Descontar inventario
    for (const item of itemsCompletos) {
      await inventarioRepo.descontar(conn, item.producto_id, sucursal_id, empresa_id, item.cantidad);
    }

    // Crear pago pendiente
    await pagoOrdenRepo.createConn(conn, { orden_id, empresa_id, monto: total, metodo: metodo_pago });

    await conn.commit();

    return obtener(orden_id, empresa_id);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function cambiarEstado(id, empresa_id, nuevoEstado) {
  const orden = await ordenRepo.findById(id, empresa_id);
  if (!orden) throw new AppError('Orden no encontrada', 404);

  const permitidos = TRANSITIONS[orden.estado] || [];
  if (!permitidos.includes(nuevoEstado)) {
    throw new AppError(
      `No se puede cambiar de '${orden.estado}' a '${nuevoEstado}'`,
      422
    );
  }

  // Si se cancela, reponer stock
  if (nuevoEstado === 'cancelado') {
    const items = await ordenRepo.findItems(id);
    const conn  = await db.getConnection();
    await conn.beginTransaction();
    try {
      for (const item of items) {
        await inventarioRepo.reponer(conn, item.producto_id, orden.sucursal_id, empresa_id, item.cantidad);
      }
      await ordenRepo.updateEstadoConn(conn, id, empresa_id, nuevoEstado);

      // Marcar pago como reembolsado si estaba pagado
      const pago = await pagoOrdenRepo.findByOrdenId(id, empresa_id);
      if (pago && pago.estado === 'pagado') {
        await conn.execute(
          `UPDATE pagos_orden SET estado = 'reembolsado' WHERE orden_id = ?`,
          [id]
        );
      }

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } else {
    await ordenRepo.updateEstado(id, empresa_id, nuevoEstado);
  }

  // Si se entrega, acumular puntos (non-blocking)
  if (nuevoEstado === 'entregado') {
    const ordenActualizada = await ordenRepo.findById(id, empresa_id);
    _acumularPuntosOrden(ordenActualizada).catch(err =>
      console.error('[LEALTAD] Error acumulando puntos por orden:', err.message)
    );
  }

  return obtener(id, empresa_id);
}

async function _acumularPuntosOrden(orden) {
  const puntos = Math.floor(orden.total * PUNTOS_POR_PESO);
  if (puntos <= 0) return;

  await lealtadRepo.registrarMovimiento({
    empresa_id:  orden.empresa_id,
    cliente_id:  orden.cliente_id,
    tipo:        'acumulacion',
    puntos,
    origen_tipo: 'orden',
    origen_id:   orden.id,
    descripcion: `Compra entregada — Orden ${orden.id.slice(0, 8)}`
  });
  await lealtadRepo.actualizarPuntos(orden.cliente_id, orden.empresa_id, puntos);
}

module.exports = { listar, obtener, crear, cambiarEstado };
