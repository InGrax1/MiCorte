const crypto    = require('crypto');
const pagoRepo  = require('../repositories/pago.repository');
const citaRepo  = require('../repositories/cita.repository');
const { AppError } = require('../utils/errors');

// ── Verificación de firma MercadoPago ─────────────────────────

function verifyMPSignature(xSignature, xRequestId, dataId) {
  if (!process.env.MP_WEBHOOK_SECRET) return false;
  const parts    = Object.fromEntries(xSignature.split(',').map(p => p.split('=')));
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${parts.ts};`;
  const hash     = crypto
    .createHmac('sha256', process.env.MP_WEBHOOK_SECRET)
    .update(manifest)
    .digest('hex');
  return hash === parts.v1;
}

// ── Servicios ─────────────────────────────────────────────────

async function obtenerPorCita(cita_id, empresa_id) {
  const pago = await pagoRepo.findByCitaId(cita_id, empresa_id);
  if (!pago) throw new AppError('Pago no encontrado para esta cita', 404);
  return pago;
}

async function confirmarEfectivo(cita_id, empresa_id) {
  const pago = await pagoRepo.findByCitaId(cita_id, empresa_id);
  if (!pago)              throw new AppError('Pago no encontrado para esta cita', 404);
  if (pago.estado === 'pagado') throw new AppError('El pago ya fue confirmado', 409);

  await pagoRepo.marcarPagado(cita_id, null);
  await citaRepo.updateEstado(cita_id, empresa_id, 'confirmada');

  return pagoRepo.findByCitaId(cita_id, empresa_id);
}

async function reembolsar(cita_id, empresa_id) {
  const pago = await pagoRepo.findByCitaId(cita_id, empresa_id);
  if (!pago)                    throw new AppError('Pago no encontrado para esta cita', 404);
  if (pago.estado !== 'pagado') throw new AppError('Solo se pueden reembolsar pagos confirmados', 422);

  await pagoRepo.marcarReembolsado(cita_id);
  await citaRepo.updateEstado(cita_id, empresa_id, 'cancelada');

  return pagoRepo.findByCitaId(cita_id, empresa_id);
}

async function iniciarMercadoPago(cita_id, empresa_id) {
  if (!process.env.MP_ACCESS_TOKEN) {
    throw new AppError('MercadoPago no está configurado en este servidor', 503);
  }

  const cita = await citaRepo.findById(cita_id, empresa_id);
  if (!cita) throw new AppError('Cita no encontrada', 404);

  const pago = await pagoRepo.findByCitaId(cita_id, empresa_id);
  if (!pago) throw new AppError('Pago no encontrado para esta cita', 404);
  if (pago.estado === 'pagado') throw new AppError('Esta cita ya fue pagada', 409);

  const body = {
    items: [{
      title:      cita.servicio_nombre,
      unit_price: parseFloat(cita.precio_final),
      quantity:   1,
      currency_id: 'MXN'
    }],
    external_reference: cita_id,
    notification_url:   `${process.env.API_URL}/api/pagos/webhook/mercadopago`,
    back_urls: {
      success: `${process.env.FRONTEND_URL}/cita/${cita_id}/pago/exitoso`,
      failure: `${process.env.FRONTEND_URL}/cita/${cita_id}/pago/fallido`,
      pending: `${process.env.FRONTEND_URL}/cita/${cita_id}/pago/pendiente`
    },
    auto_return: 'approved'
  };

  const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      'Content-Type':  'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('[MP] Error creando preference:', err);
    throw new AppError('Error al crear la preferencia de pago en MercadoPago', 502);
  }

  const preference = await response.json();
  return { init_point: preference.init_point, preference_id: preference.id };
}

async function procesarWebhookMP(headers, body) {
  // Solo procesar eventos de tipo "payment"
  if (body?.type !== 'payment') return { ignorado: true };

  const xSignature = headers['x-signature']   || '';
  const xRequestId = headers['x-request-id']  || '';
  const dataId     = body?.data?.id?.toString() || '';

  if (!verifyMPSignature(xSignature, xRequestId, dataId)) {
    throw new AppError('Firma del webhook inválida', 401);
  }

  // Fetch payment details from MP API
  const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
    headers: { 'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` }
  });

  if (!mpRes.ok) {
    console.error(`[MP] Error consultando pago ${dataId}:`, await mpRes.text());
    throw new AppError('Error consultando el pago en MercadoPago', 502);
  }

  const payment = await mpRes.json();
  const cita_id = payment.external_reference;
  if (!cita_id) return { ignorado: true };

  const pago = await pagoRepo.findByCitaIdPublic(cita_id);
  if (!pago) return { ignorado: true };

  if (payment.status === 'approved') {
    await pagoRepo.marcarPagado(cita_id, dataId);
    await citaRepo.updateEstado(cita_id, pago.empresa_id, 'confirmada');
  } else if (payment.status === 'refunded' || payment.status === 'charged_back') {
    await pagoRepo.marcarReembolsado(cita_id);
    await citaRepo.updateEstado(cita_id, pago.empresa_id, 'cancelada');
  }

  return { procesado: true, status: payment.status };
}

module.exports = {
  obtenerPorCita, confirmarEfectivo, reembolsar,
  iniciarMercadoPago, procesarWebhookMP
};
