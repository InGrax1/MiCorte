const router         = require('express').Router();
const controller     = require('../controllers/servicio.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const tenantGuard    = require('../middlewares/tenantGuard.middleware');
const { checkRoles } = require('../middlewares/rbac.middleware');

router.use(authMiddleware, tenantGuard);

router.get('/',                                   checkRoles('super_admin', 'admin_sucursal', 'estilista'), controller.listar);
router.get('/:id',                                checkRoles('super_admin', 'admin_sucursal', 'estilista'), controller.obtener);
router.post('/',                                  checkRoles('super_admin', 'admin_sucursal'),              controller.crear);
router.put('/:id',                                checkRoles('super_admin', 'admin_sucursal'),              controller.actualizar);
router.delete('/:id',                             checkRoles('super_admin'),                                controller.eliminar);
router.post('/:id/sucursales',                    checkRoles('super_admin', 'admin_sucursal'),              controller.asignarSucursal);
router.delete('/:id/sucursales/:sucursal_id',     checkRoles('super_admin'),                                controller.removerSucursal);

module.exports = router;
