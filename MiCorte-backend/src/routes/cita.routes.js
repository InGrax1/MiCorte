const router         = require('express').Router();
const controller     = require('../controllers/cita.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const tenantGuard    = require('../middlewares/tenantGuard.middleware');
const { checkRoles } = require('../middlewares/rbac.middleware');

router.use(authMiddleware, tenantGuard);

// GET /api/disponibilidad?estilista_id=&servicio_id=&fecha=
router.get('/disponibilidad', checkRoles('super_admin', 'admin_sucursal', 'estilista'), controller.disponibilidad);

router.get('/',            checkRoles('super_admin', 'admin_sucursal', 'estilista'), controller.listar);
router.get('/:id',         checkRoles('super_admin', 'admin_sucursal', 'estilista'), controller.obtener);
router.post('/',           checkRoles('super_admin', 'admin_sucursal'),              controller.crear);
router.patch('/:id/estado', checkRoles('super_admin', 'admin_sucursal', 'estilista'), controller.cambiarEstado);
router.delete('/:id',      checkRoles('super_admin', 'admin_sucursal'),              controller.eliminar);

module.exports = router;
