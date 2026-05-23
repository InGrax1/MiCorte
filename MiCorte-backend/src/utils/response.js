/**
 * Helpers para respuestas JSON consistentes en toda la API.
 * El frontend siempre recibe el mismo shape:
 *   éxito  → { ok: true,  data: {...},    message: '...' }
 *   error  → { ok: false, error: '...',   details: [...] }
 */

const ok = (res, data = {}, message = 'OK', status = 200) =>
  res.status(status).json({ ok: true, data, message });

const created = (res, data = {}, message = 'Creado correctamente') =>
  res.status(201).json({ ok: true, data, message });

const notFound = (res, message = 'Recurso no encontrado') =>
  res.status(404).json({ ok: false, error: message });

const badRequest = (res, message = 'Solicitud inválida', details = []) =>
  res.status(400).json({ ok: false, error: message, details });

const unauthorized = (res, message = 'No autorizado') =>
  res.status(401).json({ ok: false, error: message });

const forbidden = (res, message = 'Acceso denegado') =>
  res.status(403).json({ ok: false, error: message });

const serverError = (res, message = 'Error interno del servidor') =>
  res.status(500).json({ ok: false, error: message });

module.exports = { ok, created, notFound, badRequest, unauthorized, forbidden, serverError };
