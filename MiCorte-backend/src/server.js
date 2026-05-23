require('dotenv').config();
const app = require('./app');
const db  = require('./config/db');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    // Verificar conexión a la BD antes de levantar el servidor
    await db.getConnection().then(conn => {
      console.log('✅ Conectado a MySQL');
      conn.release();
    });

    app.listen(PORT, () => {
      console.log(`🚀 MiCorte API corriendo en http://localhost:${PORT}`);
      console.log(`   Entorno: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (err) {
    console.error('❌ No se pudo conectar a la BD:', err.message);
    process.exit(1);   // si no hay BD, no levantamos el servidor
  }
}

start();