const lealtadRepo  = require('../repositories/lealtad.repository');
const clienteRepo  = require('../repositories/cliente.repository');
const { AppError } = require('../utils/errors');

async function obtenerPorCliente(cliente_id, empresa_id) {
  const cliente = await clienteRepo.findById(cliente_id, empresa_id);
  if (!cliente) throw new AppError('Cliente no encontrado', 404);

  const movimientos = await lealtadRepo.findMovimientos(cliente_id, empresa_id);

  return {
    cliente_id,
    cliente_nombre:    cliente.nombre,
    puntos_acumulados: cliente.puntos_acumulados,
    movimientos
  };
}

async function ajusteManual(empresa_id, data) {
  const { cliente_id, puntos, descripcion } = data;

  const cliente = await clienteRepo.findById(cliente_id, empresa_id);
  if (!cliente) throw new AppError('Cliente no encontrado', 404);

  // Validar que el saldo no quede negativo en canjes
  if (puntos < 0 && cliente.puntos_acumulados + puntos < 0) {
    throw new AppError(
      `Saldo insuficiente. Puntos actuales: ${cliente.puntos_acumulados}`,
      422
    );
  }

  const tipo = puntos >= 0 ? 'acumulacion' : 'canje';

  await lealtadRepo.registrarMovimiento({
    empresa_id,
    cliente_id,
    tipo,
    puntos,
    origen_tipo: 'manual',
    descripcion: descripcion || (tipo === 'canje' ? 'Canje manual' : 'Ajuste manual')
  });
  await lealtadRepo.actualizarPuntos(cliente_id, empresa_id, puntos);

  return lealtadRepo.getPuntosCliente(cliente_id, empresa_id);
}

module.exports = { obtenerPorCliente, ajusteManual };
