/**
 * tenantGuard.middleware.js
 *
 * Este middleware es el guardián del multitenancy.
 * Se ejecuta DESPUÉS de authMiddleware y hace DOS cosas:
 *
 *   1. Inyecta req.empresaId desde el token (siempre disponible para repositories).
 *   2. Si el recurso solicitado tiene :empresa_id en la URL, valida que coincida
 *      con el del token — un tenant NUNCA puede acceder a datos de otro.
 *
 * Uso en rutas:
 *   router.get('/ruta', authMiddleware, tenantGuard, handler)
 */
const { forbidden } = require('../utils/response');

function tenantGuard(req, res, next) {
  // req.user fue inyectado por authMiddleware
  if (!req.user || !req.user.empresa_id) {
    return forbidden(res, 'Sin contexto de empresa en el token');
  }

  // Disponible para todos los repositories sin tener que pasarlo manualmente
  req.empresaId = req.user.empresa_id;

  // Si la ruta tiene :empresa_id explícito, validar que coincida
  if (req.params.empresa_id && req.params.empresa_id !== req.user.empresa_id) {
    return forbidden(res, 'No tienes acceso a los datos de esta empresa');
  }

  next();
}

module.exports = tenantGuard;
