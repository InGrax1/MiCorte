const retRepo = require('../repositories/retencion.repository');

function toMysqlDate(str) {
  if (!str) return undefined;
  const d = new Date(str);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString().slice(0, 10);
}

async function resumen(empresa_id, query) {
  return retRepo.getResumen(empresa_id, {
    sucursal_id:  query.sucursal_id  || null,
    fecha_inicio: toMysqlDate(query.fecha_inicio),
    fecha_fin:    toMysqlDate(query.fecha_fin)
  });
}

async function enRiesgo(empresa_id, query) {
  return retRepo.getEnRiesgo(empresa_id, {
    sucursal_id: query.sucursal_id || null,
    dias:        query.dias,
    limite:      query.limite
  });
}

async function topClientes(empresa_id, query) {
  return retRepo.getTopClientes(empresa_id, {
    sucursal_id:  query.sucursal_id  || null,
    fecha_inicio: toMysqlDate(query.fecha_inicio),
    fecha_fin:    toMysqlDate(query.fecha_fin),
    limite:       query.limite,
    orden:        query.orden
  });
}

async function cohortes(empresa_id, query) {
  return retRepo.getCohortes(empresa_id, {
    sucursal_id: query.sucursal_id || null
  });
}

module.exports = { resumen, enRiesgo, topClientes, cohortes };
