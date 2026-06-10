const router = require('express').Router();
const ctrl   = require('../controllers/tienda.controller');

// Todos los endpoints son publicos (sin auth)
router.get('/:sucursal_id/info',       ctrl.sucursalInfo);
router.get('/:sucursal_id/categorias', ctrl.categorias);
router.get('/:sucursal_id/catalogo',   ctrl.catalogo);
router.post('/:sucursal_id/orden',     ctrl.crearOrden);

module.exports = router;
