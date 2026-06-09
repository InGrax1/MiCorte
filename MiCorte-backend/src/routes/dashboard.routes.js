const express             = require('express');
const router              = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const authMiddleware      = require('../middlewares/auth.middleware');
const tenantGuard         = require('../middlewares/tenant.guard');
const { checkRoles }      = require('../middlewares/role.middleware');

router.use(authMiddleware, tenantGuard);

router.get('/', checkRoles('super_admin', 'admin_sucursal'), dashboardController.getKpis);

module.exports = router;
