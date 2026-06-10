import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import Spinner from '@/components/ui/Spinner'
import Modal from '@/components/ui/Modal'
import EmptyState from '@/components/ui/EmptyState'

const inputCls = 'w-full rounded-lg border border-warm-200 px-3 py-2 text-sm text-warm-900 outline-none focus:border-gold-500 transition-colors'

function FormField({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1" style={{ color: '#6B6158' }}>{label}</label>
      {children}
    </div>
  )
}

function Avatar({ nombre, size = 8 }) {
  const initials = (nombre ?? '?')
    .split(' ')
    .slice(0, 2)
    .map(p => p[0])
    .join('')
    .toUpperCase()
  return (
    <div
      className={`w-${size} h-${size} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
      style={{ background: 'linear-gradient(135deg, #C9A84C 0%, #9A7C2E 100%)' }}
    >
      {initials}
    </div>
  )
}

const EMPTY_FORM = { nombre: '', email: '', telefono: '', fecha_nacimiento: '' }

export default function ClientesPage() {
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [formError, setFormError] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [selected, setSelected] = useState(null)

  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ['clientes', q],
    queryFn: async () => {
      const params = q ? { q } : {}
      const res = await api.get('/clientes', { params })
      const d = res.data.data
      return Array.isArray(d) ? d : (d?.clientes ?? [])
    },
    keepPreviousData: true,
  })

  const crear = useMutation({
    mutationFn: (body) => api.post('/clientes', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientes'] })
      setModalOpen(false)
      setForm(EMPTY_FORM)
      setFormError(null)
    },
    onError: (e) => setFormError(e.response?.data?.message || 'Error al crear cliente'),
  })

  function handleCrear(e) {
    e.preventDefault()
    setFormError(null)
    const body = { nombre: form.nombre, email: form.email }
    if (form.telefono) body.telefono = form.telefono
    if (form.fecha_nacimiento) body.fecha_nacimiento = form.fecha_nacimiento
    crear.mutate(body)
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-xs">
          <svg
            xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2"
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: '#B8B0A0' }}
          >
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={q}
            onChange={e => setQ(e.target.value)}
            className="w-full rounded-lg border border-warm-200 pl-8 pr-3 py-2 text-sm outline-none focus:border-gold-500 transition-colors"
          />
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="btn-gold px-4 py-2 text-sm rounded-lg cursor-pointer whitespace-nowrap"
        >
          + Nuevo cliente
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl card-md overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : clientes.length === 0 ? (
          <EmptyState
            message="No se encontraron clientes"
            description={q ? 'Intenta con otro termino de busqueda' : 'Agrega el primer cliente'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #F5F3EE' }}>
                  {['Nombre', 'Email', 'Telefono', 'Puntos', 'Registro'].map((h, i) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide ${i === 3 ? 'text-right' : 'text-left'}`}
                      style={{ color: '#8C8274' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clientes.map(c => (
                  <tr
                    key={c.id}
                    style={{ borderBottom: '1px solid #FAFAF7' }}
                    className="hover:bg-warm-50 transition-colors cursor-pointer"
                    onClick={() => setSelected(c)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar nombre={c.nombre} />
                        <span className="font-medium text-warm-900">{c.nombre}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: '#8C8274' }}>{c.email}</td>
                    <td className="px-4 py-3" style={{ color: '#8C8274' }}>{c.telefono || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: '#FEF9C3', color: '#92400E' }}
                      >
                        {c.puntos_acumulados ?? 0} pts
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#B8B0A0' }}>
                      {new Date(c.created_at).toLocaleDateString('es-MX')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Perfil del cliente"
        size="sm"
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #C9A84C 0%, #9A7C2E 100%)' }}
              >
                {(selected.nombre ?? '?').split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-warm-900">{selected.nombre}</p>
                <p className="text-sm" style={{ color: '#8C8274' }}>{selected.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ['Telefono', selected.telefono || '—'],
                ['Cumpleanos', selected.fecha_nacimiento ? new Date(selected.fecha_nacimiento).toLocaleDateString('es-MX') : '—'],
                ['Puntos acumulados', selected.puntos_acumulados ?? 0],
                ['Cliente desde', new Date(selected.created_at).toLocaleDateString('es-MX')],
              ].map(([label, val], i) => (
                <div key={i}>
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#B8B0A0' }}>{label}</p>
                  <p className="mt-0.5 font-medium text-warm-900" style={label === 'Puntos acumulados' ? { color: '#C9A84C' } : {}}>
                    {val}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Create Modal */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setFormError(null) }}
        title="Nuevo cliente"
        size="sm"
        footer={
          <>
            <button
              onClick={() => { setModalOpen(false); setFormError(null) }}
              className="px-4 py-2 text-sm rounded-lg border border-warm-200 cursor-pointer transition-colors hover:bg-warm-50"
              style={{ color: '#6B6158' }}
            >
              Cancelar
            </button>
            <button
              form="form-crear-cliente"
              type="submit"
              disabled={crear.isPending}
              className="btn-gold px-4 py-2 text-sm rounded-lg cursor-pointer flex items-center gap-2"
            >
              {crear.isPending && <Spinner size="sm" />}
              Crear cliente
            </button>
          </>
        }
      >
        <form id="form-crear-cliente" onSubmit={handleCrear} className="space-y-4">
          {formError && (
            <div className="rounded-lg px-4 py-2.5 text-sm" style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
              {formError}
            </div>
          )}
          <FormField label="Nombre completo *">
            <input
              type="text" value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              className={inputCls} required placeholder="Ej. Maria Garcia"
            />
          </FormField>
          <FormField label="Email *">
            <input
              type="email" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className={inputCls} required placeholder="correo@ejemplo.com"
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Telefono">
              <input
                type="tel" value={form.telefono}
                onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                className={inputCls} placeholder="+52 55 0000 0000"
              />
            </FormField>
            <FormField label="Fecha de nacimiento">
              <input
                type="date" value={form.fecha_nacimiento}
                onChange={e => setForm(f => ({ ...f, fecha_nacimiento: e.target.value }))}
                className={inputCls}
              />
            </FormField>
          </div>
        </form>
      </Modal>
    </div>
  )
}
