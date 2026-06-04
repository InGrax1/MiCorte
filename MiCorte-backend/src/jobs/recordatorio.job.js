const cron                    = require('node-cron');
const db                      = require('../config/db');
const { sendRecordatorio }    = require('../utils/email');
const { sendRecordatorioSMS } = require('../utils/sms');

// Busca citas confirmadas que estén en la ventana de 23-25 h a partir de ahora
// y que todavía no tengan el recordatorio enviado.
// Se ejecuta cada 30 minutos.
cron.schedule('*/30 * * * *', async () => {
  let citas;
  try {
    [citas] = await db.execute(`
      SELECT c.id, c.fecha_hora, c.sucursal_id,
             cl.email    AS cliente_email,    cl.nombre    AS cliente_nombre,
             cl.telefono AS cliente_telefono,
             e.nombre    AS estilista_nombre,
             s.nombre    AS servicio_nombre,
             suc.nombre  AS sucursal_nombre
      FROM citas c
      JOIN clientes cl    ON cl.id  = c.cliente_id
      JOIN estilistas e   ON e.id   = c.estilista_id
      JOIN servicios s    ON s.id   = c.servicio_id
      JOIN sucursales suc ON suc.id = c.sucursal_id
      WHERE c.estado              = 'confirmada'
        AND c.recordatorio_enviado = 0
        AND c.deleted_at          IS NULL
        AND c.fecha_hora BETWEEN DATE_ADD(NOW(), INTERVAL 23 HOUR)
                             AND DATE_ADD(NOW(), INTERVAL 25 HOUR)
    `);
  } catch (err) {
    console.error('[CRON] Error consultando citas para recordatorio:', err.message);
    return;
  }

  for (const cita of citas) {
    try {
      await sendRecordatorio(cita);
      await db.execute(
        `UPDATE citas SET recordatorio_enviado = 1 WHERE id = ?`,
        [cita.id]
      );
      // SMS: non-blocking — si falla no afecta el registro del recordatorio
      sendRecordatorioSMS(cita).catch(err =>
        console.error(`[SMS] Recordatorio fallido ${cita.id}:`, err.message)
      );
    } catch (err) {
      console.error(`[CRON] Recordatorio fallido para cita ${cita.id}:`, err.message);
    }
  }

  if (citas.length > 0) {
    console.log(`[CRON] Recordatorios enviados: ${citas.length}`);
  }
});

console.log('[CRON] Job de recordatorios registrado (cada 30 min)');
