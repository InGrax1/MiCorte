import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import EmptyState from '@/components/ui/EmptyState'

const ESTADOS = ['pendiente_pago', 'confirmada', 'en_proceso', 'completada', 'cancelada', 'no_show']

const TRANSITIONS = {
  pendiente_pago: ['confirmada', 'cancelada'],
  confirmada:     ['en_proceso', 'cancelada', 'no_show'],
  en_proceso:     ['completada', 'cancelada'],
  completada:     [],
  cancelada:      [],
  no_show:        [],
}

const inputCls = 'w-full rounded-lg border border-warm-200 px-3 py-2 text-sm text-warm-900 outline-none focus:border-gold-500 transition-colors'
const selectCls = 'w-full rounded-lg border border-warm-200 px-3 py-2 text-sm text-warm-900 outline-none focus:border-gold-500 transition-colors bg-white cursor-pointer'

function FormField({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1" style={{ color: '#6B6158' }}>{label}</label>
      {children}
    </div>
  )
}

function fmtFecha(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function fmtMoney(n) {
  if (n == null) return '—'
  return `$${Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const EMPTY_FORM = {
  cliente_id: '', sucursal_id: '', servicio_id: '',
  estilista_id: '', fecha_hora: '', metodo_pago: 'efectivo', notas_cliente: '',
}

export default function CitasPage() {
  const qc = useQueryClient()
  const [filters, setFilters] = useState({ fecha_inicio: '', fecha_fin: '', estado: '' })
  const [modalOpen, setModalOpen] = useState(false)
  const [formError, setFormError] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [clienteQ, setClienteQ] = useState('')
  const [clienteLabel, setClienteLabel] = useState('')

  const { data: citas = [], isLoading } = useQuery({
    queryKey: ['citas', filters],
    queryFn: async () => {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
      const res = await api.get('/citas', { params })
      const d = res.data.data
      return Array.isArray(d) ? d : (d?.citas ?? [])
    },
  })

  const { data: sucursales = [] } = useQuery({
    queryKey: ['sucursales'],
    queryFn: async () => {
      const res = await api.get('/sucursales')
      const d = res.data.data
      return Array.isArray(d) ? d : (d?.sucursales ?? [])
    },
    enabled: modalOpen,
  })

  const { data: servicios = [] } = useQuery({
    queryKey: ['servicios'],
    queryFn: async () => {
      const res = await api.get('/servicios')
      const d = res.data.data
      return Array.isArray(d) ? d : (d?.servicios ?? [])
    },
    enabled: modalOpen,
  })

  const { data: estilistas = [] } = useQuery({
    queryKey: ['estilistas'],
    queryFn: async () => {
      const res = await api.get('/estilistas')
      const d = res.data.data
      return Array.isArray(d) ? d : (d?.estilistas ?? [])
    },
    enabled: modalOpen,
  })

  const { data: clientesBusqueda = [] } = useQuery({
    queryKey: ['clientes-search', clienteQ],
    queryFn: async () => {
      const res = await api.get('/clientes', { params: { q: clienteQ } })
      const d = res.data.data
      return Array.isArray(d) ? d : (d?.clientes ?? [])
    },
    enabled: modalOpen && clienteQ.length >= 2 && !form.cliente_id,
  })

  const crear = useMutation({
    mutationFn: (body) => api.post('/citas', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['citas'] })
      setModalOpen(false)
      resetForm()
    },
    onError: (e) => setFormError(e.response?.data?.message || 'Error al crear la cita'),
  })

  const cambiarEstado = useMutation({
    mutationFn: ({ id, estado }) => api.patch(`/citas/${id}/estado`, { estado }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['citas'] }),
  })

  function resetForm() {
    setForm(EMPTY_FORM)
    setFormError(null)
    setClienteQ('')
    setClienteLabel('')
  }

  function handleCrear(e) {
    e.preventDefault()
    setFormError(null)
    if (!form.cliente_id) return setFormError('Selecciona un cliente')
    if (!form.sucursal_id) return setFormError('Selecciona una sucursal')
    if (!form.servicio_id) return setFormError('Selecciona un servicio')
    if (!form.fecha_hora) return setFormError('Ingresa fecha y hora')

    const body = {
      cliente_id:  form.cliente_id,
      sucursal_id: form.sucursal_id,
      servicio_id: form.servicio_id,
      fecha_hora:  new Date(form.fecha_hora).toISOString(),
      metodo_pago: form.metodo_pago,
    }
    if (form.estilista_id) body.estilista_id = form.estilista_id
    if (form.notas_cliente) body.notas_cliente = form.notas_cliente
    crear.mutate(body)
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex gap-2 flex-wrap flex-1 min-w-0">
          <input
            type="date"
            value={filters.fecha_inicio}
            onChange={e => setFilters(f => ({ ...f, fecha_inicio: e.target.value }))}
            className="rounded-lg border border-warm-200 px-3 py-2 text-sm outline-none focus:border-gold-500 transition-colors w-36"
          />
          <input
            type="date"
            value={filters.fecha_fin}
            onChange={e => setFilters(f => ({ ...f, fecha_fin: e.target.value }))}
            className="rounded-lg border border-warm-200 px-3 py-2 text-sm outline-none focus:border-gold-500 transition-colors w-36"
          />
          <select
            value={filters.estado}
            onChange={e => setFilters(f => ({ ...f, estado: e.target.value }))}
            className="rounded-lg border border-warm-200 px-3 py-2 text-sm outline-none focus:border-gold-500 transition-colors bg-white cursor-pointer w-44"
          >
            <option value="">Todos los estados</option>
            {ESTADOS.map(s => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => { resetForm(); setModalOpen(true) }}
          className="btn-gold px-4 py-2 text-sm rounded-lg cursor-pointer whitespace-nowrap"
        >
          + Nueva cita
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl card-md overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : citas.length === 0 ? (
          <EmptyState message="No hay citas para los filtros seleccionados" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #F5F3EE' }}>
                  {['Cliente', 'Estilista', 'Servicio', 'Fecha', 'Estado', 'Total', ''].map(h => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide ${h === 'Total' ? 'text-right' : 'text-left'}`}
                      style={{ color: '#8C8274' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {citas.map(c => {
                  const next = TRANSITIONS[c.estado] ?? []
                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid #FAFAF7' }} className="hover:bg-warm-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-warm-900">{c.cliente_nombre}</td>
                      <td className="px-4 py-3" style={{ color: '#6B6158' }}>{c.estilista_nombre}</td>
                      <td className="px-4 py-3" style={{ color: '#6B6158' }}>{c.servicio_nombre}</td>
                      <td className="px-4 py-3 whitespace-nowrap" style={{ color: '#8C8274' }}>{fmtFecha(c.fecha_hora)}</td>
                      <td className="px-4 py-3"><Badge estado={c.estado} /></td>
                      <td className="px-4 py-3 text-right font-medium text-warm-900">{fmtMoney(c.precio_final)}</td>
                      <td className="px-4 py-3">
                        {next.length > 0 && (
                          <select
                            defaultValue=""
                            onChange={e => {
                              if (e.target.value) {
                                cambiarEstado.mutate({ id: c.id, estado: e.target.value })
                                e.target.value = ''
                              }
                            }}
                            className="text-xs border border-warm-200 rounded-lg px-2 py-1 bg-white cursor-pointer outline-none focus:border-gold-500 transition-colors"
                            style={{ color: '#6B6158' }}
                          >
                            <option value="" disabled>Accion</option>
                            {next.map(st => (
                              <option key={st} value={st}>{st.replace(/_/g, ' ')}</option>
                            ))}
                          </select>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); resetForm() }}
        title="Nueva cita"
        size="lg"
        footer={
          <>
            <button
              onClick={() => { setModalOpen(false); resetForm() }}
              className="px-4 py-2 text-sm rounded-lg border border-warm-200 cursor-pointer transition-colors hover:bg-warm-50"
              style={{ color: '#6B6158' }}
            >
              Cancelar
            </button>
            <button
              form="form-crear-cita"
              type="submit"
              disabled={crear.isPending}
              className="btn-gold px-4 py-2 text-sm rounded-lg cursor-pointer flex items-center gap-2"
            >
              {crear.isPending && <Spinner size="sm" />}
              Crear cita
            </button>
          </>
        }
      >
        <form id="form-crear-cita" onSubmit={handleCrear} className="space-y-4">
          {formError && (
            <div className="rounded-lg px-4 py-2.5 text-sm" style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
              {formError}
            </div>
          )}

          {/* Cliente search */}
          <FormField label="Cliente *">
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={clienteLabel || clienteQ}
              onChange={e => {
                setClienteQ(e.target.value)
                setClienteLabel('')
                setForm(f => ({ ...f, cliente_id: '' }))
              }}
              className={inputCls}
              autoComplete="off"
            />
            {clienteQ.length >= 2 && clientesBusqueda.length > 0 && !form.cliente_id && (
              <div className="mt-1 bg-white border border-warm-200 rounded-lg shadow-md overflow-hidden z-10 relative">
                {clientesBusqueda.slice(0, 6).map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setForm(f => ({ ...f, cliente_id: c.id }))
                      setClienteLabel(c.nombre)
                      setClienteQ('')
                    }}
                    className="w-full text-left px-3 py-2.5 text-sm hover:bg-warm-50 cursor-pointer transition-colors border-b border-warm-50 last:border-0"
                    style={{ color: '#1A1713' }}
                  >
                    {c.nombre}
                    <span className="ml-2 text-xs" style={{ color: '#8C8274' }}>{c.email}</span>
                  </button>
                ))}
              </div>
            )}
            {form.cliente_id && (
              <p className="mt-1 text-xs" style={{ color: '#16A34A' }}>Cliente seleccionado</p>
            )}
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Sucursal *">
              <select value={form.sucursal_id} onChange={e => setForm(f => ({ ...f, sucursal_id: e.target.value }))} className={selectCls} required>
                <option value="">Seleccionar...</option>
                {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </FormField>
            <FormField label="Servicio *">
              <select value={form.servicio_id} onChange={e => setForm(f => ({ ...f, servicio_id: e.target.value }))} className={selectCls} required>
                <option value="">Seleccionar...</option>
                {servicios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Estilista (opcional)">
              <select value={form.estilista_id} onChange={e => setForm(f => ({ ...f, estilista_id: e.target.value }))} className={selectCls}>
                <option value="">Asignar automaticamente</option>
                {estilistas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </FormField>
            <FormField label="Metodo de pago *">
              <select value={form.metodo_pago} onChange={e => setForm(f => ({ ...f, metodo_pago: e.target.value }))} className={selectCls} required>
                <option value="efectivo">Efectivo</option>
                <option value="online">Online</option>
              </select>
            </FormField>
          </div>

          <FormField label="Fecha y hora *">
            <input
              type="datetime-local"
              value={form.fecha_hora}
              onChange={e => setForm(f => ({ ...f, fecha_hora: e.target.value }))}
              className={inputCls}
              required
            />
          </FormField>

          <FormField label="Notas del cliente (opcional)">
            <textarea
              value={form.notas_cliente}
              onChange={e => setForm(f => ({ ...f, notas_cliente: e.target.value }))}
              className={inputCls}
              rows={2}
              placeholder="Instrucciones o preferencias especiales..."
            />
          </FormField>
        </form>
      </Modal>
    </div>
  )
}
