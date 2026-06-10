const MAP = {
  pendiente_pago: ['Pend. pago', '#FEF9C3', '#92400E'],
  confirmada:     ['Confirmada', '#DBEAFE', '#1E40AF'],
  en_proceso:     ['En proceso', '#EDE9FE', '#5B21B6'],
  completada:     ['Completada', '#DCFCE7', '#166534'],
  cancelada:      ['Cancelada',  '#F3F4F6', '#4B5563'],
  no_show:        ['No show',    '#FEE2E2', '#991B1B'],
  pendiente:      ['Pendiente',  '#FEF9C3', '#92400E'],
  procesando:     ['Procesando', '#DBEAFE', '#1E40AF'],
  enviado:        ['Enviado',    '#DBEAFE', '#1E40AF'],
  entregado:      ['Entregado',  '#DCFCE7', '#166534'],
  cancelado:      ['Cancelado',  '#F3F4F6', '#4B5563'],
  activo:         ['Activo',     '#DCFCE7', '#166534'],
  inactivo:       ['Inactivo',   '#F3F4F6', '#4B5563'],
  pagado:         ['Pagado',     '#DCFCE7', '#166534'],
  reembolsado:    ['Reembolsado','#EDE9FE', '#5B21B6'],
}

export default function Badge({ estado }) {
  const [label, bg, color] = MAP[estado] ?? [estado, '#F3F4F6', '#4B5563']
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
      style={{ backgroundColor: bg, color }}
    >
      {label}
    </span>
  )
}
