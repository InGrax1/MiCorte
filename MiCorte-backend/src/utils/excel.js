const ExcelJS = require('exceljs');

// Colores corporativos del reporte
const COLOR_HEADER  = '1E3A5F';  // azul oscuro
const COLOR_TEXT    = 'FFFFFF';
const COLOR_ALT     = 'EEF2F7';  // gris azulado claro para filas alternas

function autoWidth(worksheet) {
  worksheet.columns.forEach(col => {
    let max = col.header ? col.header.length : 10;
    col.eachCell({ includeEmpty: false }, cell => {
      const val = cell.value ? String(cell.value) : '';
      if (val.length > max) max = val.length;
    });
    col.width = Math.min(max + 4, 50);
  });
}

function styleHeader(worksheet) {
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell(cell => {
    cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_HEADER } };
    cell.font   = { bold: true, color: { argb: COLOR_TEXT }, size: 11 };
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'AAAAAA' } }
    };
    cell.alignment = { vertical: 'middle', wrapText: false };
  });
  headerRow.height = 22;
}

function styleDataRows(worksheet) {
  worksheet.eachRow((row, rowNum) => {
    if (rowNum === 1) return;
    const isAlt = rowNum % 2 === 0;
    row.eachCell({ includeEmpty: true }, cell => {
      if (isAlt) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_ALT } };
      }
      cell.alignment = { vertical: 'middle' };
    });
  });
}

// ── Generadores por reporte ───────────────────────────────────

async function buildIngresos(data, resumen, filtros) {
  const wb = new ExcelJS.Workbook();
  wb.creator  = 'MiCorte';
  wb.created  = new Date();

  // Hoja 1: Detalle
  const ws = wb.addWorksheet('Ingresos por cita');
  ws.columns = [
    { header: 'Fecha',          key: 'fecha',           style: { numFmt: 'yyyy-mm-dd' } },
    { header: 'Sucursal',       key: 'sucursal' },
    { header: 'Estilista',      key: 'estilista' },
    { header: 'Servicio',       key: 'servicio' },
    { header: 'Citas',          key: 'total_citas',     style: { numFmt: '#,##0' } },
    { header: 'Ingresos ($)',   key: 'ingresos',        style: { numFmt: '#,##0.00' } },
    { header: 'Descuentos ($)', key: 'descuentos',      style: { numFmt: '#,##0.00' } },
    { header: 'Neto ($)',       key: 'ingresos_netos',  style: { numFmt: '#,##0.00' } },
  ];

  data.forEach(row => ws.addRow(row));
  styleHeader(ws);
  styleDataRows(ws);
  autoWidth(ws);

  // Hoja 2: Resumen
  const ws2 = wb.addWorksheet('Resumen');
  ws2.addRow(['Resumen de ingresos']);
  ws2.addRow([]);
  if (filtros.fecha_inicio) ws2.addRow(['Desde', filtros.fecha_inicio]);
  if (filtros.fecha_fin)    ws2.addRow(['Hasta', filtros.fecha_fin]);
  ws2.addRow([]);
  ws2.addRow(['Total citas',       resumen.total_citas]);
  ws2.addRow(['Ingresos brutos',   resumen.ingresos_brutos]);
  ws2.addRow(['Total descuentos',  resumen.total_descuentos]);
  ws2.addRow(['Ingresos netos',    resumen.ingresos_netos]);
  ws2.addRow(['Ticket promedio',   parseFloat(resumen.ticket_promedio || 0).toFixed(2)]);
  ws2.getRow(1).font = { bold: true, size: 13 };

  return wb.xlsx.writeBuffer();
}

async function buildCitas(data, filtros) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'MiCorte';
  wb.created = new Date();

  const ws = wb.addWorksheet('Citas');
  ws.columns = [
    { header: 'Fecha',     key: 'fecha' },
    { header: 'Hora',      key: 'hora' },
    { header: 'Sucursal',  key: 'sucursal' },
    { header: 'Cliente',   key: 'cliente' },
    { header: 'Telefono',  key: 'cliente_telefono' },
    { header: 'Estilista', key: 'estilista' },
    { header: 'Servicio',  key: 'servicio' },
    { header: 'Duracion',  key: 'duracion_min', style: { numFmt: '#,##0' } },
    { header: 'Precio ($)', key: 'precio_final', style: { numFmt: '#,##0.00' } },
    { header: 'Pago',      key: 'metodo_pago' },
    { header: 'Estado',    key: 'estado' },
  ];

  data.forEach(row => ws.addRow(row));
  styleHeader(ws);
  styleDataRows(ws);
  autoWidth(ws);

  return wb.xlsx.writeBuffer();
}

async function buildInventario(data, resumen) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'MiCorte';
  wb.created = new Date();

  const ws = wb.addWorksheet('Inventario');
  ws.columns = [
    { header: 'Sucursal',        key: 'sucursal' },
    { header: 'Categoria',       key: 'categoria' },
    { header: 'Producto',        key: 'producto' },
    { header: 'SKU',             key: 'sku' },
    { header: 'Marca',           key: 'marca' },
    { header: 'Precio ($)',      key: 'precio_unitario', style: { numFmt: '#,##0.00' } },
    { header: 'Stock actual',    key: 'stock_actual',    style: { numFmt: '#,##0' } },
    { header: 'Stock minimo',    key: 'stock_minimo',    style: { numFmt: '#,##0' } },
    { header: 'Valuacion ($)',   key: 'valuacion',       style: { numFmt: '#,##0.00' } },
    { header: 'Alerta',         key: 'alerta' },
  ];

  data.forEach(row => {
    const r = ws.addRow(row);
    if (row.alerta === 'BAJO') {
      r.getCell('alerta').font = { bold: true, color: { argb: 'CC0000' } };
    }
  });

  // Fila de totales
  ws.addRow([]);
  ws.addRow([
    'TOTALES', '', '', '', '', '',
    resumen.total_productos,
    '',
    parseFloat(resumen.valuacion_total || 0).toFixed(2),
    `${resumen.productos_bajo_minimo} bajo minimo`
  ]).font = { bold: true };

  styleHeader(ws);
  styleDataRows(ws);
  autoWidth(ws);

  return wb.xlsx.writeBuffer();
}

async function buildNoShows(data, resumen, filtros) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'MiCorte';
  wb.created = new Date();

  const ws = wb.addWorksheet('No-shows y cancelaciones');
  ws.columns = [
    { header: 'Fecha',           key: 'fecha' },
    { header: 'Sucursal',        key: 'sucursal' },
    { header: 'Estilista',       key: 'estilista' },
    { header: 'Cliente',         key: 'cliente' },
    { header: 'Telefono',        key: 'cliente_telefono' },
    { header: 'Servicio',        key: 'servicio' },
    { header: 'Estado',          key: 'estado' },
    { header: 'Ingreso perdido', key: 'ingreso_perdido', style: { numFmt: '#,##0.00' } },
  ];

  data.forEach(row => ws.addRow(row));

  const ws2 = wb.addWorksheet('Resumen');
  ws2.addRow(['Resumen no-shows y cancelaciones']);
  ws2.addRow([]);
  ws2.addRow(['Total registros',    resumen.total]);
  ws2.addRow(['No-shows',           resumen.no_shows]);
  ws2.addRow(['Canceladas',         resumen.canceladas]);
  ws2.addRow(['Ingresos perdidos',  parseFloat(resumen.ingresos_perdidos || 0).toFixed(2)]);
  ws2.getRow(1).font = { bold: true, size: 13 };

  styleHeader(ws);
  styleDataRows(ws);
  autoWidth(ws);

  return wb.xlsx.writeBuffer();
}

async function buildEstilistas(data, filtros) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'MiCorte';
  wb.created = new Date();

  const ws = wb.addWorksheet('Rendimiento estilistas');
  ws.columns = [
    { header: 'Estilista',       key: 'estilista' },
    { header: 'Sucursal',        key: 'sucursal' },
    { header: 'Total citas',     key: 'total_citas',       style: { numFmt: '#,##0' } },
    { header: 'Completadas',     key: 'completadas',       style: { numFmt: '#,##0' } },
    { header: 'No-shows',        key: 'no_shows',          style: { numFmt: '#,##0' } },
    { header: 'Canceladas',      key: 'canceladas',        style: { numFmt: '#,##0' } },
    { header: 'Ingresos ($)',    key: 'ingresos_generados',style: { numFmt: '#,##0.00' } },
    { header: '% No-show',       key: 'tasa_no_show_pct',  style: { numFmt: '0.0' } },
  ];

  data.forEach(row => ws.addRow(row));
  styleHeader(ws);
  styleDataRows(ws);
  autoWidth(ws);

  return wb.xlsx.writeBuffer();
}

module.exports = { buildIngresos, buildCitas, buildInventario, buildNoShows, buildEstilistas };
