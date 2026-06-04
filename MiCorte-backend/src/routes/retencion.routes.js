const router        = require('express').Router();
const controller    = require('../controllers/retencion.controller');
const authMiddleware  = require('../middlewares/auth.middleware');
const tenantGuard     = require('../middlewares/tenantGuard.middleware');
const { checkRoles }  = require('../middlewares/rbac.middleware');

router.use(authMiddleware, tenantGuard);

router.get('/resumen',      checkRoles('super_admin', 'admin_sucursal'), controller.resumen);
router.get('/en-riesgo',    checkRoles('super_admin', 'admin_sucursal'), controller.enRiesgo);
router.get('/top-clientes', checkRoles('super_admin', 'admin_sucursal'), controller.topClientes);
router.get('/cohortes',     checkRoles('super_admin', 'admin_sucursal'), controller.cohortes);

module.exports = router;
