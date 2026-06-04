/**
 * sms.js
 * Wrapper de Twilio para envio de SMS transaccionales.
 *
 * Si TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_PHONE no estan
 * configurados, todas las funciones retornan sin error (skip silencioso)
 * para no romper los flujos principales cuando SMS es opcional.
 */
const twilio = require('twilio');

// Cliente singleton — se instancia solo la primera vez que se necesita
let _client = null;

function getClient() {
  if (!_client) {
    _client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }
  return _client;
}

function isConfigured() {
  return !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN  &&
    process.env.TWILIO_PHONE
  );
}

function formatFechaSMS(fechaHora) {
  const d = new Date(fechaHora);
  return d.toLocaleString('es-MX', {
    timeZone: 'America/Mexico_City',
    weekday:  'short',
    month:    'short',
    day:      'numeric',
    hour:     '2-digit',
    minute:   '2-digit'
  });
}

/**
 * Recordatorio de cita 24 h antes.
 *
 * @param {object} cita
 * @param {string} cita.cliente_telefono
 * @param {string} cita.cliente_nombre
 * @param {string} cita.servicio_nombre
 * @param {string} cita.estilista_nombre
 * @param {string} cita.sucursal_nombre
 * @param {string|Date} cita.fecha_hora
 */
async function sendRecordatorioSMS(cita) {
  if (!isConfigured())           return;
  if (!cita.cliente_telefono)    return;

  const fecha = formatFechaSMS(cita.fecha_hora);
  const body  = [
    `Hola ${cita.cliente_nombre}, te recordamos tu cita:`,
    `${fecha} — ${cita.servicio_nombre}`,
    `Estilista: ${cita.estilista_nombre}`,
    `Sucursal: ${cita.sucursal_nombre}`,
    'Si necesitas cancelar, contacta la sucursal.'
  ].join('\n');

  await getClient().messages.create({
    from: process.env.TWILIO_PHONE,
    to:   cita.cliente_telefono,
    body
  });
}

/**
 * Solicitud de resena tras completar una cita.
 *
 * @param {object} params
 * @param {string} params.telefono
 * @param {string} params.cliente_nombre
 * @param {string} params.token
 * @param {string} params.sucursal_nombre
 * @param {string} params.estilista_nombre
 */
async function sendResenaSMS({ telefono, cliente_nombre, token, sucursal_nombre, estilista_nombre }) {
  if (!isConfigured()) return;
  if (!telefono)       return;

  const enlace = `${process.env.FRONTEND_URL}/resena/${token}`;
  const body   = [
    `Hola ${cliente_nombre}, gracias por visitar ${sucursal_nombre}.`,
    `Califica tu experiencia con ${estilista_nombre}:`,
    enlace
  ].join('\n');

  await getClient().messages.create({
    from: process.env.TWILIO_PHONE,
    to:   telefono,
    body
  });
}

module.exports = { sendRecordatorioSMS, sendResenaSMS };
