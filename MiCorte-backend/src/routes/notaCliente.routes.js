const router        = require('express').Router();
const controller    = require('../controllers/notaCliente.controller');
const authMiddleware  = require('../middlewares/auth.middleware');
const tenantGuard     = require('../middlewares/tenantGuard.middleware');
const { checkRoles }  = require('../middlewares/rbac.middleware');

router.use(authMiddleware, tenantGuard);

// Ver notas de un cliente — admins y estilistas
router.get('/cliente/:cliente_id',
  checkRoles('super_admin', 'admin_sucursal', 'estilista'),
  controller.listar
);

// Agregar nota — solo estilistas (resuelve su perfil desde el JWT)
router.post('/',
  checkRoles('estilista'),
  controller.crear
);

module.exports = router;
