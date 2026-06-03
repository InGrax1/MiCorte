const pagoOrdenRepo = require('../repositories/pagoOrden.repository');
const ordenRepo     = require('../repositories/orden.repository');
const { AppError }  = require('../utils/errors');

async function obtenerPorOrden(orden_id, empresa_id) {
  const pago = await pagoOrdenRepo.findByOrdenId(orden_id, empresa_id);
  if (!pago) throw new AppError('Pago no encontrado para esta orden', 404);
  return pago;
}

async function confirmarEfectivo(orden_id, empresa_id) {
  const orden = await ordenRepo.findById(orden_id, empresa_id);
  if (!orden) throw new AppError('Orden no encontrada', 404);

  const pago = await pagoOrdenRepo.findByOrdenId(orden_id, empresa_id);
  if (!pago)              throw new AppError('Pago no encontrado para esta orden', 404);
  if (pago.estado === 'pagado') throw new AppError('El pago ya fue confirmado', 409);

  await pagoOrdenRepo.marcarPagado(orden_id, null);
  // Al confirmar efectivo, la orden pasa a procesando
  await ordenRepo.updateEstado(orden_id, empresa_id, 'procesando');

  return pagoOrdenRepo.findByOrdenId(orden_id, empresa_id);
}

module.exports = { obtenerPorOrden, confirmarEfectivo };
