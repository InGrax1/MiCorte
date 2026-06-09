const dashboardRepo = require('../repositories/dashboard.repository');

async function getKpis(empresa_id, sucursal_id) {
  return dashboardRepo.getKpis(empresa_id, sucursal_id || null);
}

module.exports = { getKpis };
