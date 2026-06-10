const reservaService = require('../services/reserva.service');
const { ok, badRequest } = require('../utils/response');

async function sucursales(req, res, next) {
  try {
    const data = await reservaService.listarSucursales();
    ok(res, data, 'Sucursales');
  } catch (e) { next(e); }
}

async function servicios(req, res, next) {
  try {
    const data = await reservaService.listarServicios(req.params.sucursal_id);
    ok(res, data, 'Servicios disponibles');
  } catch (e) { next(e); }
}

async function estilistas(req, res, next) {
  try {
    const data = await reservaService.listarEstilistas(req.params.sucursal_id);
    ok(res, data, 'Estilistas disponibles');
  } catch (e) { next(e); }
}

async function disponibilidad(req, res, next) {
  try {
    const { servicio_id, fecha, estilista_id } = req.query;
    if (!servicio_id || !fecha) return badRequest(res, 'servicio_id y fecha son requeridos', 400);
    const data = await reservaService.getSlots(req.params.sucursal_id, servicio_id, fecha, estilista_id);
    ok(res, data, 'Slots disponibles');
  } catch (e) { next(e); }
}

async function crear(req, res, next) {
  try {
    const { nombre, email, telefono, servicio_id, fecha_hora, estilista_id, notas } = req.body;
    if (!nombre || !email || !servicio_id || !fecha_hora)
      return badRequest(res, 'nombre, email, servicio_id y fecha_hora son requeridos', 400);
    const cita = await reservaService.crear(req.params.sucursal_id, { nombre, email, telefono, servicio_id, fecha_hora, estilista_id, notas });
    ok(res, cita, 'Reserva creada correctamente', 201);

  } catch (e) { next(e); }
}

module.exports = { sucursales, servicios, estilistas, disponibilidad, crear };
