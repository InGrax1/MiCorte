/**
 * email.js
 * Transporter único de Nodemailer (Gmail SMTP).
 * Exporta helpers de envío reutilizables por jobs y services.
 */
const nodemailer = require('nodemailer');
const QRCode     = require('qrcode');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS   // App Password de Google (16 chars)
  }
});

function formatFecha(fechaHora) {
  const d = new Date(fechaHora);
  return d.toLocaleString('es-MX', {
    timeZone: 'America/Mexico_City',
    weekday: 'long', year: 'numeric', month: 'long',
    day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

async function sendConfirmacion(cita) {
  const fecha    = formatFecha(cita.fecha_hora);
  // QR codifica el cita_id — el quiosco lo escanea para hacer check-in automático
  const qrBuffer = await QRCode.toBuffer(cita.id, { width: 200 });

  await transporter.sendMail({
    from:    `"MiCorte" <${process.env.SMTP_USER}>`,
    to:      cita.cliente_email,
    subject: `Cita confirmada — ${cita.sucursal_nombre}`,
    attachments: [{
      filename: 'qr-checkin.png',
      content:  qrBuffer,
      cid:      'qr-checkin'
    }],
    text: [
      `Hola ${cita.cliente_nombre}, tu cita ha sido confirmada.`,
      '',
      `Fecha y hora : ${fecha}`,
      `Servicio     : ${cita.servicio_nombre}`,
      `Estilista    : ${cita.estilista_nombre}`,
      `Sucursal     : ${cita.sucursal_nombre}`,
      '',
      'Presenta el código QR adjunto en recepción para hacer tu check-in.',
      '',
      '— Equipo MiCorte'
    ].join('\n'),
    html: `
      <p>Hola <strong>${cita.cliente_nombre}</strong>, tu cita ha sido confirmada.</p>
      <table cellpadding="6" style="border-collapse:collapse;">
        <tr><td><strong>Fecha y hora</strong></td><td>${fecha}</td></tr>
        <tr><td><strong>Servicio</strong></td><td>${cita.servicio_nombre}</td></tr>
        <tr><td><strong>Estilista</strong></td><td>${cita.estilista_nombre}</td></tr>
        <tr><td><strong>Sucursal</strong></td><td>${cita.sucursal_nombre}</td></tr>
      </table>
      <p>Presenta este QR en recepción para hacer tu check-in sin esperar:</p>
      <img src="cid:qr-checkin" alt="QR Check-in"
           style="width:200px;height:200px;display:block;margin:16px 0;" />
      <p style="color:#888;font-size:12px;">— Equipo MiCorte</p>
    `
  });
}

async function sendRecordatorio(cita) {
  const fecha = formatFecha(cita.fecha_hora);

  await transporter.sendMail({
    from: `"MiCorte" <${process.env.SMTP_USER}>`,
    to:   cita.cliente_email,
    subject: `Recordatorio: tu cita es mañana — ${cita.sucursal_nombre}`,
    text: [
      `Hola ${cita.cliente_nombre},`,
      '',
      'Te recordamos que tienes una cita programada:',
      `  Fecha y hora : ${fecha}`,
      `  Servicio     : ${cita.servicio_nombre}`,
      `  Estilista    : ${cita.estilista_nombre}`,
      `  Sucursal     : ${cita.sucursal_nombre}`,
      '',
      'Si necesitas cancelar o reagendar, contacta directamente a la sucursal.',
      '',
      '— Equipo MiCorte'
    ].join('\n'),
    html: `
      <p>Hola <strong>${cita.cliente_nombre}</strong>,</p>
      <p>Te recordamos que tienes una cita programada:</p>
      <table cellpadding="6" style="border-collapse:collapse;">
        <tr><td><strong>Fecha y hora</strong></td><td>${fecha}</td></tr>
        <tr><td><strong>Servicio</strong></td><td>${cita.servicio_nombre}</td></tr>
        <tr><td><strong>Estilista</strong></td><td>${cita.estilista_nombre}</td></tr>
        <tr><td><strong>Sucursal</strong></td><td>${cita.sucursal_nombre}</td></tr>
      </table>
      <p>Si necesitas cancelar o reagendar, contacta directamente a la sucursal.</p>
      <p style="color:#888;font-size:12px;">— Equipo MiCorte</p>
    `
  });
}

async function sendResena(resena) {
  const enlace = `${process.env.FRONTEND_URL}/resena/${resena.token}`;

  await transporter.sendMail({
    from: `"MiCorte" <${process.env.SMTP_USER}>`,
    to:   resena.cliente_email,
    subject: `¿Cómo estuvo tu experiencia en ${resena.sucursal_nombre}?`,
    text: [
      `Hola ${resena.cliente_nombre},`,
      '',
      `Gracias por visitar ${resena.sucursal_nombre}.`,
      'Tu opinión nos ayuda a mejorar.',
      '',
      `Califica tu experiencia con ${resena.estilista_nombre}:`,
      enlace,
      '',
      'Este enlace expira en 7 días.',
      '',
      '— Equipo MiCorte'
    ].join('\n'),
    html: `
      <p>Hola <strong>${resena.cliente_nombre}</strong>,</p>
      <p>Gracias por visitar <strong>${resena.sucursal_nombre}</strong>.</p>
      <p>Tu opinión nos ayuda a mejorar el servicio.</p>
      <p>
        <a href="${enlace}"
           style="background:#1E3A5F;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">
          Calificar mi experiencia con ${resena.estilista_nombre}
        </a>
      </p>
      <p style="color:#888;font-size:12px;">Este enlace expira en 7 días.</p>
      <p style="color:#888;font-size:12px;">— Equipo MiCorte</p>
    `
  });
}

async function sendStockAlerta({ admin_email, producto_nombre, stock_actual, stock_minimo, sucursal_nombre }) {
  if (!admin_email) return;

  await transporter.sendMail({
    from:    `"MiCorte" <${process.env.SMTP_USER}>`,
    to:      admin_email,
    subject: `Alerta de stock bajo — ${producto_nombre}`,
    text: [
      `El producto "${producto_nombre}" en ${sucursal_nombre} está por debajo del stock mínimo.`,
      `Stock actual : ${stock_actual}`,
      `Stock mínimo : ${stock_minimo}`,
      'Realiza una reposición a la brevedad.',
      '— Sistema MiCorte'
    ].join('\n'),
    html: `
      <p>El producto <strong>${producto_nombre}</strong> en <strong>${sucursal_nombre}</strong>
         ha llegado al stock mínimo.</p>
      <table cellpadding="6" style="border-collapse:collapse;">
        <tr><td><strong>Stock actual</strong></td>
            <td style="color:#e53e3e;font-weight:bold;">${stock_actual}</td></tr>
        <tr><td><strong>Stock mínimo</strong></td><td>${stock_minimo}</td></tr>
      </table>
      <p>Realiza una reposición a la brevedad para evitar quiebres de inventario.</p>
      <p style="color:#888;font-size:12px;">— Sistema MiCorte</p>
    `
  });
}

module.exports = { sendConfirmacion, sendRecordatorio, sendResena, sendStockAlerta };
