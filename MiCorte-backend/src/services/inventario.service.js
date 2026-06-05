const inventarioRepo = require('../repositories/inventario.repository');
const productoRepo   = require('../repositories/producto.repository');
const { AppError }   = require('../utils/errors');

// Verifica si el stock cayó al mínimo y envía alerta al admin (non-blocking)
async function _alertarStockMinimo(producto_id, sucursal_id) {
  const info = await inventarioRepo.getInfoAlerta(producto_id, sucursal_id);
  if (!info || info.stock_actual > info.stock_minimo) return;
  const { sendStockAlerta } = require('../utils/email');
  await sendStockAlerta(info);
}

async function listar(empresa_id, filtros) {
  const bajo_minimo = filtros.bajo_minimo === 'true' || filtros.bajo_minimo === true;
  return inventarioRepo.findAll(empresa_id, { ...filtros, bajo_minimo });
}

async function ajustar(producto_id, sucursal_id, empresa_id, data) {
  // Validar que el producto pertenece al tenant
  const producto = await productoRepo.findById(producto_id, empresa_id);
  if (!producto) throw new AppError('Producto no encontrado', 404);

  const inv = await inventarioRepo.findByProductoSucursal(producto_id, sucursal_id);
  if (!inv) throw new AppError('No hay registro de inventario para ese producto en esa sucursal', 404);

  const { cantidad, stock_minimo } = data;

  // Validar que el stock no quede negativo
  if (inv.stock_actual + cantidad < 0) {
    throw new AppError(
      `Stock insuficiente. Actual: ${inv.stock_actual}, ajuste solicitado: ${cantidad}`,
      422
    );
  }

  const resultado = await inventarioRepo.ajustar(producto_id, sucursal_id, empresa_id, cantidad, stock_minimo);

  // Alerta de stock bajo (non-blocking) — solo cuando el ajuste reduce el stock
  if (cantidad < 0) {
    _alertarStockMinimo(producto_id, sucursal_id)
      .catch(err => console.error('[STOCK] Error enviando alerta:', err.message));
  }

  return resultado;
}

module.exports = { listar, ajustar };
