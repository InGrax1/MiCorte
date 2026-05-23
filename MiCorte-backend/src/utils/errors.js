/**
 * AppError: error personalizado con código HTTP.
 * Se lanza desde services/repositories y lo captura
 * el error handler global de app.js con err.status.
 *
 * Uso:
 *   throw new AppError('Email o contraseña incorrectos', 401);
 *   throw new AppError('Tenant no encontrado', 404);
 */
class AppError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name    = 'AppError';
    this.status  = status;
  }
}

module.exports = { AppError };
