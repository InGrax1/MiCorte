import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import portalApi from '@/lib/portalApi'
import api from '@/lib/api'
import { usePortalStore } from '@/store/portal.store'
import Navbar from '@/components/layout/Navbar'

// ── Helpers ──────────────────────────────────────────────────────
function fmtFecha(f) {
  if (!f) return '—'
  return new Date(f).toLocaleDateString('es-MX', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
function fmtFechaCorta(f) {
  if (!f) return '—'
  return new Date(f).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}
function fmtMXN(n) {
  return `$${Number(n ?? 0).toFixed(2)}`
}

const ESTADO_CITA_STYLE = {
  pendiente_pago: { bg: '#FEF9C3', color: '#92400E', label: 'Pend. pago' },
  confirmada:     { bg: '#DCFCE7', color: '#15803D', label: 'Confirmada' },
  en_proceso:     { bg: '#DBEAFE', color: '#1D4ED8', label: 'En proceso' },
  completada:     { bg: '#F0FDF4', color: '#15803D', label: 'Completada' },
  cancelada:      { bg: '#FEE2E2', color: '#DC2626', label: 'Cancelada'  },
}
const ESTADO_ORDEN_STYLE = {
  pendiente:   { bg: '#FEF9C3', color: '#92400E', label: 'Pendiente'   },
  procesando:  { bg: '#DBEAFE', color: '#1D4ED8', label: 'Procesando'  },
  enviado:     { bg: '#EDE9FE', color: '#7C3AED', label: 'Enviado'     },
  entregado:   { bg: '#F0FDF4', color: '#15803D', label: 'Entregado'   },
  cancelado:   { bg: '#FEE2E2', color: '#DC2626', label: 'Cancelado'   },
}

function EstadoBadge({ estado, map }) {
  const s = map[estado] || { bg: '#F5F3EE', color: '#6B6158', label: estado }
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full"
      style={{ backgroundColor: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

// ── Page shell ────────────────────────────────────────────────────
function Shell({ children, onLogout, tabBar }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAF7' }}>
      <Navbar onLogout={onLogout} />
      <div style={{ height: '64px' }} />

      {tabBar && (
        <div className="sticky z-20 bg-white/95 backdrop-blur-sm"
          style={{ top: '64px', borderBottom: '1px solid #F0EDE6' }}>
          <div className="max-w-2xl mx-auto px-4">
            {tabBar}
          </div>
        </div>
      )}

      <div className="px-4 py-6 max-w-2xl mx-auto">
        {children}
      </div>
    </div>
  )
}

// ── Login view ────────────────────────────────────────────────────
function LoginView({ sucursalId, onSuccess }) {
  const [step,       setStep]       = useState('email')   // 'email' | 'codigo'
  const [email,      setEmail]      = useState('')
  const [codigo,     setCodigo]     = useState('')
  const [error,      setError]      = useState('')
  const [loading,    setLoading]    = useState(false)
  const [resolving,  setResolving]  = useState(true)
  const [sucursal,   setSucursal]   = useState(null)
  const [sucursales, setSucursales] = useState([])
  const [pickerOpen, setPickerOpen] = useState(false)

  useEffect(() => {
    api.get('/reserva/sucursales')
      .then(res => {
        const list = res.data.data ?? []
        if (sucursalId) {
          const found = list.find(s => s.id === sucursalId)
          if (found) setSucursal(found)
          else if (list.length === 1) setSucursal(list[0])
          else { setSucursales(list); setPickerOpen(true) }
        } else if (list.length === 1) {
          setSucursal(list[0])
        } else {
          setSucursales(list)
          setPickerOpen(true)
        }
      })
      .catch(() => {})
      .finally(() => setResolving(false))
  }, [sucursalId])

  async function handleSolicitarAcceso(e) {
    e.preventDefault()
    if (!sucursal) return
    setError('')
    setLoading(true)
    try {
      await api.post('/portal/solicitar-acceso', { email, sucursal_id: sucursal.id })
      setStep('codigo')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al enviar el codigo')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerificarOtp(e) {
    e.preventDefault()
    if (!sucursal) return
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/portal/verificar', { email, sucursal_id: sucursal.id, codigo })
      onSuccess(res.data.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Codigo incorrecto o expirado')
    } finally {
      setLoading(false)
    }
  }

  if (resolving) {
    return (
      <Shell>
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: '#C9A84C', borderTopColor: 'transparent' }} />
        </div>
      </Shell>
    )
  }

  if (pickerOpen) {
    return (
      <Shell>
        <div className="bg-white rounded-2xl p-8 shadow-sm" style={{ border: '1px solid #F0EDE6' }}>
          <h2 className="text-lg font-bold text-warm-900 mb-1">Selecciona tu salon</h2>
          <p className="text-sm mb-6" style={{ color: '#8C8274' }}>Elige la sucursal donde eres cliente.</p>
          <div className="space-y-2">
            {sucursales.map(s => (
              <button key={s.id} onClick={() => { setSucursal(s); setPickerOpen(false) }}
                className="w-full text-left px-4 py-3 rounded-xl cursor-pointer transition-colors"
                style={{ border: '1px solid #EBE8E0', backgroundColor: '#FDFCF8' }}
                onMouseOver={e => e.currentTarget.style.borderColor = '#C9A84C'}
                onMouseOut={e  => e.currentTarget.style.borderColor = '#EBE8E0'}
              >
                <p className="text-sm font-medium text-warm-900">{s.nombre}</p>
                {s.direccion && <p className="text-xs mt-0.5" style={{ color: '#8C8274' }}>{s.direccion}</p>}
              </button>
            ))}
          </div>
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="bg-white rounded-2xl p-8 shadow-sm" style={{ border: '1px solid #F0EDE6', maxWidth: '420px', margin: '0 auto' }}>
        <div className="text-center mb-7">
          {sucursal && (
            <p className="text-xs font-medium mb-3 px-3 py-1 rounded-full inline-block"
              style={{ backgroundColor: '#FEF9C3', color: '#92400E' }}>
              {sucursal.nombre}
            </p>
          )}
          <h1 className="text-xl font-bold text-warm-900 mb-1">
            {step === 'email' ? 'Accede a tu cuenta' : 'Verifica tu identidad'}
          </h1>
          <p className="text-sm" style={{ color: '#8C8274' }}>
            {step === 'email'
              ? 'Ingresa el email con el que reservaste tu cita'
              : `Ingresa el codigo de 6 digitos enviado a ${email}`}
          </p>
        </div>

        {step === 'email' ? (
          <form onSubmit={handleSolicitarAcceso} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B6158' }}>
                Email
              </label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com" required
                className="w-full rounded-xl px-4 py-3 text-sm text-warm-900 outline-none transition-colors"
                style={{ border: '1px solid #EBE8E0', backgroundColor: '#FAFAF7' }}
                onFocus={e => e.target.style.borderColor = '#C9A84C'}
                onBlur={e  => e.target.style.borderColor = '#EBE8E0'}
              />
            </div>

            {error && (
              <p className="text-xs py-2.5 px-3 rounded-lg"
                style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
                {error}
              </p>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold cursor-pointer transition-colors"
              style={{ backgroundColor: '#C9A84C', color: '#0F0E0B', border: 'none' }}
              onMouseOver={e => { if (!loading) e.currentTarget.style.backgroundColor = '#FACC15' }}
              onMouseOut={e  => e.currentTarget.style.backgroundColor = '#C9A84C'}
            >
              {loading ? 'Enviando...' : 'Enviar codigo'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerificarOtp} className="space-y-4">
            {/* Codigo OTP */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B6158' }}>
                Codigo de verificacion
              </label>
              <input
                type="text" inputMode="numeric" pattern="[0-9]*"
                maxLength={6} value={codigo}
                onChange={e => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456" required
                className="w-full rounded-xl px-4 py-3 text-2xl font-bold text-center tracking-[0.5em] text-warm-900 outline-none transition-colors"
                style={{ border: '1px solid #EBE8E0', backgroundColor: '#FAFAF7', letterSpacing: '0.4em' }}
                onFocus={e => e.target.style.borderColor = '#C9A84C'}
                onBlur={e  => e.target.style.borderColor = '#EBE8E0'}
              />
            </div>

            {error && (
              <p className="text-xs py-2.5 px-3 rounded-lg"
                style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
                {error}
              </p>
            )}

            <button type="submit" disabled={loading || codigo.length !== 6}
              className="w-full py-3 rounded-xl text-sm font-semibold cursor-pointer transition-colors disabled:opacity-50"
              style={{ backgroundColor: '#C9A84C', color: '#0F0E0B', border: 'none' }}
              onMouseOver={e => { if (!loading) e.currentTarget.style.backgroundColor = '#FACC15' }}
              onMouseOut={e  => e.currentTarget.style.backgroundColor = '#C9A84C'}
            >
              {loading ? 'Verificando...' : 'Acceder'}
            </button>

            <button type="button"
              onClick={() => { setStep('email'); setCodigo(''); setError('') }}
              className="w-full py-2 text-xs cursor-pointer transition-colors"
              style={{ background: 'none', border: 'none', color: '#8C8274', fontFamily: 'inherit' }}
              onMouseOver={e => e.currentTarget.style.color = '#C9A84C'}
              onMouseOut={e  => e.currentTarget.style.color = '#8C8274'}
            >
              Cambiar email
            </button>
          </form>
        )}

        {step === 'email' && (
          <p className="text-xs text-center mt-5" style={{ color: '#B8B0A0' }}>
            ¿Primera vez?{' '}
            <Link to="/reservar" className="underline" style={{ color: '#C9A84C' }}>
              Reserva una cita
            </Link>{' '}
            y tu cuenta se crea automaticamente.
          </p>
        )}
      </div>
    </Shell>
  )
}

// ── Portal view (authenticated) ───────────────────────────────────
const TABS = [
  { id: 'inicio',   label: 'Inicio'     },
  { id: 'citas',    label: 'Mis citas'  },
  { id: 'puntos',   label: 'Mis puntos' },
  { id: 'ordenes',  label: 'Mis ordenes'},
]

function PortalView({ onLogout }) {
  const cliente = usePortalStore(s => s.cliente)
  const [tab, setTab] = useState('inicio')

  const { data: citas = [], isLoading: citasLoading } = useQuery({
    queryKey: ['portal-citas'],
    queryFn: async () => {
      const res = await portalApi.get('/portal/mis-citas')
      return res.data.data ?? []
    },
  })

  const { data: movimientos = [], isLoading: movLoading } = useQuery({
    queryKey: ['portal-movimientos'],
    queryFn: async () => {
      const res = await portalApi.get('/portal/mis-movimientos')
      return res.data.data ?? []
    },
  })

  const { data: ordenes = [], isLoading: ordenesLoading } = useQuery({
    queryKey: ['portal-ordenes'],
    queryFn: async () => {
      const res = await portalApi.get('/portal/mis-ordenes')
      return res.data.data ?? []
    },
  })

  const proximas  = citas.filter(c => ['pendiente_pago','confirmada','en_proceso'].includes(c.estado))
  const pasadas   = citas.filter(c => ['completada','cancelada'].includes(c.estado))

  const initials = cliente?.nombre
    ? cliente.nombre.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const tabBar = (
    <div className="flex gap-1 py-2">
      {TABS.map(t => (
        <button key={t.id} onClick={() => setTab(t.id)}
          className="flex-1 py-2 text-xs font-medium rounded-lg cursor-pointer transition-colors"
          style={{
            border: 'none',
            backgroundColor: tab === t.id ? '#C9A84C' : 'transparent',
            color: tab === t.id ? '#0F0E0B' : '#8C8274',
            fontFamily: 'inherit',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  )

  return (
    <Shell onLogout={onLogout} tabBar={tabBar}>
      {/* Profile card */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-5 flex items-center gap-4"
        style={{ border: '1px solid #F0EDE6' }}>
        <div style={{
          width: '46px', height: '46px', borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, #C9A84C 0%, #9A7C2E 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '16px', fontWeight: 700, color: '#0F0E0B',
        }}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-warm-900 truncate">{cliente?.nombre}</p>
          <p className="text-xs truncate" style={{ color: '#8C8274' }}>{cliente?.email}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-2xl font-bold" style={{ color: '#C9A84C', lineHeight: 1 }}>
            {Number(cliente?.puntos_acumulados ?? 0).toLocaleString('es-MX')}
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#B8B0A0' }}>puntos</p>
        </div>
      </div>

      {/* Tab content */}
      {tab === 'inicio' && <TabInicio citas={proximas} puntos={cliente?.puntos_acumulados ?? 0} citasLoading={citasLoading} />}
      {tab === 'citas'   && <TabCitas citas={citas} loading={citasLoading} />}
      {tab === 'puntos'  && <TabPuntos puntos={cliente?.puntos_acumulados ?? 0} movimientos={movimientos} loading={movLoading} />}
      {tab === 'ordenes' && <TabOrdenes ordenes={ordenes} loading={ordenesLoading} />}
    </Shell>
  )
}

// ── Tabs ──────────────────────────────────────────────────────────

function TabInicio({ citas, puntos, citasLoading }) {
  return (
    <div className="space-y-4">
      {/* Próximas citas */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#B8B0A0' }}>
          Proximas citas
        </h3>
        {citasLoading ? <LoadingRows /> : citas.length === 0 ? (
          <EmptyCard msg="No tienes citas proximas" />
        ) : (
          <div className="space-y-2">
            {citas.slice(0, 3).map(c => <CitaCard key={c.id} cita={c} />)}
          </div>
        )}
      </div>

      {/* Points summary */}
      <div className="bg-white rounded-2xl p-5 shadow-sm" style={{ border: '1px solid #F0EDE6' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#B8B0A0' }}>Puntos disponibles</p>
            <p className="text-3xl font-bold" style={{ color: '#C9A84C' }}>
              {Number(puntos).toLocaleString('es-MX')}
            </p>
          </div>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #FEF9C3 0%, #FEF08A 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#92400E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
        </div>
        <p className="text-xs mt-3" style={{ color: '#B8B0A0' }}>
          Gana puntos al completar citas y puedes canjearlos como descuento en tu proxima visita.
        </p>
      </div>
    </div>
  )
}

function TabCitas({ citas, loading }) {
  if (loading) return <LoadingRows />
  if (citas.length === 0) return <EmptyCard msg="No tienes citas registradas" />
  return (
    <div className="space-y-2">
      {citas.map(c => <CitaCard key={c.id} cita={c} />)}
    </div>
  )
}

function TabPuntos({ puntos, movimientos, loading }) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-5 text-center shadow-sm" style={{ border: '1px solid #F0EDE6' }}>
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#B8B0A0' }}>Saldo actual</p>
        <p className="text-4xl font-bold" style={{ color: '#C9A84C' }}>{Number(puntos).toLocaleString('es-MX')}</p>
        <p className="text-sm mt-1" style={{ color: '#8C8274' }}>puntos acumulados</p>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#B8B0A0' }}>
          Historial de movimientos
        </h3>
        {loading ? <LoadingRows /> : movimientos.length === 0 ? (
          <EmptyCard msg="Aun no tienes movimientos de puntos" />
        ) : (
          <div className="space-y-2">
            {movimientos.map(m => (
              <div key={m.id} className="bg-white rounded-xl px-4 py-3 shadow-sm flex items-center justify-between gap-3"
                style={{ border: '1px solid #F0EDE6' }}>
                <div className="flex items-center gap-3">
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                    backgroundColor: m.tipo === 'acumulacion' ? '#F0FDF4' : '#FEF2F2',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke={m.tipo === 'acumulacion' ? '#16A34A' : '#DC2626'}
                      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      {m.tipo === 'acumulacion'
                        ? <polyline points="20 6 9 17 4 12"/>
                        : <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 5 12 12 19"/></>
                      }
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-warm-900">
                      {m.descripcion || (m.tipo === 'acumulacion' ? 'Puntos ganados' : 'Puntos canjeados')}
                    </p>
                    <p className="text-xs" style={{ color: '#B8B0A0' }}>{fmtFechaCorta(m.created_at)}</p>
                  </div>
                </div>
                <p className="text-sm font-bold flex-shrink-0"
                  style={{ color: m.tipo === 'acumulacion' ? '#16A34A' : '#DC2626' }}>
                  {m.tipo === 'acumulacion' ? '+' : '-'}{m.puntos}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TabOrdenes({ ordenes, loading }) {
  if (loading) return <LoadingRows />
  if (ordenes.length === 0) return <EmptyCard msg="No tienes ordenes registradas" />
  return (
    <div className="space-y-2">
      {ordenes.map(o => (
        <div key={o.id} className="bg-white rounded-xl p-4 shadow-sm" style={{ border: '1px solid #F0EDE6' }}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-warm-900">
              {o.items_count} {Number(o.items_count) === 1 ? 'producto' : 'productos'}
            </p>
            <EstadoBadge estado={o.estado} map={ESTADO_ORDEN_STYLE} />
          </div>
          <p className="text-xs" style={{ color: '#8C8274' }}>{o.sucursal_nombre} · {fmtFechaCorta(o.created_at)}</p>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs capitalize" style={{ color: '#B8B0A0' }}>{o.tipo_entrega}</p>
            <p className="text-sm font-bold" style={{ color: '#1A1713' }}>{fmtMXN(o.total)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Shared sub-components ─────────────────────────────────────────

function CitaCard({ cita: c }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm" style={{ border: '1px solid #F0EDE6' }}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-sm font-semibold text-warm-900">{c.servicio_nombre}</p>
        <EstadoBadge estado={c.estado} map={ESTADO_CITA_STYLE} />
      </div>
      <p className="text-xs" style={{ color: '#6B6158' }}>
        {c.estilista_nombre} · {c.sucursal_nombre}
      </p>
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs" style={{ color: '#B8B0A0' }}>{fmtFecha(c.fecha_hora)}</p>
        <p className="text-sm font-medium" style={{ color: '#1A1713' }}>{fmtMXN(c.precio_final)}</p>
      </div>
    </div>
  )
}

function EmptyCard({ msg }) {
  return (
    <div className="rounded-xl py-10 text-center" style={{ border: '1px dashed #E0DAD0', backgroundColor: '#FDFCF8' }}>
      <p className="text-sm" style={{ color: '#B8B0A0' }}>{msg}</p>
    </div>
  )
}

function LoadingRows() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white rounded-xl p-4 animate-pulse" style={{ border: '1px solid #F0EDE6', height: '72px' }} />
      ))}
    </div>
  )
}

// ── Root component ────────────────────────────────────────────────
export default function PortalPage() {
  const { sucursalId } = useParams()
  const { accessToken, login, logout } = usePortalStore()

  function handleLoginSuccess(data) {
    login(data)
  }

  function handleLogout() {
    logout()
  }

  if (accessToken) {
    return <PortalView onLogout={handleLogout} />
  }

  return <LoginView sucursalId={sucursalId} onSuccess={handleLoginSuccess} />
}
