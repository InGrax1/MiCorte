const jwt        = require('jsonwebtoken');
const { AppError } = require('../utils/errors');

function clienteGuard(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return next(new AppError('Acceso no autorizado', 401));
  }
  const token = auth.slice(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.tipo !== 'cliente') {
      return next(new AppError('Acceso no autorizado', 401));
    }
    req.clienteId = decoded.cliente_id;
    req.empresaId = decoded.empresa_id;
    next();
  } catch {
    next(new AppError('Token inválido o expirado', 401));
  }
}

module.exports = clienteGuard;
