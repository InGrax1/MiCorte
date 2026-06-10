import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import Spinner from '@/components/ui/Spinner'
import Modal from '@/components/ui/Modal'
import EmptyState from '@/components/ui/EmptyState'

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

function ErrorBanner({ msg }) {
  if (!msg) return null
  return (
    <div className="rounded-lg px-4 py-2.5 text-sm" style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
      {msg}
    </div>
  )
}

const EMPTY_FORM = { nombre: '', descripcion: '', precio_base: '', duracion_min: '' }

export default function ServiciosPage() {
  const qc = useQueryClient()
  const usuario = useAuthStore(s => s.usuario)
  const esSuperAdmin = usuario?.roles?.includes('super_admin')

  // --- Modals state ---
  const [createOpen,      setCreateOpen]      = useState(false)
  const [editTarget,      setEditTarget]      = useState(null) // service object
  const [sucursalesTarget, setSucursalesTarget] = useState(null) // { id, nombre }
  const [deleteTarget,    setDeleteTarget]    = useState(null) // { id, nombre }

  // --- Form state ---
  const [form,        setForm]        = useState(EMPTY_FORM)
  const [formError,   setFormError]   = useState(null)
  const [asignarForm, setAsignarForm] = useState({ sucursal_id: '', precio: '' })
  const [asignarErr,  setAsignarErr]  = useState(null)

  // --- Queries ---
  const { data: servicios = [], isLoading } = useQuery({
    queryKey: ['servicios'],
    queryFn: async () => {
      const res = await api.get('/servicios')
      const d = res.data.data
      return Array.isArray(d) ? d : []
    },
  })

  const { data: todasSucursales = [] } = useQuery({
    queryKey: ['sucursales'],
    queryFn: async () => {
      const res = await api.get('/sucursales')
      const d = res.data.data
      return Array.isArray(d) ? d : (d?.sucursales ?? [])
    },
    enabled: !!sucursalesTarget || createOpen || !!editTarget,
  })

  const { data: servicioDetalle, isLoading: detalleLoading } = useQuery({
    queryKey: ['servicio', sucursalesTarget?.id],
    queryFn: async () => {
      const res = await api.get(`/servicios/${sucursalesTarget.id}`)
      return res.data.data
    },
    enabled: !!sucursalesTarget,
  })

  // Populate edit form
  useEffect(() => {
    if (editTarget) {
      setForm({
        nombre:      editTarget.nombre      ?? '',
        descripcion: editTarget.descripcion ?? '',
        precio_base: editTarget.precio_base ?? '',
        duracion_min: editTarget.duracion_min ?? '',
      })
      setFormError(null)
    }
  }, [editTarget])

  // Reset asignar form when modal opens
  useEffect(() => {
    if (sucursalesTarget) {
      setAsignarForm({ sucursal_id: '', precio: '' })
      setAsignarErr(null)
    }
  }, [sucursalesTarget])

  // --- Mutations ---
  const crear = useMutation({
    mutationFn: (body) => api.post('/servicios', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['servicios'] })
      setCreateOpen(false)
      setForm(EMPTY_FORM)
      setFormError(null)
    },
    onError: (e) => setFormError(e.response?.data?.message || 'Error al crear servicio'),
  })

  const actualizar = useMutation({
    mutationFn: ({ id, body }) => api.put(`/servicios/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['servicios'] })
      setEditTarget(null)
      setFormError(null)
    },
    onError: (e) => setFormError(e.response?.data?.message || 'Error al actualizar servicio'),
  })

  const eliminar = useMutation({
    mutationFn: (id) => api.delete(`/servicios/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['servicios'] })
      setDeleteTarget(null)
    },
  })

  const asignar = useMutation({
    mutationFn: ({ id, body }) => api.post(`/servicios/${id}/sucursales`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['servicio', sucursalesTarget.id] })
      qc.invalidateQueries({ queryKey: ['servicios'] })
      setAsignarForm({ sucursal_id: '', precio: '' })
      setAsignarErr(null)
    },
    onError: (e) => setAsignarErr(e.response?.data?.message || 'Error al asignar sucursal'),
  })

  const remover = useMutation({
    mutationFn: ({ servicioId, sucursalId }) => api.delete(`/servicios/${servicioId}/sucursales/${sucursalId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['servicio', sucursalesTarget.id] })
      qc.invalidateQueries({ queryKey: ['servicios'] })
    },
  })

  // --- Handlers ---
  function handleCrear(e) {
    e.preventDefault()
    setFormError(null)
    crear.mutate({
      nombre:       form.nombre,
      descripcion:  form.descripcion || undefined,
      precio_base:  Number(form.precio_base),
      duracion_min: Number(form.duracion_min),
    })
  }

  function handleActualizar(e) {
    e.preventDefault()
    setFormError(null)
    actualizar.mutate({
      id: editTarget.id,
      body: {
        nombre:       form.nombre,
        descripcion:  form.descripcion || undefined,
        precio_base:  Number(form.precio_base),
        duracion_min: Number(form.duracion_min),
      },
    })
  }

  function handleAsignar(e) {
    e.preventDefault()
    setAsignarErr(null)
    asignar.mutate({
      id: sucursalesTarget.id,
      body: {
        sucursal_id: asignarForm.sucursal_id,
        precio: asignarForm.precio ? Number(asignarForm.precio) : undefined,
      },
    })
  }

  // Sucursales ya asignadas al servicio
  const asignadas = servicioDetalle?.sucursales ?? []
  const asignadasIds = new Set(asignadas.map(a => a.sucursal_id))
  const sucursalesDisponibles = todasSucursales.filter(s => !asignadasIds.has(s.id))

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: '#8C8274' }}>
          {servicios.length} {servicios.length === 1 ? 'servicio' : 'servicios'}
        </p>
        <button
          onClick={() => { setForm(EMPTY_FORM); setFormError(null); setCreateOpen(true) }}
          className="btn-gold px-4 py-2 text-sm rounded-lg cursor-pointer"
        >
          + Nuevo servicio
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : servicios.length === 0 ? (
        <EmptyState message="No hay servicios registrados" description="Crea el primer servicio para comenzar" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {servicios.map(s => (
            <ServiceCard
              key={s.id}
              servicio={s}
              esSuperAdmin={esSuperAdmin}
              onEdit={() => setEditTarget(s)}
              onSucursales={() => setSucursalesTarget({ id: s.id, nombre: s.nombre })}
              onDelete={() => setDeleteTarget({ id: s.id, nombre: s.nombre })}
            />
          ))}
        </div>
      )}

      {/* Modal: Crear */}
      <Modal
        open={createOpen}
        onClose={() => { setCreateOpen(false); setFormError(null) }}
        title="Nuevo servicio"
        size="md"
        footer={
          <>
            <button
              onClick={() => { setCreateOpen(false); setFormError(null) }}
              className="px-4 py-2 text-sm rounded-lg border border-warm-200 cursor-pointer hover:bg-warm-50"
              style={{ color: '#6B6158' }}
            >
              Cancelar
            </button>
            <button
              form="form-crear-servicio"
              type="submit"
              disabled={crear.isPending}
              className="btn-gold px-4 py-2 text-sm rounded-lg cursor-pointer flex items-center gap-2"
            >
              {crear.isPending && <Spinner size="sm" />}
              Crear servicio
            </button>
          </>
        }
      >
        <ServicioForm
          id="form-crear-servicio"
          form={form}
          setForm={setForm}
          onSubmit={handleCrear}
          error={formError}
        />
      </Modal>

      {/* Modal: Editar */}
      <Modal
        open={!!editTarget}
        onClose={() => { setEditTarget(null); setFormError(null) }}
        title={editTarget ? `Editar — ${editTarget.nombre}` : 'Editar servicio'}
        size="md"
        footer={
          <>
            <button
              onClick={() => { setEditTarget(null); setFormError(null) }}
              className="px-4 py-2 text-sm rounded-lg border border-warm-200 cursor-pointer hover:bg-warm-50"
              style={{ color: '#6B6158' }}
            >
              Cancelar
            </button>
            <button
              form="form-editar-servicio"
              type="submit"
              disabled={actualizar.isPending}
              className="btn-gold px-4 py-2 text-sm rounded-lg cursor-pointer flex items-center gap-2"
            >
              {actualizar.isPending && <Spinner size="sm" />}
              Guardar cambios
            </button>
          </>
        }
      >
        <ServicioForm
          id="form-editar-servicio"
          form={form}
          setForm={setForm}
          onSubmit={handleActualizar}
          error={formError}
        />
      </Modal>

      {/* Modal: Sucursales */}
      <Modal
        open={!!sucursalesTarget}
        onClose={() => setSucursalesTarget(null)}
        title={sucursalesTarget ? `Sucursales — ${sucursalesTarget.nombre}` : 'Sucursales'}
        size="md"
        footer={
          <button
            onClick={() => setSucursalesTarget(null)}
            className="px-4 py-2 text-sm rounded-lg border border-warm-200 cursor-pointer hover:bg-warm-50"
            style={{ color: '#6B6158' }}
          >
            Cerrar
          </button>
        }
      >
        {detalleLoading ? (
          <div className="flex justify-center py-8"><Spinner size="lg" /></div>
        ) : (
          <div className="space-y-5">
            {/* Asignaciones actuales */}
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: '#6B6158' }}>
                Sucursales donde esta disponible
              </p>
              {asignadas.length === 0 ? (
                <p className="text-xs py-3 text-center rounded-lg" style={{ color: '#B8B0A0', background: '#F9F7F3', border: '1px dashed #E0DAD0' }}>
                  No asignado a ninguna sucursal todavia
                </p>
              ) : (
                <div className="space-y-2">
                  {asignadas.map(a => (
                    <div
                      key={a.sucursal_id}
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg"
                      style={{ border: '1px solid #EBE8E0', backgroundColor: '#FDFCF8' }}
                    >
                      <div>
                        <p className="text-sm font-medium text-warm-900">{a.sucursal_nombre}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#8C8274' }}>
                          {a.precio != null
                            ? `Precio: $${Number(a.precio).toFixed(2)}`
                            : `Precio base: $${Number(servicioDetalle?.precio_base ?? 0).toFixed(2)}`
                          }
                        </p>
                      </div>
                      <button
                        onClick={() => remover.mutate({ servicioId: sucursalesTarget.id, sucursalId: a.sucursal_id })}
                        disabled={remover.isPending}
                        className="text-xs px-2.5 py-1 rounded-md cursor-pointer transition-colors"
                        style={{ color: '#DC2626', border: '1px solid #FECACA', backgroundColor: 'transparent' }}
                        onMouseOver={e => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                        onMouseOut={e  => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Agregar a sucursal */}
            {sucursalesDisponibles.length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: '#6B6158' }}>
                  Agregar a otra sucursal
                </p>
                <ErrorBanner msg={asignarErr} />
                <form onSubmit={handleAsignar} className="flex gap-2 mt-2">
                  <select
                    value={asignarForm.sucursal_id}
                    onChange={e => setAsignarForm(f => ({ ...f, sucursal_id: e.target.value }))}
                    className={selectCls}
                    required
                  >
                    <option value="">Sucursal...</option>
                    {sucursalesDisponibles.map(s => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Precio (opcional)"
                    value={asignarForm.precio}
                    onChange={e => setAsignarForm(f => ({ ...f, precio: e.target.value }))}
                    className={inputCls}
                    min="0"
                    step="0.01"
                    style={{ maxWidth: '160px' }}
                  />
                  <button
                    type="submit"
                    disabled={asignar.isPending || !asignarForm.sucursal_id}
                    className="btn-gold px-3 py-2 text-xs rounded-lg cursor-pointer flex-shrink-0 flex items-center gap-1.5"
                  >
                    {asignar.isPending ? <Spinner size="sm" /> : 'Asignar'}
                  </button>
                </form>
              </div>
            )}

            {sucursalesDisponibles.length === 0 && asignadas.length > 0 && (
              <p className="text-xs text-center py-2" style={{ color: '#B8B0A0' }}>
                El servicio ya esta en todas las sucursales
              </p>
            )}
          </div>
        )}
      </Modal>

      {/* Modal: Confirmar eliminar */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Eliminar servicio"
        size="sm"
        footer={
          <>
            <button
              onClick={() => setDeleteTarget(null)}
              className="px-4 py-2 text-sm rounded-lg border border-warm-200 cursor-pointer hover:bg-warm-50"
              style={{ color: '#6B6158' }}
            >
              Cancelar
            </button>
            <button
              onClick={() => eliminar.mutate(deleteTarget.id)}
              disabled={eliminar.isPending}
              className="px-4 py-2 text-sm rounded-lg cursor-pointer flex items-center gap-2"
              style={{ backgroundColor: '#DC2626', color: '#FFFFFF', border: 'none' }}
            >
              {eliminar.isPending && <Spinner size="sm" />}
              Eliminar
            </button>
          </>
        }
      >
        <p className="text-sm" style={{ color: '#4E4740' }}>
          Estas por eliminar <strong>{deleteTarget?.nombre}</strong>. Esta accion no se puede deshacer.
        </p>
      </Modal>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────

function ServicioForm({ id, form, setForm, onSubmit, error }) {
  const inputCls = 'w-full rounded-lg border border-warm-200 px-3 py-2 text-sm text-warm-900 outline-none focus:border-gold-500 transition-colors'

  return (
    <form id={id} onSubmit={onSubmit} className="space-y-4">
      <ErrorBanner msg={error} />
      <FormField label="Nombre *">
        <input
          type="text"
          value={form.nombre}
          onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
          className={inputCls}
          required
          maxLength={120}
        />
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Precio base ($) *">
          <input
            type="number"
            value={form.precio_base}
            onChange={e => setForm(f => ({ ...f, precio_base: e.target.value }))}
            className={inputCls}
            required
            min="0.01"
            step="0.01"
            placeholder="100.00"
          />
        </FormField>
        <FormField label="Duracion (minutos) *">
          <input
            type="number"
            value={form.duracion_min}
            onChange={e => setForm(f => ({ ...f, duracion_min: e.target.value }))}
            className={inputCls}
            required
            min="10"
            step="5"
            placeholder="60"
          />
        </FormField>
      </div>
      <FormField label="Descripcion">
        <textarea
          value={form.descripcion}
          onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
          className={inputCls}
          rows={2}
        />
      </FormField>
    </form>
  )
}

function ServiceCard({ servicio: s, esSuperAdmin, onEdit, onSucursales, onDelete }) {
  return (
    <div className="bg-white rounded-xl p-5 card-md flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-warm-900 text-sm truncate">{s.nombre}</p>
          {s.descripcion && (
            <p className="text-xs mt-0.5 line-clamp-2" style={{ color: '#8C8274' }}>{s.descripcion}</p>
          )}
        </div>
        <div
          className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #FEF9C3 0%, #FEF08A 100%)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#92400E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
            <line x1="7" y1="7" x2="7.01" y2="7"/>
          </svg>
        </div>
      </div>

      {/* Precio + Duracion */}
      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center text-xs font-semibold px-2 py-1 rounded-md"
          style={{ backgroundColor: '#F0FDF4', color: '#15803D' }}
        >
          ${Number(s.precio_base).toFixed(2)}
        </span>
        <span
          className="inline-flex items-center text-xs px-2 py-1 rounded-md"
          style={{ backgroundColor: '#F5F3EE', color: '#6B6158' }}
        >
          {s.duracion_min} min
        </span>
      </div>

      {/* Actions */}
      <div className="mt-auto flex gap-2">
        <ActionBtn onClick={onEdit} title="Editar">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Editar
        </ActionBtn>

        <ActionBtn onClick={onSucursales} title="Sucursales" gold>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Sucursales
        </ActionBtn>

        {esSuperAdmin && (
          <ActionBtn onClick={onDelete} title="Eliminar" danger>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6"/><path d="M14 11v6"/>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </ActionBtn>
        )}
      </div>
    </div>
  )
}

function ActionBtn({ onClick, title, children, gold, danger }) {
  const base = {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
    padding: '5px 0', borderRadius: '7px', fontSize: '11px', fontWeight: 500,
    cursor: 'pointer', border: '1px solid #EBE8E0', backgroundColor: 'transparent',
    transition: 'border-color 120ms, color 120ms, background-color 120ms',
    color: '#6B6158',
  }

  function over(e) {
    if (gold)   { e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.color = '#C9A84C' }
    else if (danger) { e.currentTarget.style.backgroundColor = '#FEF2F2'; e.currentTarget.style.borderColor = '#FECACA'; e.currentTarget.style.color = '#DC2626' }
    else        { e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.color = '#C9A84C' }
  }
  function out(e) {
    e.currentTarget.style.borderColor = '#EBE8E0'
    e.currentTarget.style.color = '#6B6158'
    e.currentTarget.style.backgroundColor = 'transparent'
  }

  return (
    <button onClick={onClick} title={title} style={base} onMouseOver={over} onMouseOut={out}>
      {children}
    </button>
  )
}
