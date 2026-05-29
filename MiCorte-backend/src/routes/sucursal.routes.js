const router        = require('express').Router();
const controller    = require('../controllers/sucursal.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const tenantGuard   = require('../middlewares/tenantGuard.middleware');
const { checkRoles } = require('../middlewares/rbac.middleware');

router.use(authMiddleware, tenantGuard);

router.get('/',              checkRoles('super_admin', 'admin_sucursal'), controller.listar);
router.get('/:id',           checkRoles('super_admin', 'admin_sucursal'), controller.obtener);
router.post('/',             checkRoles('super_admin'),                   controller.crear);
router.put('/:id',           checkRoles('super_admin', 'admin_sucursal'), controller.actualizar);
router.patch('/:id/toggle',  checkRoles('super_admin'),                   controller.toggleActivo);
router.delete('/:id',        checkRoles('super_admin'),                   controller.eliminar);

module.exports = router;
