/**
 * auth.service.js
 * Aquí vive la lógica de autenticación.
 * El controller NO sabe nada de bcrypt ni jwt: solo llama a estas funciones.
 */
const bcrypt      = require('bcryptjs');
const jwt         = require('jsonwebtoken');
const usuarioRepo = require('../repositories/usuario.repository');
const { AppError } = require('../utils/errors');

// ── Helpers de tokens ────────────────────────────────────────

/**
 * Construye el payload que va dentro del JWT.
 * empresa_id es crítico: el tenantGuard lo usa en cada request.
 */
function buildPayload(usuario) {
  return {
    id:          usuario.id,
    email:       usuario.email,
    nombre:      usuario.nombre,
    empresa_id:  usuario.empresa_id,
    sucursal_id: usuario.sucursal_id || null,
    // roles viene como string "super_admin,admin_sucursal" del GROUP_CONCAT
    roles: usuario.roles ? usuario.roles.split(',') : []
  };
}

function signAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h'
  });
}

function signRefreshToken(payload) {
  // El refresh token solo lleva el ID para minimizar datos expuestos
  return jwt.sign(
    { id: payload.id, empresa_id: payload.empresa_id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
}

// ── Login ─────────────────────────────────────────────────────

async function login(email, password) {
  // 1. Buscar usuario por email
  const usuario = await usuarioRepo.findByEmail(email);

  // Mismo mensaje para email incorrecto y contraseña incorrecta
  // (evita enumerar usuarios válidos por el mensaje de error)
  if (!usuario) {
    throw new AppError('Email o contraseña incorrectos', 401);
  }

  if (!usuario.activo) {
    throw new AppError('Usuario desactivado. Contacta al administrador', 403);
  }

  // 2. Verificar contraseña
  const passwordOk = await bcrypt.compare(password, usuario.password_hash);
  if (!passwordOk) {
    throw new AppError('Email o contraseña incorrectos', 401);
  }

  // 3. Actualizar ultimo_login (no bloqueante: no esperamos error aquí)
  usuarioRepo.updateLastLogin(usuario.id).catch(() => {});

  // 4. Generar tokens
  const payload      = buildPayload(usuario);
  const accessToken  = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  return {
    access_token:  accessToken,
    refresh_token: refreshToken,
    expires_in:    process.env.JWT_EXPIRES_IN || '1h',
    usuario: {
      id:          payload.id,
      nombre:      payload.nombre,
      email:       payload.email,
      empresa_id:  payload.empresa_id,
      sucursal_id: payload.sucursal_id,
      roles:       payload.roles
    }
  };
}

// ── Refresh token ─────────────────────────────────────────────

async function refresh(refreshToken) {
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new AppError('Refresh token inválido o expirado', 401);
  }

  // Recargar usuario desde BD para asegurar que sigue activo
  const usuario = await usuarioRepo.findById(decoded.id, decoded.empresa_id);
  if (!usuario || !usuario.activo) {
    throw new AppError('Usuario no encontrado o desactivado', 401);
  }

  const payload     = buildPayload(usuario);
  const accessToken = signAccessToken(payload);

  return {
    access_token: accessToken,
    expires_in:   process.env.JWT_EXPIRES_IN || '1h'
  };
}

// ── Me (quién soy) ────────────────────────────────────────────

async function getMe(id, empresa_id) {
  const usuario = await usuarioRepo.findById(id, empresa_id);
  if (!usuario) throw new AppError('Usuario no encontrado', 404);

  return {
    id:          usuario.id,
    nombre:      usuario.nombre,
    email:       usuario.email,
    empresa_id:  usuario.empresa_id,
    sucursal_id: usuario.sucursal_id,
    roles:       usuario.roles ? usuario.roles.split(',') : []
  };
}

module.exports = { login, refresh, getMe };
