const router        = require('express').Router();
const controller    = require('../controllers/bloqueo.controller');
const authMiddleware  = require('../middlewares/auth.middleware');
const tenantGuard     = require('../middlewares/tenantGuard.middleware');
const { checkRoles }  = require('../middlewares/rbac.middleware');

router.use(authMiddleware, tenantGuard);

router.get('/',    checkRoles('super_admin', 'admin_sucursal', 'estilista'), controller.listar);
router.post('/',   checkRoles('super_admin', 'admin_sucursal'),              controller.crear);
router.delete('/:id', checkRoles('super_admin', 'admin_sucursal'),          controller.eliminar);

module.exports = router;
