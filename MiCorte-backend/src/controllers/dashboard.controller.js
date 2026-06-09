const dashboardService = require('../services/dashboard.service');
const { ok }           = require('../utils/response');

async function getKpis(req, res, next) {
  try {
    const { sucursal_id } = req.query;
    const data = await dashboardService.getKpis(req.empresaId, sucursal_id || null);
    ok(res, data, 'KPIs obtenidos exitosamente');
  } catch (err) {
    next(err);
  }
}

module.exports = { getKpis };
