const router = require('express').Router();
const ctrl   = require('../controllers/reserva.controller');

// Rutas publicas — sin authMiddleware ni tenantGuard
router.get('/sucursales',                    ctrl.sucursales);
router.get('/:sucursal_id/servicios',       ctrl.servicios);
router.get('/:sucursal_id/estilistas',       ctrl.estilistas);
router.get('/:sucursal_id/disponibilidad',   ctrl.disponibilidad);
router.post('/:sucursal_id',                 ctrl.crear);

module.exports = router;
