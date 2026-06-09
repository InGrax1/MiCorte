/**
 * auth.service.js
 * Aquí vive la lógica de autenticación.
 * El controller NO sabe nada de bcrypt ni jwt: solo llama a estas funciones.
 */
const bcrypt         = require('bcryptjs');
const jwt            = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db             = require('../config/db');
const usuarioRepo    = require('../repositories/usuario.repository');
const logRepo        = require('../repositories/log.repository');
const { AppError }   = require('../utils/errors');

// Convierte el nombre del negocio en un slug URL-friendly
function generarSlug(nombre) {
  return nombre
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80);
}

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

async function login(email, password, meta = {}) {
  const { ip = null, user_agent = null } = meta;

  // 1. Buscar usuario por email
  const usuario = await usuarioRepo.findByEmail(email);

  // Mismo mensaje para email incorrecto y contraseña incorrecta
  // (evita enumerar usuarios válidos por el mensaje de error)
  if (!usuario) {
    logRepo.registrar({
      empresa_id: null, usuario_id: null,
      entity_type: 'auth', entity_id: 'N/A',
      accion: 'LOGIN',
      snapshot_after: { email, resultado: 'usuario_no_encontrado' },
      ip, user_agent
    }).catch(() => {});
    throw new AppError('Email o contraseña incorrectos', 401);
  }

  if (!usuario.activo) {
    throw new AppError('Usuario desactivado. Contacta al administrador', 403);
  }

  // 2. Verificar contraseña
  const passwordOk = await bcrypt.compare(password, usuario.password_hash);
  if (!passwordOk) {
    logRepo.registrar({
      empresa_id: usuario.empresa_id, usuario_id: usuario.id,
      entity_type: 'auth', entity_id: usuario.id,
      accion: 'LOGIN',
      snapshot_after: { email, resultado: 'password_incorrecto' },
      ip, user_agent
    }).catch(() => {});
    throw new AppError('Email o contraseña incorrectos', 401);
  }

  // 3. Actualizar ultimo_login (no bloqueante: no esperamos error aquí)
  usuarioRepo.updateLastLogin(usuario.id).catch(() => {});

  // Log de acceso exitoso (non-blocking)
  logRepo.registrar({
    empresa_id: usuario.empresa_id, usuario_id: usuario.id,
    entity_type: 'auth', entity_id: usuario.id,
    accion: 'LOGIN',
    snapshot_after: { email, resultado: 'ok' },
    ip, user_agent
  }).catch(() => {});

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

// ── Registro de nuevo tenant ──────────────────────────────────

async function registro(data) {
  const { empresa_nombre, admin_nombre, admin_email, password, telefono } = data;

  // Email único global
  const existe = await usuarioRepo.findByEmail(admin_email);
  if (existe) throw new AppError('Este email ya está registrado', 409);

  const password_hash = await bcrypt.hash(
    password,
    parseInt(process.env.BCRYPT_ROUNDS) || 12
  );

  const empresa_id = uuidv4();
  const usuario_id = uuidv4();

  const conn = await db.getConnection();
  await conn.beginTransaction();
  try {
    // Slug único — si colisiona se añade el inicio del UUID
    const baseSlug = generarSlug(empresa_nombre);
    const [[existe_slug]] = await conn.execute(
      'SELECT id FROM empresas WHERE slug = ?', [baseSlug]
    );
    const slug = existe_slug ? `${baseSlug}-${empresa_id.slice(0, 8)}` : baseSlug;

    // 1. Crear empresa
    await conn.execute(
      `INSERT INTO empresas (id, nombre, slug, email_contacto, telefono, plan)
       VALUES (?, ?, ?, ?, ?, 'basico')`,
      [empresa_id, empresa_nombre, slug, admin_email, telefono || null]
    );

    // 2. Crear usuario super_admin
    await conn.execute(
      `INSERT INTO usuarios (id, empresa_id, nombre, email, password_hash)
       VALUES (?, ?, ?, ?, ?)`,
      [usuario_id, empresa_id, admin_nombre, admin_email, password_hash]
    );

    // 3. Asignar rol super_admin
    const [roles] = await conn.execute(
      `SELECT id FROM roles WHERE nombre = 'super_admin'`
    );
    if (!roles.length) throw new Error('Rol super_admin no encontrado en BD');
    await conn.execute(
      `INSERT INTO usuarios_roles (usuario_id, rol_id) VALUES (?, ?)`,
      [usuario_id, roles[0].id]
    );

    await conn.commit();

    // 4. Auto-login: generar tokens
    const usuario  = await usuarioRepo.findByEmail(admin_email);
    const payload  = buildPayload(usuario);

    return {
      access_token:  signAccessToken(payload),
      refresh_token: signRefreshToken(payload),
      expires_in:    process.env.JWT_EXPIRES_IN || '1h',
      empresa: { id: empresa_id, nombre: empresa_nombre, slug },
      usuario: {
        id:     payload.id,
        nombre: payload.nombre,
        email:  payload.email,
        roles:  payload.roles
      }
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { login, refresh, getMe, registro };
