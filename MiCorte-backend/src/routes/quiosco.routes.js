// Rutas del modo quiosco — completamente públicas, sin JWT ni tenantGuard.
// La tablet de recepción accede sin autenticación usando el ID de la sucursal.
const router     = require('express').Router();
const controller = require('../controllers/quiosco.controller');

router.get('/:sucursal_id',          controller.citasHoy);  // agenda del día
router.get('/:sucursal_id/buscar',   controller.buscar);     // buscar por nombre
router.post('/:sucursal_id/checkin', controller.checkin);    // registrar check-in

module.exports = router;
