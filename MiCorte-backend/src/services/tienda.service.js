const db             = require('../config/db');
const tiendaRepo     = require('../repositories/tienda.repository');
const inventarioRepo = require('../repositories/inventario.repository');
const ordenRepo      = require('../repositories/orden.repository');
const pagoOrdenRepo  = require('../repositories/pagoOrden.repository');
const { AppError }   = require('../utils/errors');

async function getSucursalInfo(sucursal_id) {
  const sucursal = await tiendaRepo.getSucursalInfo(sucursal_id);
  if (!sucursal) throw new AppError('Sucursal no encontrada', 404);
  return sucursal;
}

async function getCategorias(sucursal_id) {
  const sucursal = await tiendaRepo.getSucursalInfo(sucursal_id);
  if (!sucursal) throw new AppError('Sucursal no encontrada', 404);
  return tiendaRepo.getCategorias(sucursal.empresa_id, sucursal_id);
}

async function getCatalogo(sucursal_id, filtros) {
  const sucursal = await tiendaRepo.getSucursalInfo(sucursal_id);
  if (!sucursal) throw new AppError('Sucursal no encontrada', 404);
  const productos = await tiendaRepo.getCatalogo(sucursal_id, sucursal.empresa_id, filtros);
  return { sucursal, productos };
}

async function crearOrden(sucursal_id, data) {
  const { nombre, email, telefono, items, tipo_entrega, direccion_envio, notas } = data;

  // 1. Resolver tenant
  const sucursal = await tiendaRepo.getSucursalInfo(sucursal_id);
  if (!sucursal) throw new AppError('Sucursal no encontrada', 404);
  const { empresa_id } = sucursal;

  // 2. Obtener catalogo actual y validar items
  const catalogo = await tiendaRepo.getCatalogo(sucursal_id, empresa_id);
  const byId = Object.fromEntries(catalogo.map(p => [p.id, p]));

  const itemsCompletos = [];
  for (const item of items) {
    const producto = byId[item.producto_id];
    if (!producto) throw new AppError(`Producto no disponible en esta sucursal`, 422);
    if (item.cantidad > producto.stock) {
      throw new AppError(`Stock insuficiente para "${producto.nombre}". Disponible: ${producto.stock}`, 422);
    }
    itemsCompletos.push({
      producto_id: item.producto_id,
      cantidad:    item.cantidad,
      precio_unit: producto.precio,
      subtotal:    parseFloat((producto.precio * item.cantidad).toFixed(2))
    });
  }

  // 3. Buscar o crear cliente por email
  const cliente = await tiendaRepo.findOrCreateCliente(email, nombre, telefono, empresa_id);

  // 4. Calcular totales
  const costo_envio = tipo_entrega === 'envio'
    ? parseFloat(process.env.COSTO_ENVIO_DEFAULT || '0')
    : 0;
  const subtotal = parseFloat(itemsCompletos.reduce((s, i) => s + i.subtotal, 0).toFixed(2));
  const total    = parseFloat((subtotal + costo_envio).toFixed(2));

  // 5. Transaccion: crear orden + items + descontar stock + crear pago pendiente
  const conn = await db.getConnection();
  await conn.beginTransaction();
  try {
    const orden_id = await ordenRepo.createConItems(conn, empresa_id, {
      sucursal_id,
      cliente_id:      cliente.id,
      tipo_entrega,
      metodo_pago:     'efectivo',
      subtotal,
      costo_envio,
      descuento:       0,
      total,
      direccion_envio: direccion_envio || null,
      notas:           notas || null
    }, itemsCompletos);

    for (const item of itemsCompletos) {
      await inventarioRepo.descontar(conn, item.producto_id, sucursal_id, empresa_id, item.cantidad);
    }

    await pagoOrdenRepo.createConn(conn, { orden_id, empresa_id, monto: total, metodo: 'efectivo' });

    await conn.commit();

    // Alertas de stock bajo (non-blocking)
    Promise.all(
      itemsCompletos.map(item =>
        inventarioRepo.getInfoAlerta(item.producto_id, sucursal_id).then(info => {
          if (info && info.stock_actual <= info.stock_minimo && info.admin_email) {
            const { sendStockAlerta } = require('../utils/email');
            return sendStockAlerta(info);
          }
        })
      )
    ).catch(err => console.error('[TIENDA] Error alertas stock:', err.message));

    return {
      orden_id,
      total,
      sucursal_nombre: sucursal.nombre,
      cliente_nombre:  cliente.nombre,
      tipo_entrega
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { getSucursalInfo, getCatalogo, getCategorias, crearOrden };
