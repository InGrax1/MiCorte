const mysql = require('mysql2/promise');

// createPool en lugar de createConnection:
// · Gestiona múltiples conexiones automáticamente.
// · Si MySQL corta el cable por timeout, el pool crea uno nuevo.
// · Permite peticiones concurrentes sin bloqueo.
const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               parseInt(process.env.DB_PORT) || 3306,
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'micorte',
  waitForConnections: true,
  connectionLimit:    10,    // máximo de conexiones simultáneas
  queueLimit:         0,     // sin límite de peticiones en espera
  timezone:           'Z',   // UTC — crítico para que las fechas cuadren
  decimalNumbers:     true   // DECIMAL vuelve como número JS, no string
});

module.exports = pool;