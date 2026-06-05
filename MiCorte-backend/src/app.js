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
app.use('/api/auth',       require('./routes/auth.routes'));
app.use('/api/sucursales', require('./routes/sucursal.routes'));
app.use('/api/estilistas', require('./routes/estilista.routes'));
app.use('/api/servicios',  require('./routes/servicio.routes'));
app.use('/api/clientes',   require('./routes/cliente.routes'));
app.use('/api/citas',      require('./routes/cita.routes'));
app.use('/api/pagos',       require('./routes/pago.routes'));
app.use('/api/resenas',     require('./routes/resena.routes'));
app.use('/api/bloqueos',    require('./routes/bloqueo.routes'));
app.use('/api/notas',       require('./routes/notaCliente.routes'));
app.use('/api/quiosco',     require('./routes/quiosco.routes'));
app.use('/api/categorias',  require('./routes/categoria.routes'));
app.use('/api/productos',   require('./routes/producto.routes'));
app.use('/api/inventario',  require('./routes/inventario.routes'));
app.use('/api/ordenes',     require('./routes/orden.routes'));
app.use('/api/pagos-orden', require('./routes/pagoOrden.routes'));
app.use('/api/lealtad',     require('./routes/lealtad.routes'));
app.use('/api/reportes',    require('./routes/reporte.routes'));
app.use('/api/retencion',   require('./routes/retencion.routes'));
app.use('/api/platform',    require('./routes/platform.routes'));

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
