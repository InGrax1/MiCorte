/**
 * auth.routes.js
 * Endpoints de autenticación — NO requieren JWT (son públicos).
 * Excepción: GET /me sí requiere token.
 */
const router          = require('express').Router();
const rateLimit       = require('express-rate-limit');
const authController  = require('../controllers/auth.controller');
const authMiddleware  = require('../middlewares/auth.middleware');
const tenantGuard     = require('../middlewares/tenantGuard.middleware');

// Rate limiting para login: max 5 intentos por IP cada 15 minutos
const loginLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,  // 15 minutos
  max:             5,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { ok: false, error: 'Demasiados intentos de login. Intenta de nuevo en 15 minutos.' }
});

// POST /api/auth/registro — onboarding público de nuevo tenant
router.post('/registro', authController.registro);

// POST /api/auth/login
// Body: { email, password }
router.post('/login', loginLimiter, authController.login);

// POST /api/auth/refresh
// Body: { refresh_token }
router.post('/refresh', authController.refresh);

// GET /api/auth/me  — requiere token válido
router.get('/me', authMiddleware, tenantGuard, authController.me);

module.exports = router;
