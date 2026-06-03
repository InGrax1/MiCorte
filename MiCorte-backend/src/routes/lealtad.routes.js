const router     = require('express').Router();
const controller = require('../controllers/lealtad.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const tenantGuard    = require('../middlewares/tenantGuard.middleware');
const { checkRoles } = require('../middlewares/rbac.middleware');

router.use(authMiddleware, tenantGuard);

router.get('/cliente/:cliente_id',
  checkRoles('super_admin', 'admin_sucursal'),
  controller.obtenerPorCliente
);

router.post('/ajuste',
  checkRoles('super_admin'),
  controller.ajusteManual
);

module.exports = router;
