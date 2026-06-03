const router     = require('express').Router();
const controller = require('../controllers/reporte.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const tenantGuard    = require('../middlewares/tenantGuard.middleware');
const { checkRoles } = require('../middlewares/rbac.middleware');

router.use(authMiddleware, tenantGuard);

const roles = checkRoles('super_admin', 'admin_sucursal');

// ?formato=json|xlsx|pdf
// ?fecha_inicio=YYYY-MM-DD&fecha_fin=YYYY-MM-DD&sucursal_id=&estilista_id=
router.get('/ingresos',   roles, controller.ingresos);
router.get('/citas',      roles, controller.citas);
router.get('/inventario', roles, controller.inventario);
router.get('/no-shows',   roles, controller.noShows);
router.get('/estilistas', roles, controller.estilistas);

module.exports = router;
