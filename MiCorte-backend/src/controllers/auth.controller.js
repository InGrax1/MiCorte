/**
 * auth.controller.js
 * Responsabilidades ÚNICAS de este archivo:
 *   1. Validar el formato del body con Joi.
 *   2. Llamar al service.
 *   3. Responder con el helper de response.
 * PROHIBIDO: lógica de negocio, queries a BD, manejo de jwt/bcrypt.
 */
const Joi         = require('joi');
const authService = require('../services/auth.service');
const { ok, created, badRequest } = require('../utils/response');

// ── Esquemas de validación ────────────────────────────────────

const loginSchema = Joi.object({
  email:    Joi.string().email().required().messages({
    'string.email': 'El email no tiene un formato válido',
    'any.required': 'El email es requerido'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min':   'La contraseña debe tener al menos 6 caracteres',
    'any.required': 'La contraseña es requerida'
  })
});

const refreshSchema = Joi.object({
  refresh_token: Joi.string().required().messages({
    'any.required': 'El refresh_token es requerido'
  })
});

// ── Handlers ─────────────────────────────────────────────────

async function login(req, res, next) {
  try {
    // 1. Validar body
    const { error, value } = loginSchema.validate(req.body, { abortEarly: false });
    if (error) {
      const details = error.details.map(d => d.message);
      return badRequest(res, 'Datos de login inválidos', details);
    }

    // 2. Llamar al service
    const result = await authService.login(value.email, value.password);

    // 3. Responder
    return ok(res, result, 'Login exitoso');

  } catch (err) {
    next(err); // pasa al error handler global de app.js
  }
}

async function refresh(req, res, next) {
  try {
    const { error, value } = refreshSchema.validate(req.body, { abortEarly: false });
    if (error) {
      const details = error.details.map(d => d.message);
      return badRequest(res, 'refresh_token requerido', details);
    }

    const result = await authService.refresh(value.refresh_token);
    return ok(res, result, 'Token renovado');

  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    // req.user lo inyecta el middleware auth (paso siguiente)
    const usuario = await authService.getMe(req.user.id, req.user.empresa_id);
    return ok(res, usuario);
  } catch (err) {
    next(err);
  }
}

module.exports = { login, refresh, me };
