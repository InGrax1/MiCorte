/**
 * rbac.middleware.js
 * Role-Based Access Control.
 *
 * Uso: checkRoles('super_admin', 'admin_sucursal')
 * Se usa DESPUÉS de authMiddleware y tenantGuard:
 *
 *   router.delete('/usuarios/:id',
 *     authMiddleware,
 *     tenantGuard,
 *     checkRoles('super_admin'),
 *     handler
 *   );
 */
const { forbidden } = require('../utils/response');

function checkRoles(...rolesPermitidos) {
  return (req, res, next) => {
    const rolesUsuario = req.user?.roles || [];

    // platform_admin tiene acceso a todo (es el equipo de MiCorte)
    if (rolesUsuario.includes('platform_admin')) return next();

    const tienePermiso = rolesPermitidos.some(r => rolesUsuario.includes(r));
    if (!tienePermiso) {
      return forbidden(res, 'No tienes permisos para esta acción');
    }
    next();
  };
}

module.exports = { checkRoles };
