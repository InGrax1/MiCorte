const router     = require('express').Router();
const controller = require('../controllers/inventario.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const tenantGuard    = require('../middlewares/tenantGuard.middleware');
const { checkRoles } = require('../middlewares/rbac.middleware');

router.use(authMiddleware, tenantGuard);

router.get('/',
  checkRoles('super_admin', 'admin_sucursal'),
  controller.listar
);

router.patch('/:producto_id/sucursal/:sucursal_id',
  checkRoles('super_admin', 'admin_sucursal'),
  controller.ajustar
);

module.exports = router;
