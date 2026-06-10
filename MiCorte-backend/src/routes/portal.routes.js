const router       = require('express').Router();
const ctrl         = require('../controllers/portal.controller');
const clienteGuard = require('../middlewares/clienteGuard.middleware');

// Publicos — flujo OTP de 2 pasos
router.post('/solicitar-acceso', ctrl.solicitarAcceso); // paso 1: email → envía código
router.post('/verificar',        ctrl.verificarOtp);    // paso 2: email + código → JWT

// Protegidos — requieren token de cliente
router.get('/me',               clienteGuard, ctrl.me);
router.get('/mis-citas',        clienteGuard, ctrl.misCitas);
router.get('/mis-ordenes',      clienteGuard, ctrl.misOrdenes);
router.get('/mis-movimientos',  clienteGuard, ctrl.misMovimientos);

module.exports = router;
