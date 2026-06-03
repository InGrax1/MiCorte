const router     = require('express').Router();
const controller = require('../controllers/pagoOrden.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const tenantGuard    = require('../middlewares/tenantGuard.middleware');
const { checkRoles } = require('../middlewares/rbac.middleware');

router.use(authMiddleware, tenantGuard);

router.get('/orden/:orden_id',
  checkRoles('super_admin', 'admin_sucursal'),
  controller.obtenerPorOrden
);

router.patch('/orden/:orden_id/confirmar-efectivo',
  checkRoles('super_admin', 'admin_sucursal'),
  controller.confirmarEfectivo
);

module.exports = router;
