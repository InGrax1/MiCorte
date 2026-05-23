require('dotenv').config();
const express = require('express');
const app     = express();

// ── Middlewares globales ───────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── CORS ──────────────────────────────────────────────────────
const originsEnv     = process.env.CORS_ORIGINS || 'http://localhost:5173';
const allowedOrigins = originsEnv.split(',').map(o => o.trim());

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ── Rutas ─────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth.routes'));

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ ok: false, error: 'Ruta no encontrada' });
});

// ── Error handler global ──────────────────────────────────────
// Captura tanto AppError (lanzados desde services)
// como errores inesperados de MySQL u otras librerías.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status  = err.status || 500;
  const message = err.status
    ? err.message                        // AppError: mensaje controlado
    : 'Error interno del servidor';      // error inesperado: no exponemos detalles

  if (!err.status) {
    // Log completo solo para errores no controlados
    console.error('[ERROR NO CONTROLADO]', err);
  }

  res.status(status).json({ ok: false, error: message });
});

module.exports = app;
