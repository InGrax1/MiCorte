/**
 * test-sms.js
 * Prueba directa de las dos funciones SMS sin levantar el servidor.
 * Ejecutar: node test-sms.js <telefono_destino>
 * Ejemplo:  node test-sms.js +5215512345678
 */
require('dotenv').config();

const { sendRecordatorioSMS, sendResenaSMS } = require('./src/utils/sms');

const destino = process.argv[2];

if (!destino) {
  console.error('Uso: node test-sms.js <telefono_destino>');
  console.error('Ejemplo: node test-sms.js +5215512345678');
  process.exit(1);
}

// Verificar que las vars de entorno estan cargadas
const vars = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE', 'FRONTEND_URL'];
const faltantes = vars.filter(v => !process.env[v]);
if (faltantes.length) {
  console.error('Faltan variables de entorno:', faltantes.join(', '));
  process.exit(1);
}

console.log('Twilio FROM:', process.env.TWILIO_PHONE);
console.log('Destino    :', destino);
console.log('');

async function run() {
  // -- Test 1: Recordatorio --
  console.log('--- TEST 1: sendRecordatorioSMS ---');
  try {
    await sendRecordatorioSMS({
      cliente_telefono:  destino,
      cliente_nombre:    'Juan Prueba',
      servicio_nombre:   'Corte de cabello',
      estilista_nombre:  'Carlos López',
      sucursal_nombre:   'Barbería Demo Centro',
      fecha_hora:        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });
    console.log('OK — SMS de recordatorio enviado');
  } catch (err) {
    console.error('ERROR:', err.message);
  }

  console.log('');

  // -- Test 2: Resena --
  console.log('--- TEST 2: sendResenaSMS ---');
  try {
    await sendResenaSMS({
      telefono:         destino,
      cliente_nombre:   'Juan Prueba',
      token:            'token-de-prueba-12345',
      sucursal_nombre:  'Barbería Demo Centro',
      estilista_nombre: 'Carlos López'
    });
    console.log('OK — SMS de resena enviado');
  } catch (err) {
    console.error('ERROR:', err.message);
  }
}

run();
