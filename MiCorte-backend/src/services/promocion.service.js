const promocionRepo = require('../repositories/promocion.repository');
const servicioRepo  = require('../repositories/servicio.repository');
const { AppError }  = require('../utils/errors');

async function listar(empresa_id, query) {
  return promocionRepo.findAll(empresa_id, {
    tipo:   query.tipo   || null,
    activo: query.activo !== undefined
              ? (query.activo === 'true' || query.activo === '1')
              : null
  });
}

async function obtener(id, empresa_id) {
  const promo = await promocionRepo.findById(id, empresa_id);
  if (!promo) throw new AppError('Promoción no encontrada', 404);
  return promo;
}

async function crear(empresa_id, data) {
  // Validar servicios si se envían
  if (data.servicios_ids && data.servicios_ids.length > 0) {
    for (const sid of data.servicios_ids) {
      const svc = await servicioRepo.findById(sid, empresa_id);
      if (!svc) throw new AppError(`Servicio ${sid} no encontrado`, 404);
    }
  }

  // Cumpleaños no requiere fechas; los demás tipos sí
  if (data.tipo !== 'cumpleanos' && !data.fecha_inicio) {
    throw new AppError('fecha_inicio es requerida para este tipo de promoción', 400);
  }

  return promocionRepo.create({ ...data, empresa_id });
}

async function actualizar(id, empresa_id, data) {
  const existe = await promocionRepo.findById(id, empresa_id);
  if (!existe) throw new AppError('Promoción no encontrada', 404);

  if (data.servicios_ids && data.servicios_ids.length > 0) {
    for (const sid of data.servicios_ids) {
      const svc = await servicioRepo.findById(sid, empresa_id);
      if (!svc) throw new AppError(`Servicio ${sid} no encontrado`, 404);
    }
  }

  // Merge: solo sobreescribe los campos enviados, conserva el resto
  const merged = {
    nombre:          data.nombre          ?? existe.nombre,
    tipo:            data.tipo            ?? existe.tipo,
    descuento_tipo:  data.descuento_tipo  ?? existe.descuento_tipo,
    descuento_valor: data.descuento_valor ?? existe.descuento_valor,
    fecha_inicio:    data.fecha_inicio    !== undefined ? data.fecha_inicio : existe.fecha_inicio,
    fecha_fin:       data.fecha_fin       !== undefined ? data.fecha_fin    : existe.fecha_fin,
    activo:          data.activo          !== undefined ? data.activo       : Boolean(existe.activo),
    servicios_ids:   data.servicios_ids   !== undefined ? data.servicios_ids : existe.servicios_ids
  };

  return promocionRepo.update(id, empresa_id, merged);
}

async function eliminar(id, empresa_id) {
  const deleted = await promocionRepo.softDelete(id, empresa_id);
  if (!deleted) throw new AppError('Promoción no encontrada', 404);
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
