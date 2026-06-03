const inventarioRepo = require('../repositories/inventario.repository');
const productoRepo   = require('../repositories/producto.repository');
const { AppError }   = require('../utils/errors');

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

  return inventarioRepo.ajustar(producto_id, sucursal_id, empresa_id, cantidad, stock_minimo);
}

module.exports = { listar, ajustar };
