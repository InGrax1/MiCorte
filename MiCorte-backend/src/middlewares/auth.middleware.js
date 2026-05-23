/**
 * auth.middleware.js
 * Verifica el JWT en cada request protegido.
 * Si el token es válido, inyecta req.user con el payload decodificado.
 * Si no, responde 401 y corta el ciclo.
 */
const jwt = require('jsonwebtoken');
const { unauthorized } = require('../utils/response');

function authMiddleware(req, res, next) {
  // El token viene en el header: Authorization: Bearer <token>
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return unauthorized(res, 'Token de acceso requerido');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, nombre, empresa_id, sucursal_id, roles }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return unauthorized(res, 'El token ha expirado. Usa el refresh token');
    }
    return unauthorized(res, 'Token inválido');
  }
}

module.exports = authMiddleware;
