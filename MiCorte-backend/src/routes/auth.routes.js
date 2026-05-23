/**
 * auth.routes.js
 * Endpoints de autenticación — NO requieren JWT (son públicos).
 * Excepción: GET /me sí requiere token.
 */
const router          = require('express').Router();
const authController  = require('../controllers/auth.controller');
const authMiddleware  = require('../middlewares/auth.middleware');
const tenantGuard     = require('../middlewares/tenantGuard.middleware');

// POST /api/auth/login
// Body: { email, password }
router.post('/login', authController.login);

// POST /api/auth/refresh
// Body: { refresh_token }
router.post('/refresh', authController.refresh);

// GET /api/auth/me  — requiere token válido
router.get('/me', authMiddleware, tenantGuard, authController.me);

module.exports = router;
