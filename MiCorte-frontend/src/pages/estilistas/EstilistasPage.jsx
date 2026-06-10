import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import EmptyState from '@/components/ui/EmptyState'

const inputCls = 'w-full rounded-lg border border-warm-200 px-3 py-2 text-sm text-warm-900 outline-none focus:border-gold-500 transition-colors'
const selectCls = 'w-full rounded-lg border border-warm-200 px-3 py-2 text-sm text-warm-900 outline-none focus:border-gold-500 transition-colors bg-white cursor-pointer'

const DIAS = [
  { dia: 0, label: 'Lunes' },
  { dia: 1, label: 'Martes' },
  { dia: 2, label: 'Miercoles' },
  { dia: 3, label: 'Jueves' },
  { dia: 4, label: 'Viernes' },
  { dia: 5, label: 'Sabado' },
  { dia: 6, label: 'Domingo' },
]

const DEFAULT_SCHEDULE = DIAS.map(d => ({
  ...d,
  enabled: false,
  hora_inicio: '09:00',
  hora_fin: '18:00',
}))

function FormField({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1" style={{ color: '#6B6158' }}>{label}</label>
      {children}
    </div>
  )
}

function Stars({ value }) {
  const n = Math.round(value ?? 0)
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg
          key={i} xmlns="http://www.w3.org/2000/svg" width="13" height="13"
          viewBox="0 0 24 24"
          fill={i <= n ? '#C9A84C' : 'none'}
          stroke={i <= n ? '#C9A84C' : '#D6D0C4'}
          strokeWidth="2"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </div>
  )
}

const EMPTY_FORM = { nombre: '', email: '', password: '', sucursal_id: '', bio: '', especialidades: '' }

export default function EstilistasPage() {
  const qc = useQueryClient()

  // --- Crear estilista ---
  const [modalOpen, setModalOpen]   = useState(false)
  const [formError, setFormError]   = useState(null)
  const [form, setForm]             = useState(EMPTY_FORM)

  // --- Horarios ---
  const [horariosTarget, setHorariosTarget] = useState(null) // { id, nombre }
  const [schedule, setSchedule]             = useState(DEFAULT_SCHEDULE)
  const [horariosError, setHorariosError]   = useState(null)

  const { data: estilistas = [], isLoading } = useQuery({
    queryKey: ['estilistas'],
    queryFn: async () => {
      const res = await api.get('/estilistas')
      const d = res.data.data
      return Array.isArray(d) ? d : (d?.estilistas ?? [])
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

  // Fetch horarios when modal opens
  const { data: horariosData, isLoading: horariosLoading } = useQuery({
    queryKey: ['horarios', horariosTarget?.id],
    queryFn: async () => {
      const res = await api.get(`/estilistas/${horariosTarget.id}/horarios`)
      return res.data.data ?? []
    },
    enabled: !!horariosTarget,
  })

  // Populate schedule when data arrives
  useEffect(() => {
    if (!horariosTarget) return
    setSchedule(DEFAULT_SCHEDULE.map(d => {
      const h = Array.isArray(horariosData)
        ? horariosData.find(r => r.dia_semana === d.dia)
        : null
      if (h) {
        return {
          ...d,
          enabled: true,
          hora_inicio: String(h.hora_inicio).slice(0, 5),
          hora_fin:    String(h.hora_fin).slice(0, 5),
        }
      }
      return { ...d, enabled: false }
    }))
  }, [horariosData, horariosTarget])

  const crear = useMutation({
    mutationFn: (body) => api.post('/estilistas', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['estilistas'] })
      setModalOpen(false)
      setForm(EMPTY_FORM)
      setFormError(null)
    },
    onError: (e) => setFormError(e.response?.data?.message || 'Error al crear estilista'),
  })

  const guardarHorarios = useMutation({
    mutationFn: (horarios) => api.put(`/estilistas/${horariosTarget.id}/horarios`, horarios),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['horarios', horariosTarget.id] })
      setHorariosTarget(null)
      setHorariosError(null)
    },
    onError: (e) => setHorariosError(e.response?.data?.message || 'Error al guardar horarios'),
  })

  function handleCrear(e) {
    e.preventDefault()
    setFormError(null)
    const body = {
      nombre: form.nombre,
      email: form.email,
      password: form.password,
      sucursal_id: form.sucursal_id,
    }
    if (form.bio) body.bio = form.bio
    if (form.especialidades)
      body.especialidades = form.especialidades.split(',').map(s => s.trim()).filter(Boolean)
    crear.mutate(body)
  }

  function handleGuardarHorarios() {
    setHorariosError(null)
    const horarios = schedule
      .filter(d => d.enabled)
      .map(d => ({ dia_semana: d.dia, hora_inicio: d.hora_inicio, hora_fin: d.hora_fin }))
    guardarHorarios.mutate(horarios)
  }

  function toggleDia(dia) {
    setSchedule(s => s.map(d => d.dia === dia ? { ...d, enabled: !d.enabled } : d))
  }

  function updateTime(dia, field, val) {
    setSchedule(s => s.map(d => d.dia === dia ? { ...d, [field]: val } : d))
  }

  const enabledDays = schedule.filter(d => d.enabled).length

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setModalOpen(true)}
          className="btn-gold px-4 py-2 text-sm rounded-lg cursor-pointer"
        >
          + Nuevo estilista
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : estilistas.length === 0 ? (
        <EmptyState message="No hay estilistas registrados" description="Crea el primer estilista para comenzar" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {estilistas.map(e => (
            <div key={e.id} className="bg-white rounded-xl p-5 card-md flex flex-col gap-3">
              <div className="flex items-start gap-3">
                {e.foto_url ? (
                  <img src={e.foto_url} alt={e.nombre} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #C9A84C 0%, #9A7C2E 100%)' }}
                  >
                    {e.nombre?.charAt(0).toUpperCase() ?? '?'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-warm-900 text-sm truncate">{e.nombre}</p>
                  <div className="mt-1">
                    <Badge estado={e.activo ? 'activo' : 'inactivo'} />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Stars value={e.rating_promedio} />
                <span className="text-xs font-semibold text-warm-900">
                  {e.rating_promedio != null ? Number(e.rating_promedio).toFixed(1) : '—'}
                </span>
                <span className="text-xs" style={{ color: '#B8B0A0' }}>({e.total_resenas ?? 0})</span>
              </div>

              {e.sucursal_nombre && (
                <p className="text-xs truncate" style={{ color: '#8C8274' }}>{e.sucursal_nombre}</p>
              )}

              {e.especialidades?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {e.especialidades.slice(0, 3).map(esp => (
                    <span
                      key={esp}
                      className="inline-block text-xs px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: '#FEF9C3', color: '#92400E' }}
                    >
                      {esp}
                    </span>
                  ))}
                  {e.especialidades.length > 3 && (
                    <span className="text-xs" style={{ color: '#B8B0A0' }}>+{e.especialidades.length - 3}</span>
                  )}
                </div>
              )}

              {/* Horarios button */}
              <button
                onClick={() => { setHorariosError(null); setHorariosTarget({ id: e.id, nombre: e.nombre }) }}
                className="mt-auto w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors"
                style={{
                  border: '1px solid #EBE8E0',
                  color: '#6B6158',
                  backgroundColor: 'transparent',
                }}
                onMouseOver={ev => { ev.currentTarget.style.borderColor = '#C9A84C'; ev.currentTarget.style.color = '#C9A84C' }}
                onMouseOut={ev  => { ev.currentTarget.style.borderColor = '#EBE8E0'; ev.currentTarget.style.color = '#6B6158' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Horarios
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Crear estilista */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setFormError(null) }}
        title="Nuevo estilista"
        size="md"
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
              form="form-crear-estilista"
              type="submit"
              disabled={crear.isPending}
              className="btn-gold px-4 py-2 text-sm rounded-lg cursor-pointer flex items-center gap-2"
            >
              {crear.isPending && <Spinner size="sm" />}
              Crear estilista
            </button>
          </>
        }
      >
        <form id="form-crear-estilista" onSubmit={handleCrear} className="space-y-4">
          {formError && (
            <div className="rounded-lg px-4 py-2.5 text-sm" style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
              {formError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Nombre *">
              <input type="text" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} className={inputCls} required />
            </FormField>
            <FormField label="Email *">
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputCls} required />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Password *">
              <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className={inputCls} required minLength={6} />
            </FormField>
            <FormField label="Sucursal *">
              <select value={form.sucursal_id} onChange={e => setForm(f => ({ ...f, sucursal_id: e.target.value }))} className={selectCls} required>
                <option value="">Seleccionar...</option>
                {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </FormField>
          </div>
          <FormField label="Especialidades (separadas por coma)">
            <input
              type="text" value={form.especialidades}
              onChange={e => setForm(f => ({ ...f, especialidades: e.target.value }))}
              className={inputCls} placeholder="Corte, Coloracion, Peinado"
            />
          </FormField>
          <FormField label="Bio">
            <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} className={inputCls} rows={2} />
          </FormField>
        </form>
      </Modal>

      {/* Modal: Horarios */}
      <Modal
        open={!!horariosTarget}
        onClose={() => { setHorariosTarget(null); setHorariosError(null) }}
        title={horariosTarget ? `Horarios — ${horariosTarget.nombre}` : 'Horarios'}
        size="md"
        footer={
          <>
            <button
              onClick={() => { setHorariosTarget(null); setHorariosError(null) }}
              className="px-4 py-2 text-sm rounded-lg border border-warm-200 cursor-pointer transition-colors hover:bg-warm-50"
              style={{ color: '#6B6158' }}
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardarHorarios}
              disabled={guardarHorarios.isPending || horariosLoading}
              className="btn-gold px-4 py-2 text-sm rounded-lg cursor-pointer flex items-center gap-2"
            >
              {guardarHorarios.isPending && <Spinner size="sm" />}
              Guardar horarios
            </button>
          </>
        }
      >
        {horariosLoading ? (
          <div className="flex justify-center py-8"><Spinner size="lg" /></div>
        ) : (
          <div className="space-y-3">
            {horariosError && (
              <div className="rounded-lg px-4 py-2.5 text-sm" style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
                {horariosError}
              </div>
            )}

            <p className="text-xs" style={{ color: '#8C8274' }}>
              Activa los dias que trabaja este estilista y define su horario.
              {enabledDays > 0 && (
                <span className="ml-1 font-medium" style={{ color: '#C9A84C' }}>
                  {enabledDays} {enabledDays === 1 ? 'dia activo' : 'dias activos'}
                </span>
              )}
            </p>

            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #EBE8E0' }}>
              {schedule.map((d, idx) => (
                <div
                  key={d.dia}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{
                    borderTop: idx > 0 ? '1px solid #F0EDE6' : 'none',
                    backgroundColor: d.enabled ? '#FDFCF8' : '#FFFFFF',
                  }}
                >
                  {/* Toggle */}
                  <button
                    type="button"
                    onClick={() => toggleDia(d.dia)}
                    className="flex-shrink-0 cursor-pointer transition-colors"
                    style={{
                      width: '36px', height: '20px', borderRadius: '10px',
                      backgroundColor: d.enabled ? '#C9A84C' : '#E5E1D8',
                      position: 'relative', border: 'none', outline: 'none',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: '3px',
                        left: d.enabled ? '19px' : '3px',
                        width: '14px', height: '14px',
                        borderRadius: '50%',
                        backgroundColor: '#FFFFFF',
                        transition: 'left 150ms',
                        display: 'block',
                      }}
                    />
                  </button>

                  {/* Day label */}
                  <span
                    className="text-sm font-medium w-20 flex-shrink-0"
                    style={{ color: d.enabled ? '#1A1713' : '#B8B0A0' }}
                  >
                    {d.label}
                  </span>

                  {/* Time inputs */}
                  {d.enabled ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="time"
                        value={d.hora_inicio}
                        onChange={e => updateTime(d.dia, 'hora_inicio', e.target.value)}
                        className="flex-1 rounded-lg border px-2 py-1.5 text-xs text-warm-900 outline-none transition-colors cursor-pointer"
                        style={{ borderColor: '#EBE8E0' }}
                        onFocus={e => e.target.style.borderColor = '#C9A84C'}
                        onBlur={e => e.target.style.borderColor = '#EBE8E0'}
                      />
                      <span className="text-xs flex-shrink-0" style={{ color: '#B8B0A0' }}>a</span>
                      <input
                        type="time"
                        value={d.hora_fin}
                        onChange={e => updateTime(d.dia, 'hora_fin', e.target.value)}
                        className="flex-1 rounded-lg border px-2 py-1.5 text-xs text-warm-900 outline-none transition-colors cursor-pointer"
                        style={{ borderColor: '#EBE8E0' }}
                        onFocus={e => e.target.style.borderColor = '#C9A84C'}
                        onBlur={e => e.target.style.borderColor = '#EBE8E0'}
                      />
                    </div>
                  ) : (
                    <span className="flex-1 text-xs" style={{ color: '#C8C2B6' }}>Dia libre</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
