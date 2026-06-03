const PDFDocument = require('pdfkit');

const BLUE   = '#1E3A5F';
const GRAY   = '#666666';
const LGRAY  = '#F5F7FA';
const BLACK  = '#1A1A1A';

function header(doc, titulo, subtitulo) {
  doc.rect(0, 0, doc.page.width, 70).fill(BLUE);
  doc.fillColor('#FFFFFF').fontSize(20).font('Helvetica-Bold')
     .text('MiCorte', 40, 18);
  doc.fontSize(11).font('Helvetica')
     .text(titulo, 40, 42);
  doc.fillColor(BLACK).fontSize(10).font('Helvetica')
     .text(subtitulo || `Generado: ${new Date().toLocaleDateString('es-MX')}`, 40, 80);
  doc.moveDown(1.5);
}

function sectionTitle(doc, texto) {
  doc.moveDown(0.5);
  doc.fontSize(12).font('Helvetica-Bold').fillColor(BLUE).text(texto);
  doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y)
     .strokeColor(BLUE).lineWidth(1).stroke();
  doc.moveDown(0.5);
  doc.fillColor(BLACK).font('Helvetica').fontSize(9);
}

function resumenRow(doc, label, value) {
  doc.fontSize(10).font('Helvetica-Bold').fillColor(GRAY).text(label, { continued: true });
  doc.font('Helvetica').fillColor(BLACK).text(`  ${value}`);
}

function table(doc, columns, rows, { startY } = {}) {
  const pageW  = doc.page.width - 80;
  const colW   = pageW / columns.length;
  let y        = startY || doc.y;
  const rowH   = 18;

  // Cabecera
  doc.rect(40, y, pageW, rowH).fill(BLUE);
  doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
  columns.forEach((col, i) => {
    doc.text(col, 44 + i * colW, y + 4, { width: colW - 4, lineBreak: false });
  });
  y += rowH;

  // Filas de datos
  rows.forEach((row, ri) => {
    // Nueva página si hace falta
    if (y + rowH > doc.page.height - 60) {
      doc.addPage();
      y = 40;
      // Repetir cabecera
      doc.rect(40, y, pageW, rowH).fill(BLUE);
      doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
      columns.forEach((col, i) => {
        doc.text(col, 44 + i * colW, y + 4, { width: colW - 4, lineBreak: false });
      });
      y += rowH;
    }

    const isAlt = ri % 2 === 0;
    doc.rect(40, y, pageW, rowH).fill(isAlt ? LGRAY : '#FFFFFF');
    doc.fillColor(BLACK).fontSize(8).font('Helvetica');
    row.forEach((cell, i) => {
      doc.text(String(cell ?? '-'), 44 + i * colW, y + 4, { width: colW - 4, lineBreak: false });
    });
    y += rowH;
  });

  doc.y = y + 4;
}

// ── Generadores por reporte ───────────────────────────────────

function buildIngresosPDF(data, resumen, filtros) {
  return new Promise((resolve, reject) => {
    const doc    = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
    const chunks = [];
    doc.on('data',  c => chunks.push(c));
    doc.on('end',   () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    header(doc, 'Reporte de Ingresos',
      filtros.fecha_inicio ? `${filtros.fecha_inicio} — ${filtros.fecha_fin || 'hoy'}` : 'Todos los periodos'
    );

    sectionTitle(doc, 'Resumen');
    resumenRow(doc, 'Total citas:',       resumen.total_citas ?? 0);
    resumenRow(doc, 'Ingresos brutos:',  `$${parseFloat(resumen.ingresos_brutos   || 0).toFixed(2)}`);
    resumenRow(doc, 'Total descuentos:', `$${parseFloat(resumen.total_descuentos  || 0).toFixed(2)}`);
    resumenRow(doc, 'Ingresos netos:',   `$${parseFloat(resumen.ingresos_netos    || 0).toFixed(2)}`);
    resumenRow(doc, 'Ticket promedio:',  `$${parseFloat(resumen.ticket_promedio   || 0).toFixed(2)}`);

    sectionTitle(doc, 'Detalle por cita');
    table(doc,
      ['Fecha', 'Sucursal', 'Estilista', 'Servicio', 'Citas', 'Ingresos $', 'Descuentos $', 'Neto $'],
      data.map(r => [
        r.fecha, r.sucursal, r.estilista, r.servicio,
        r.total_citas,
        parseFloat(r.ingresos       || 0).toFixed(2),
        parseFloat(r.descuentos     || 0).toFixed(2),
        parseFloat(r.ingresos_netos || 0).toFixed(2),
      ])
    );

    doc.end();
  });
}

function buildCitasPDF(data, filtros) {
  return new Promise((resolve, reject) => {
    const doc    = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
    const chunks = [];
    doc.on('data',  c => chunks.push(c));
    doc.on('end',   () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    header(doc, 'Reporte de Citas',
      filtros.fecha ? `Fecha: ${filtros.fecha}` : 'Todas las fechas'
    );

    sectionTitle(doc, `${data.length} citas encontradas`);
    table(doc,
      ['Fecha', 'Hora', 'Cliente', 'Estilista', 'Servicio', 'Precio $', 'Pago', 'Estado'],
      data.map(r => [
        r.fecha, r.hora, r.cliente, r.estilista, r.servicio,
        parseFloat(r.precio_final || 0).toFixed(2),
        r.metodo_pago, r.estado
      ])
    );

    doc.end();
  });
}

function buildInventarioPDF(data, resumen) {
  return new Promise((resolve, reject) => {
    const doc    = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
    const chunks = [];
    doc.on('data',  c => chunks.push(c));
    doc.on('end',   () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    header(doc, 'Reporte de Inventario');

    sectionTitle(doc, 'Resumen');
    resumenRow(doc, 'Total productos:',   resumen.total_productos ?? 0);
    resumenRow(doc, 'Valuacion total:',  `$${parseFloat(resumen.valuacion_total || 0).toFixed(2)}`);
    resumenRow(doc, 'Bajo minimo:',       resumen.productos_bajo_minimo ?? 0);

    sectionTitle(doc, 'Detalle de stock');
    table(doc,
      ['Sucursal', 'Categoria', 'Producto', 'SKU', 'Precio $', 'Stock', 'Minimo', 'Valuacion $', 'Alerta'],
      data.map(r => [
        r.sucursal, r.categoria, r.producto, r.sku ?? '-',
        parseFloat(r.precio_unitario || 0).toFixed(2),
        r.stock_actual, r.stock_minimo,
        parseFloat(r.valuacion || 0).toFixed(2),
        r.alerta
      ])
    );

    doc.end();
  });
}

function buildNoShowsPDF(data, resumen, filtros) {
  return new Promise((resolve, reject) => {
    const doc    = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
    const chunks = [];
    doc.on('data',  c => chunks.push(c));
    doc.on('end',   () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    header(doc, 'Reporte de No-shows y Cancelaciones');

    sectionTitle(doc, 'Resumen');
    resumenRow(doc, 'Total:',             resumen.total ?? 0);
    resumenRow(doc, 'No-shows:',          resumen.no_shows ?? 0);
    resumenRow(doc, 'Canceladas:',        resumen.canceladas ?? 0);
    resumenRow(doc, 'Ingresos perdidos:', `$${parseFloat(resumen.ingresos_perdidos || 0).toFixed(2)}`);

    sectionTitle(doc, 'Detalle');
    table(doc,
      ['Fecha', 'Sucursal', 'Estilista', 'Cliente', 'Servicio', 'Estado', 'Perdido $'],
      data.map(r => [
        r.fecha, r.sucursal, r.estilista, r.cliente,
        r.servicio, r.estado,
        parseFloat(r.ingreso_perdido || 0).toFixed(2)
      ])
    );

    doc.end();
  });
}

function buildEstilistasPDF(data, filtros) {
  return new Promise((resolve, reject) => {
    const doc    = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
    const chunks = [];
    doc.on('data',  c => chunks.push(c));
    doc.on('end',   () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    header(doc, 'Rendimiento por Estilista',
      filtros.fecha_inicio ? `${filtros.fecha_inicio} — ${filtros.fecha_fin || 'hoy'}` : 'Todos los periodos'
    );

    sectionTitle(doc, 'Rendimiento individual');
    table(doc,
      ['Estilista', 'Sucursal', 'Total', 'Completadas', 'No-shows', 'Canceladas', 'Ingresos $', '% No-show'],
      data.map(r => [
        r.estilista, r.sucursal,
        r.total_citas, r.completadas, r.no_shows, r.canceladas,
        parseFloat(r.ingresos_generados || 0).toFixed(2),
        `${r.tasa_no_show_pct ?? 0}%`
      ])
    );

    doc.end();
  });
}

module.exports = {
  buildIngresosPDF, buildCitasPDF, buildInventarioPDF,
  buildNoShowsPDF, buildEstilistasPDF
};
