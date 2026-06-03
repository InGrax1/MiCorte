const router     = require('express').Router();
const controller = require('../controllers/platform.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { checkRoles } = require('../middlewares/rbac.middleware');

// Sin tenantGuard — platform_admin no tiene empresa_id en el JWT
router.use(authMiddleware, checkRoles('platform_admin'));

router.get('/metricas',              controller.metricas);
router.get('/tenants',               controller.listarTenants);
router.get('/tenants/:id',           controller.obtenerTenant);
router.patch('/tenants/:id/toggle',  controller.toggleTenant);
router.patch('/tenants/:id/plan',    controller.cambiarPlan);

module.exports = router;
