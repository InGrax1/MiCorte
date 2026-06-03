const router     = require('express').Router();
const controller = require('../controllers/orden.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const tenantGuard    = require('../middlewares/tenantGuard.middleware');
const { checkRoles } = require('../middlewares/rbac.middleware');

router.use(authMiddleware, tenantGuard);

router.get('/',
  checkRoles('super_admin', 'admin_sucursal'),
  controller.listar
);

router.get('/:id',
  checkRoles('super_admin', 'admin_sucursal'),
  controller.obtener
);

router.post('/',
  checkRoles('super_admin', 'admin_sucursal'),
  controller.crear
);

router.patch('/:id/estado',
  checkRoles('super_admin', 'admin_sucursal'),
  controller.cambiarEstado
);

module.exports = router;
