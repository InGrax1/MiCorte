const router         = require('express').Router();
const controller     = require('../controllers/resena.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const tenantGuard    = require('../middlewares/tenantGuard.middleware');
const { checkRoles } = require('../middlewares/rbac.middleware');

// Rutas públicas — el cliente accede con token de un solo uso (sin JWT)
// DEBEN ir antes del router.use(authMiddleware)
router.get('/token/:token',  controller.obtenerPorToken);
router.post('/token/:token', controller.responder);

// Rutas protegidas con JWT
router.use(authMiddleware, tenantGuard);

router.get('/',                checkRoles('super_admin', 'admin_sucursal'), controller.listar);
router.patch('/:id/visibilidad', checkRoles('super_admin', 'admin_sucursal'), controller.toggleVisibilidad);

module.exports = router;
