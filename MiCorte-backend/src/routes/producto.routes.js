const router     = require('express').Router();
const controller = require('../controllers/producto.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const tenantGuard    = require('../middlewares/tenantGuard.middleware');
const { checkRoles } = require('../middlewares/rbac.middleware');

router.use(authMiddleware, tenantGuard);

router.get('/',      checkRoles('super_admin', 'admin_sucursal', 'estilista'), controller.listar);
router.get('/:id',   checkRoles('super_admin', 'admin_sucursal', 'estilista'), controller.obtener);
router.post('/',     checkRoles('super_admin'),                                controller.crear);
router.patch('/:id', checkRoles('super_admin'),                                controller.editar);
router.delete('/:id', checkRoles('super_admin'),                               controller.eliminar);

module.exports = router;
