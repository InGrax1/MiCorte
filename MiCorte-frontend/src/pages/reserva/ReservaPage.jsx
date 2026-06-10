import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import Navbar from '@/components/layout/Navbar'

// ── API (sin auth) ─────────────────────────────────────────────
const api = axios.create({ baseURL: '/api/reserva' })

// ── Utilitarios ────────────────────────────────────────────────
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS  = ['Lu','Ma','Mi','Ju','Vi','Sa','Do']
function pad2(n) { return String(n).padStart(2, '0') }
function formatFecha(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} de ${MESES[m - 1]} de ${y}`
}

// ── Helpers UI ─────────────────────────────────────────────────
function Spinner() {
  return <div className="w-6 h-6 rounded-full border-[3px] animate-spin flex-shrink-0" style={{ borderColor: '#EBE8E0', borderTopColor: '#C9A84C' }} />
}
function LoadingCard({ label }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Spinner />
      <p className="text-sm" style={{ color: '#8C8274' }}>{label}</p>
    </div>
  )
}
function ErrorCard({ message }) {
  return (
    <div className="rounded-xl px-5 py-4 text-sm" style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
      {message}
    </div>
  )
}
function BtnBack({ onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="px-5 py-2.5 text-sm font-medium rounded-xl cursor-pointer transition-colors disabled:opacity-40"
      style={{ color: '#6B6158', border: '1.5px solid #EBE8E0' }}
      onMouseEnter={e => !disabled && (e.currentTarget.style.background = '#F5F0E8')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      Atras
    </button>
  )
}
function BtnNext({ onClick, disabled, loading, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      style={{ background: '#C9A84C', color: '#0F0E0B' }}
    >
      {loading && <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: '#0F0E0B40', borderTopColor: '#0F0E0B' }} />}
      {children}
    </button>
  )
}
function Stars({ value }) {
  const n = Math.round(Number(value) || 0)
  return (
    <span className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} viewBox="0 0 24 24" className="w-3 h-3" fill={i <= n ? '#C9A84C' : 'none'} stroke="#C9A84C" strokeWidth="1.5">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
    </span>
  )
}

// ── Barra de progreso ──────────────────────────────────────────
// Steps: 0=Servicio 1=Estilista 2=Fecha 3=Horario 4=Datos 5=Confirmar  (6=Exito no tiene barra)
const STEP_LABELS = ['Servicio', 'Estilista', 'Fecha', 'Horario', 'Tus datos', 'Confirmar']

function ProgressBar({ step }) {
  return (
    <div className="flex items-center gap-0 mb-10">
      {STEP_LABELS.map((label, i) => (
        <div key={i} className="flex items-center flex-1">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
              style={{
                background: i < step ? '#C9A84C' : i === step ? '#0F0E0B' : '#EBE8E0',
                color:      i < step ? '#0F0E0B' : i === step ? '#C9A84C' : '#8C8274',
                border:     i === step ? '2px solid #C9A84C' : '2px solid transparent',
              }}
            >
              {i < step ? (
                <svg viewBox="0 0 20 20" className="w-4 h-4" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : i + 1}
            </div>
            <span className="text-xs font-medium whitespace-nowrap hidden sm:block" style={{ color: i === step ? '#C9A84C' : '#8C8274' }}>
              {label}
            </span>
          </div>
          {i < STEP_LABELS.length - 1 && (
            <div className="flex-1 h-0.5 mx-1 mb-5" style={{ background: i < step ? '#C9A84C' : '#EBE8E0' }} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Paso 0: Servicio ───────────────────────────────────────────
function StepServicio({ sucursalId, onSelect }) {
  const [servicios, setServicios] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  useEffect(() => {
    api.get(`/${sucursalId}/servicios`)
      .then(r => setServicios(r.data.data))
      .catch(() => setError('No se pudieron cargar los servicios.'))
      .finally(() => setLoading(false))
  }, [sucursalId])

  if (loading) return <LoadingCard label="Cargando servicios..." />
  if (error)   return <ErrorCard message={error} />

  return (
    <div>
      <h2 className="text-xl font-bold mb-1" style={{ color: '#0F0E0B' }}>Elige tu servicio</h2>
      <p className="text-sm mb-6" style={{ color: '#8C8274' }}>Selecciona el servicio que deseas reservar</p>
      <div className="grid sm:grid-cols-2 gap-3">
        {servicios.map(s => (
          <button
            key={s.id}
            onClick={() => onSelect(s)}
            className="text-left rounded-xl p-4 transition-all cursor-pointer"
            style={{ border: '1.5px solid #EBE8E0', background: '#FAFAF7' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.background = '#FFF9EC' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#EBE8E0'; e.currentTarget.style.background = '#FAFAF7' }}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-semibold text-sm" style={{ color: '#0F0E0B' }}>{s.nombre}</span>
              <span className="text-sm font-bold ml-2 flex-shrink-0" style={{ color: '#C9A84C' }}>
                ${Number(s.precio).toLocaleString('es-MX')}
              </span>
            </div>
            {s.descripcion && (
              <p className="text-xs mb-2 leading-relaxed" style={{ color: '#8C8274' }}>{s.descripcion}</p>
            )}
            <span className="text-xs" style={{ color: '#B8B0A0' }}>{s.duracion_min} min</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Paso 1: Estilista ──────────────────────────────────────────
function StepEstilista({ sucursalId, onSelect, onBack }) {
  const [estilistas, setEstilistas] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)

  useEffect(() => {
    api.get(`/${sucursalId}/estilistas`)
      .then(r => setEstilistas(r.data.data))
      .catch(() => setError('No se pudieron cargar los estilistas.'))
      .finally(() => setLoading(false))
  }, [sucursalId])

  if (loading) return <LoadingCard label="Cargando equipo..." />
  if (error)   return <ErrorCard message={error} />

  return (
    <div>
      <h2 className="text-xl font-bold mb-1" style={{ color: '#0F0E0B' }}>Elige tu estilista</h2>
      <p className="text-sm mb-6" style={{ color: '#8C8274' }}>Puedes elegir a quien prefieras o dejar que asignemos el mejor disponible</p>

      {/* Opcion "Cualquiera" */}
      <button
        onClick={() => onSelect(null)}
        className="w-full flex items-center gap-4 rounded-xl p-4 mb-3 transition-all cursor-pointer"
        style={{ border: '1.5px solid #C9A84C', background: '#FFF9EC' }}
        onMouseEnter={e => e.currentTarget.style.background = '#FFF3D4'}
        onMouseLeave={e => e.currentTarget.style.background = '#FFF9EC'}
      >
        <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#0F0E0B' }}>
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="#C9A84C" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold" style={{ color: '#0F0E0B' }}>Cualquiera disponible</p>
          <p className="text-xs mt-0.5" style={{ color: '#8C8274' }}>Asignamos al estilista con mas disponibilidad</p>
        </div>
        <svg viewBox="0 0 20 20" className="w-5 h-5 flex-shrink-0" fill="#C9A84C">
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Lista de estilistas */}
      <div className="space-y-2">
        {estilistas.map(e => {
          const inicial = e.nombre?.charAt(0).toUpperCase() ?? '?'
          const rating  = Number(e.rating_promedio) || 0
          const resenas = Number(e.total_resenas) || 0
          const specs   = e.especialidades
            ? e.especialidades.split(',').map(s => s.trim()).filter(Boolean).slice(0, 3)
            : []
          return (
            <button
              key={e.id}
              onClick={() => onSelect(e)}
              className="w-full flex items-center gap-4 rounded-xl p-4 transition-all cursor-pointer"
              style={{ border: '1.5px solid #EBE8E0', background: '#FAFAF7' }}
              onMouseEnter={ev => { ev.currentTarget.style.borderColor = '#C9A84C'; ev.currentTarget.style.background = '#FFF9EC' }}
              onMouseLeave={ev => { ev.currentTarget.style.borderColor = '#EBE8E0'; ev.currentTarget.style.background = '#FAFAF7' }}
            >
              {/* Avatar */}
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #C9A84C 0%, #9A7C2E 100%)' }}
              >
                {inicial}
              </div>

              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-semibold" style={{ color: '#0F0E0B' }}>{e.nombre}</p>
                {rating > 0 && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Stars value={rating} />
                    <span className="text-xs" style={{ color: '#8C8274' }}>{rating.toFixed(1)} ({resenas})</span>
                  </div>
                )}
                {specs.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {specs.map(sp => (
                      <span key={sp} className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#FFF9EC', color: '#9A7C2E', border: '1px solid #EBE8E0' }}>
                        {sp}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <svg viewBox="0 0 20 20" className="w-5 h-5 flex-shrink-0" fill="#C9A84C">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          )
        })}
      </div>

      <div className="mt-6">
        <BtnBack onClick={onBack} />
      </div>
    </div>
  )
}

// ── Paso 2: Fecha ──────────────────────────────────────────────
function StepFecha({ onSelect, onBack }) {
  const today    = new Date()
  const todayStr = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`
  const maxDate  = new Date(today); maxDate.setDate(maxDate.getDate() + 60)
  const maxStr   = `${maxDate.getFullYear()}-${pad2(maxDate.getMonth() + 1)}-${pad2(maxDate.getDate())}`

  const [year, setYear]   = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selected, setSelected] = useState(null)

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startOffset = (firstDay + 6) % 7

  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  function isoDate(d) { return `${year}-${pad2(month + 1)}-${pad2(d)}` }
  function isPast(d)  { return isoDate(d) < todayStr }
  function isTooFar(d){ return isoDate(d) > maxStr }

  const canGoPrev = !(year === today.getFullYear() && month === today.getMonth())

  return (
    <div>
      <h2 className="text-xl font-bold mb-1" style={{ color: '#0F0E0B' }}>Elige la fecha</h2>
      <p className="text-sm mb-6" style={{ color: '#8C8274' }}>Selecciona el dia de tu cita</p>

      <div className="rounded-xl overflow-hidden" style={{ border: '1.5px solid #EBE8E0' }}>
        {/* Cabecera mes */}
        <div className="flex items-center justify-between px-4 py-3" style={{ background: '#0F0E0B' }}>
          <button onClick={prevMonth} disabled={!canGoPrev}
            className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer disabled:opacity-30"
            style={{ color: '#C9A84C' }}
          >
            <svg viewBox="0 0 20 20" className="w-4 h-4" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <span className="text-sm font-semibold" style={{ color: '#FAFAF7' }}>
            {MESES[month]} {year}
          </span>
          <button onClick={nextMonth}
            className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer"
            style={{ color: '#C9A84C' }}
          >
            <svg viewBox="0 0 20 20" className="w-4 h-4" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Dias semana */}
        <div className="grid grid-cols-7 px-3 pt-3 pb-1">
          {DIAS.map(d => (
            <div key={d} className="text-center text-xs font-semibold py-1" style={{ color: '#8C8274' }}>{d}</div>
          ))}
        </div>

        {/* Celdas */}
        <div className="grid grid-cols-7 px-3 pb-3 gap-y-1">
          {cells.map((d, i) => {
            if (!d) return <div key={`e-${i}`} />
            const dateStr    = isoDate(d)
            const disabled   = isPast(d) || isTooFar(d)
            const isSelected = selected === dateStr
            const isToday    = dateStr === todayStr
            return (
              <button
                key={d}
                disabled={disabled}
                onClick={() => setSelected(dateStr)}
                className="aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  background: isSelected ? '#C9A84C' : isToday ? '#FFF9EC' : 'transparent',
                  color:      isSelected ? '#0F0E0B'  : '#0F0E0B',
                  border:     isToday && !isSelected ? '1.5px solid #C9A84C' : '1.5px solid transparent',
                }}
                onMouseEnter={e => { if (!disabled && !isSelected) e.currentTarget.style.background = '#F5F0E8' }}
                onMouseLeave={e => { if (!disabled && !isSelected) e.currentTarget.style.background = isToday ? '#FFF9EC' : 'transparent' }}
              >
                {d}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <BtnBack onClick={onBack} />
        <BtnNext onClick={() => onSelect(selected)} disabled={!selected}>
          Continuar
        </BtnNext>
      </div>
    </div>
  )
}

// ── Paso 3: Horario ────────────────────────────────────────────
function StepHorario({ sucursalId, servicio, estilista, fecha, onSelect, onBack }) {
  const [slots, setSlots]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    setLoading(true)
    setSelected(null)
    const params = { servicio_id: servicio.id, fecha }
    if (estilista) params.estilista_id = estilista.id
    api.get(`/${sucursalId}/disponibilidad`, { params })
      .then(r => setSlots(r.data.data))
      .catch(() => setError('No se pudo verificar disponibilidad.'))
      .finally(() => setLoading(false))
  }, [sucursalId, servicio.id, estilista, fecha])

  if (loading) return <LoadingCard label="Verificando disponibilidad..." />
  if (error)   return <ErrorCard message={error} />

  return (
    <div>
      <h2 className="text-xl font-bold mb-1" style={{ color: '#0F0E0B' }}>Elige el horario</h2>
      <p className="text-sm mb-2" style={{ color: '#8C8274' }}>
        {formatFecha(fecha)} &middot; {servicio.nombre}
      </p>
      {estilista && (
        <p className="text-xs mb-6 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: '#FFF9EC', color: '#9A7C2E', border: '1px solid #EBE8E0' }}>
          Estilista: <strong>{estilista.nombre}</strong>
        </p>
      )}
      {!estilista && <div className="mb-6" />}

      {slots.length === 0 ? (
        <div className="rounded-xl p-6 text-center mb-6" style={{ background: '#FAFAF7', border: '1.5px solid #EBE8E0' }}>
          <p className="text-sm font-medium" style={{ color: '#0F0E0B' }}>Sin disponibilidad este dia</p>
          <p className="text-xs mt-1" style={{ color: '#8C8274' }}>Prueba con otra fecha o estilista</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-6">
          {slots.map(s => (
            <button
              key={s.hora}
              onClick={() => setSelected(s.hora)}
              className="py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer"
              style={{
                background: selected === s.hora ? '#0F0E0B' : '#FAFAF7',
                color:      selected === s.hora ? '#C9A84C' : '#0F0E0B',
                border:     selected === s.hora ? '1.5px solid #C9A84C' : '1.5px solid #EBE8E0',
              }}
            >
              {s.hora}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <BtnBack onClick={onBack} />
        <BtnNext onClick={() => onSelect(selected)} disabled={!selected}>
          Continuar
        </BtnNext>
      </div>
    </div>
  )
}

// ── Paso 4: Datos del cliente ──────────────────────────────────
function StepDatos({ onSubmit, onBack }) {
  const [form, setForm]     = useState({ nombre: '', email: '', telefono: '', notas: '' })
  const [errors, setErrors] = useState({})

  function validate() {
    const e = {}
    if (!form.nombre.trim()) e.nombre = 'El nombre es requerido'
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Ingresa un email valido'
    return e
  }

  function handleSubmit(ev) {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    onSubmit(form)
  }

  function fieldStyle(field) {
    return {
      border: `1.5px solid ${errors[field] ? '#F87171' : '#EBE8E0'}`,
      background: '#FAFAF7', color: '#0F0E0B',
    }
  }
  const cls = 'w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-colors'

  return (
    <div>
      <h2 className="text-xl font-bold mb-1" style={{ color: '#0F0E0B' }}>Tus datos</h2>
      <p className="text-sm mb-6" style={{ color: '#8C8274' }}>Para confirmar tu reserva necesitamos tu informacion de contacto</p>

      <form id="form-datos" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B6158' }}>Nombre completo *</label>
          <input type="text" value={form.nombre}
            onChange={e => { setForm(f => ({ ...f, nombre: e.target.value })); setErrors(v => ({ ...v, nombre: null })) }}
            placeholder="Tu nombre" className={cls} style={fieldStyle('nombre')} />
          {errors.nombre && <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{errors.nombre}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B6158' }}>Correo electronico *</label>
          <input type="email" value={form.email}
            onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setErrors(v => ({ ...v, email: null })) }}
            placeholder="correo@ejemplo.com" className={cls} style={fieldStyle('email')} />
          {errors.email && <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{errors.email}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B6158' }}>Telefono</label>
          <input type="tel" value={form.telefono}
            onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
            placeholder="+52 55 0000 0000" className={cls} style={fieldStyle('telefono')} />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B6158' }}>Notas adicionales</label>
          <textarea value={form.notas}
            onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
            placeholder="Alergias, preferencias..."
            rows={3} className={cls} style={{ ...fieldStyle('notas'), resize: 'none' }} />
        </div>
      </form>

      <div className="flex gap-3 mt-6">
        <BtnBack onClick={onBack} />
        <BtnNext onClick={() => document.getElementById('form-datos').requestSubmit()}>
          Revisar reserva
        </BtnNext>
      </div>
    </div>
  )
}

// ── Fila de resumen ────────────────────────────────────────────
const ROW_ICONS = {
  calendar: 'M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z',
  clock:    'M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z',
  user:     'M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z',
  scissors: 'M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z',
  money:    'M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z',
}
function Row({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#FFF9EC' }}>
        <svg viewBox="0 0 20 20" className="w-4 h-4" fill="#C9A84C">
          <path fillRule="evenodd" d={ROW_ICONS[icon]} clipRule="evenodd" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs" style={{ color: '#8C8274' }}>{label}</p>
        <p className="text-sm font-medium truncate" style={{ color: '#0F0E0B' }}>{value}</p>
      </div>
    </div>
  )
}

// ── Paso 5: Confirmar ──────────────────────────────────────────
function StepConfirmar({ sucursalId, booking, onBack, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const { servicio, estilista, fecha, hora, datos } = booking

  async function confirmar() {
    setLoading(true)
    setError(null)
    try {
      const res = await api.post(`/${sucursalId}`, {
        nombre:       datos.nombre,
        email:        datos.email,
        telefono:     datos.telefono || undefined,
        servicio_id:  servicio.id,
        fecha_hora:   `${fecha}T${hora}:00`,
        estilista_id: estilista?.id || undefined,
        notas:        datos.notas || undefined,
      })
      onSuccess(res.data.data)
    } catch (e) {
      setError(e.response?.data?.error || 'No se pudo crear la reserva. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-1" style={{ color: '#0F0E0B' }}>Confirma tu reserva</h2>
      <p className="text-sm mb-6" style={{ color: '#8C8274' }}>Revisa los detalles antes de confirmar</p>

      <div className="rounded-xl overflow-hidden mb-6" style={{ border: '1.5px solid #EBE8E0' }}>
        <div className="px-5 py-4" style={{ background: '#0F0E0B' }}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#C9A84C' }}>Resumen</p>
          <p className="text-base font-bold" style={{ color: '#FAFAF7' }}>{servicio.nombre}</p>
        </div>
        <div className="divide-y" style={{ borderColor: '#F5F3EE' }}>
          <Row icon="calendar" label="Fecha"     value={formatFecha(fecha)} />
          <Row icon="clock"    label="Hora"      value={hora} />
          <Row icon="user"     label="Estilista" value={estilista ? estilista.nombre : 'Asignacion automatica'} />
          <Row icon="scissors" label="Duracion"  value={`${servicio.duracion_min} min`} />
          <Row icon="money"    label="Precio"    value={`$${Number(servicio.precio).toLocaleString('es-MX')} MXN`} />
        </div>
        <div className="px-5 py-4" style={{ borderTop: '1px solid #F5F3EE', background: '#FAFAF7' }}>
          <p className="text-xs font-semibold mb-1" style={{ color: '#8C8274' }}>Datos de contacto</p>
          <p className="text-sm font-medium" style={{ color: '#0F0E0B' }}>{datos.nombre}</p>
          <p className="text-xs" style={{ color: '#8C8274' }}>{datos.email}</p>
          {datos.telefono && <p className="text-xs" style={{ color: '#8C8274' }}>{datos.telefono}</p>}
        </div>
      </div>

      {error && (
        <div className="rounded-xl px-4 py-3 text-sm mb-4" style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
          {error}
        </div>
      )}

      <p className="text-xs mb-4 text-center" style={{ color: '#8C8274' }}>El pago se realiza directamente en el salon</p>

      <div className="flex gap-3">
        <BtnBack onClick={onBack} disabled={loading} />
        <BtnNext onClick={confirmar} loading={loading}>
          {loading ? 'Reservando...' : 'Confirmar reserva'}
        </BtnNext>
      </div>
    </div>
  )
}

// ── Pantalla de exito ──────────────────────────────────────────
function PantallaExito({ booking }) {
  return (
    <div className="text-center py-4">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: '#FFF9EC', border: '2px solid #C9A84C' }}>
        <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="#C9A84C" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold mb-2" style={{ color: '#0F0E0B' }}>Reserva confirmada</h2>
      <p className="text-sm mb-8" style={{ color: '#8C8274' }}>
        Recibirás un correo de confirmacion en{' '}
        <strong style={{ color: '#0F0E0B' }}>{booking.datos.email}</strong>
      </p>
      <div className="rounded-xl text-left mb-8" style={{ border: '1.5px solid #EBE8E0', background: '#FAFAF7' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #EBE8E0' }}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: '#C9A84C' }}>Resumen de tu cita</p>
          <p className="text-base font-bold" style={{ color: '#0F0E0B' }}>{booking.servicio.nombre}</p>
        </div>
        <div className="divide-y" style={{ borderColor: '#F5F3EE' }}>
          <Row icon="calendar" label="Fecha" value={formatFecha(booking.fecha)} />
          <Row icon="clock"    label="Hora"  value={booking.hora} />
          {booking.estilista && <Row icon="user" label="Estilista" value={booking.estilista.nombre} />}
        </div>
      </div>
      <Link to="/" className="inline-block px-8 py-3 text-sm font-semibold rounded-xl" style={{ background: '#C9A84C', color: '#0F0E0B' }}>
        Volver al inicio
      </Link>
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────
export default function ReservaPage() {
  const { sucursalId } = useParams()
  const [sid,        setSid]        = useState(sucursalId || null)
  const [resolving,  setResolving]  = useState(!sucursalId)
  const [resolveErr, setResolveErr] = useState(null)
  const [sucursales, setSucursales] = useState([])

  // Steps: 0=Servicio 1=Estilista 2=Fecha 3=Horario 4=Datos 5=Confirmar 6=Exito
  const [step,    setStep]    = useState(0)
  const [booking, setBooking] = useState({
    servicio:  null,
    estilista: null, // null = cualquiera
    fecha:     null,
    hora:      null,
    datos:     null,
  })

  // Resolver sucursal cuando no viene en URL
  useEffect(() => {
    if (sucursalId) return
    api.get('/sucursales')
      .then(r => {
        const list = r.data.data
        if (list.length === 1) { setSid(list[0].id); setResolving(false) }
        else if (list.length > 1) { setSucursales(list); setResolving(false) }
        else { setResolveErr('No hay sucursales disponibles.'); setResolving(false) }
      })
      .catch(() => { setResolveErr('No se pudo conectar con el servidor.'); setResolving(false) })
  }, [sucursalId])

  if (resolving) return (
    <div className="min-h-screen" style={{ background: '#FAFAF7' }}>
      <Navbar />
      <div style={{ height: '64px' }} />
      <div className="max-w-xl mx-auto px-4 py-20"><LoadingCard label="Cargando..." /></div>
    </div>
  )
  if (resolveErr) return (
    <div className="min-h-screen" style={{ background: '#FAFAF7' }}>
      <Navbar />
      <div style={{ height: '64px' }} />
      <div className="max-w-xl mx-auto px-4 py-20"><ErrorCard message={resolveErr} /></div>
    </div>
  )
  if (!sid && sucursales.length > 1) return (
    <div className="min-h-screen" style={{ background: '#FAFAF7' }}>
      <Navbar />
      <div style={{ height: '64px' }} />
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl p-6 sm:p-8" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="text-xl font-bold mb-1" style={{ color: '#0F0E0B' }}>Elige la sucursal</h2>
          <p className="text-sm mb-6" style={{ color: '#8C8274' }}>Selecciona la ubicacion donde quieres reservar</p>
          <div className="space-y-3">
            {sucursales.map(s => (
              <button key={s.id} onClick={() => setSid(s.id)}
                className="w-full text-left rounded-xl p-4 cursor-pointer transition-all"
                style={{ border: '1.5px solid #EBE8E0', background: '#FAFAF7' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.background = '#FFF9EC' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#EBE8E0'; e.currentTarget.style.background = '#FAFAF7' }}
              >
                <p className="text-sm font-semibold" style={{ color: '#0F0E0B' }}>{s.nombre}</p>
                {s.direccion && <p className="text-xs mt-0.5" style={{ color: '#8C8274' }}>{s.direccion}</p>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: '#FAFAF7' }}>
      <Navbar />
      <div style={{ height: '64px' }} />
      <div className="max-w-xl mx-auto px-4 py-8">
        {step < 6 && <ProgressBar step={step} />}

        <div className="bg-white rounded-2xl p-6 sm:p-8" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}>
          {step === 0 && (
            <StepServicio
              sucursalId={sid}
              onSelect={s => { setBooking(b => ({ ...b, servicio: s })); setStep(1) }}
            />
          )}
          {step === 1 && (
            <StepEstilista
              sucursalId={sid}
              onSelect={e => { setBooking(b => ({ ...b, estilista: e })); setStep(2) }}
              onBack={() => setStep(0)}
            />
          )}
          {step === 2 && (
            <StepFecha
              onSelect={f => { setBooking(b => ({ ...b, fecha: f, hora: null })); setStep(3) }}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <StepHorario
              sucursalId={sid}
              servicio={booking.servicio}
              estilista={booking.estilista}
              fecha={booking.fecha}
              onSelect={h => { setBooking(b => ({ ...b, hora: h })); setStep(4) }}
              onBack={() => setStep(2)}
            />
          )}
          {step === 4 && (
            <StepDatos
              onSubmit={d => { setBooking(b => ({ ...b, datos: d })); setStep(5) }}
              onBack={() => setStep(3)}
            />
          )}
          {step === 5 && (
            <StepConfirmar
              sucursalId={sid}
              booking={booking}
              onBack={() => setStep(4)}
              onSuccess={() => setStep(6)}
            />
          )}
          {step === 6 && <PantallaExito booking={booking} />}
        </div>
      </div>
    </div>
  )
}
