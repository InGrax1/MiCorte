const router         = require('express').Router();
const controller     = require('../controllers/pago.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const tenantGuard    = require('../middlewares/tenantGuard.middleware');
const { checkRoles } = require('../middlewares/rbac.middleware');

// Webhook público — MercadoPago llama este endpoint directamente (sin JWT)
// DEBE ir antes del router.use(authMiddleware) para no requerir token
router.post('/webhook/mercadopago', controller.webhookMercadoPago);

// Rutas protegidas con JWT
router.use(authMiddleware, tenantGuard);

router.get('/cita/:cita_id',            checkRoles('super_admin', 'admin_sucursal'), controller.obtenerPorCita);
router.patch('/cita/:cita_id/confirmar', checkRoles('super_admin', 'admin_sucursal'), controller.confirmarEfectivo);
router.patch('/cita/:cita_id/reembolsar', checkRoles('super_admin'),                 controller.reembolsar);
router.post('/cita/:cita_id/iniciar-mp', checkRoles('super_admin', 'admin_sucursal'), controller.iniciarMercadoPago);

module.exports = router;
