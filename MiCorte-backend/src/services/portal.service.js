const jwt          = require('jsonwebtoken');
const portalRepo   = require('../repositories/portal.repository');
const { sendOtpPortal } = require('../utils/email');
const { AppError } = require('../utils/errors');

function signClienteToken(cliente_id, empresa_id) {
  return jwt.sign(
    { cliente_id, empresa_id, tipo: 'cliente' },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// Paso 1: valida el email, genera OTP y lo envía
async function solicitarAcceso(email, sucursal_id) {
  const sucursal = await portalRepo.getEmpresaId(sucursal_id);
  if (!sucursal) throw new AppError('Sucursal no encontrada', 404);

  const cliente = await portalRepo.findClienteByEmail(email, sucursal.empresa_id);
  if (!cliente) {
    throw new AppError(
      'No encontramos una cuenta con ese email. Usa el mismo email con el que reservaste tu cita.',
      404
    );
  }

  const codigo = String(Math.floor(100000 + Math.random() * 900000));
  await portalRepo.saveOtp(cliente.id, codigo);

  // Non-blocking para no retrasar la respuesta
  sendOtpPortal({
    email:           cliente.email,
    nombre:          cliente.nombre,
    codigo,
    sucursal_nombre: sucursal.nombre,
  }).catch(err => console.error('[PORTAL] Error enviando OTP:', err.message));

  return { message: `Codigo enviado a ${email}` };
}

// Paso 2: valida el codigo OTP e inicia sesion
async function verificarOtp(email, sucursal_id, codigo) {
  const sucursal = await portalRepo.getEmpresaId(sucursal_id);
  if (!sucursal) throw new AppError('Sucursal no encontrada', 404);

  const cliente = await portalRepo.findByEmailAndOtp(email, sucursal.empresa_id, codigo);
  if (!cliente) throw new AppError('Codigo incorrecto o expirado', 401);

  // Invalidar OTP de inmediato (uso único)
  await portalRepo.clearOtp(cliente.id);

  const access_token = signClienteToken(cliente.id, sucursal.empresa_id);
  return { cliente, access_token };
}

async function getMe(cliente_id, empresa_id) {
  const cliente = await portalRepo.findClienteById(cliente_id, empresa_id);
  if (!cliente) throw new AppError('Cliente no encontrado', 404);
  return cliente;
}

async function getMisCitas(cliente_id, empresa_id) {
  return portalRepo.getMisCitas(cliente_id, empresa_id);
}

async function getMisOrdenes(cliente_id, empresa_id) {
  return portalRepo.getMisOrdenes(cliente_id, empresa_id);
}

async function getMisMovimientos(cliente_id, empresa_id) {
  return portalRepo.getMisMovimientos(cliente_id, empresa_id);
}

module.exports = { solicitarAcceso, verificarOtp, getMe, getMisCitas, getMisOrdenes, getMisMovimientos };
