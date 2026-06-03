const router      = require('express').Router();
const controller  = require('../controllers/categoria.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const tenantGuard    = require('../middlewares/tenantGuard.middleware');
const { checkRoles } = require('../middlewares/rbac.middleware');

router.use(authMiddleware, tenantGuard);

router.get('/',     checkRoles('super_admin', 'admin_sucursal'), controller.listar);
router.post('/',    checkRoles('super_admin'),                   controller.crear);
router.patch('/:id', checkRoles('super_admin'),                  controller.editar);
router.delete('/:id', checkRoles('super_admin'),                 controller.eliminar);

module.exports = router;
