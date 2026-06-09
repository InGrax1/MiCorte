const logRepo = require('../repositories/log.repository');

const METHOD_TO_ACCION = {
  POST:   'INSERT',
  PUT:    'UPDATE',
  PATCH:  'UPDATE',
  DELETE: 'DELETE'
};

// Extrae entidad del path: /api/citas/abc → 'cita', /api/pagos-orden → 'pago_orden'
function getEntityType(path) {
  const match = path.match(/\/api\/([^\/]+)/);
  if (!match) return 'desconocido';
  return match[1]
    .replace(/-/g, '_')
    .toLowerCase()
    .replace(/_$/, '')
    .replace(/es$/, '')      // ordenes → orden
    .replace(/s$/, '');      // clientes → cliente
}

function getIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || req.ip || null;
}

function auditoriaMiddleware(req, res, next) {
  const accion = METHOD_TO_ACCION[req.method];
  if (!accion) return next();

  res.on('finish', () => {
    // Solo loguear respuestas exitosas de mutaciones autenticadas
    if (res.statusCode >= 400) return;
    if (!req.user) return;

    const entity_id = req.params.id || null;

    logRepo.registrar({
      empresa_id:      req.empresaId || null,
      usuario_id:      req.user.id   || null,
      entity_type:     getEntityType(req.path),
      entity_id,
      accion,
      snapshot_before: null,
      snapshot_after:  null,
      ip:              getIp(req),
      user_agent:      req.headers['user-agent'] || null
    }).catch(err => console.error('[AUDITORIA] Error registrando log:', err.message));
  });

  next();
}

module.exports = auditoriaMiddleware;
