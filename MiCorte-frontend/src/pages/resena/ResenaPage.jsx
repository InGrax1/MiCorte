import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '@/lib/api'

// ── Star picker ─────────────────────────────────────────────────
function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0)

  const labels = ['', 'Malo', 'Regular', 'Bueno', 'Muy bueno', 'Excelente']
  const active = hovered || value

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            className="cursor-pointer transition-transform"
            style={{ background: 'none', border: 'none', padding: '4px', transform: active >= n ? 'scale(1.15)' : 'scale(1)' }}
            aria-label={`${n} estrellas`}
          >
            <svg
              width="36" height="36" viewBox="0 0 24 24"
              fill={active >= n ? '#C9A84C' : 'none'}
              stroke={active >= n ? '#C9A84C' : '#D6D0C4'}
              strokeWidth="1.5"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </button>
        ))}
      </div>
      <span
        className="text-sm font-medium transition-all"
        style={{
          color: active ? '#C9A84C' : '#C8C2B6',
          minHeight: '20px',
          opacity: active ? 1 : 0,
        }}
      >
        {labels[active]}
      </span>
    </div>
  )
}

// ── Layout wrapper ───────────────────────────────────────────────
function PageShell({ children }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ backgroundColor: '#FAFAF7' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-8">
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px',
          background: 'linear-gradient(135deg, #C9A84C 0%, #B8973D 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F0E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2v20M18 2v20M6 12h12M2 6h4M18 6h4M2 18h4M18 18h4"/>
          </svg>
        </div>
        <span style={{ fontSize: '20px', fontWeight: 700, color: '#1A1713', letterSpacing: '-0.3px' }}>
          MiCorte
        </span>
      </div>

      {/* Card */}
      <div
        className="w-full"
        style={{
          maxWidth: '440px',
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          padding: '36px 32px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)',
          border: '1px solid #F0EDE6',
        }}
      >
        {children}
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────
export default function ResenaPage() {
  const { token } = useParams()

  const [status,     setStatus]     = useState('loading') // loading | error | expired | done | pending | success
  const [resena,     setResena]     = useState(null)
  const [errorMsg,   setErrorMsg]   = useState('')
  const [rating,     setRating]     = useState(0)
  const [comentario, setComentario] = useState('')
  const [submitErr,  setSubmitErr]  = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api.get(`/resenas/token/${token}`)
      .then(res => {
        const data = res.data.data
        setResena(data)
        if (data.respondido_at) {
          setStatus('done')
          setRating(data.rating ?? 0)
        } else {
          setStatus('pending')
        }
      })
      .catch(err => {
        const status = err.response?.status
        const msg    = err.response?.data?.message || 'Error al cargar la reseña'
        if (status === 410) setStatus('expired')
        else { setStatus('error'); setErrorMsg(msg) }
      })
  }, [token])

  async function handleSubmit(e) {
    e.preventDefault()
    if (rating === 0) { setSubmitErr('Selecciona una calificacion'); return }
    setSubmitErr('')
    setSubmitting(true)
    try {
      await api.post(`/resenas/token/${token}`, { rating, comentario: comentario || undefined })
      setStatus('success')
    } catch (err) {
      const status = err.response?.status
      const msg    = err.response?.data?.message || 'Error al enviar tu reseña'
      if (status === 409) setStatus('done')
      else setSubmitErr(msg)
    } finally {
      setSubmitting(false)
    }
  }

  // ── Loading ──
  if (status === 'loading') {
    return (
      <PageShell>
        <div className="flex flex-col items-center gap-4 py-8">
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: '#C9A84C', borderTopColor: 'transparent' }}
          />
          <p className="text-sm" style={{ color: '#8C8274' }}>Cargando...</p>
        </div>
      </PageShell>
    )
  }

  // ── Token inválido ──
  if (status === 'error') {
    return (
      <PageShell>
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            backgroundColor: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <div>
            <h2 className="font-semibold text-warm-900 mb-1">Enlace no valido</h2>
            <p className="text-sm" style={{ color: '#8C8274' }}>{errorMsg}</p>
          </div>
        </div>
      </PageShell>
    )
  }

  // ── Token expirado ──
  if (status === 'expired') {
    return (
      <PageShell>
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            backgroundColor: '#FEF9C3', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div>
            <h2 className="font-semibold text-warm-900 mb-1">Enlace expirado</h2>
            <p className="text-sm" style={{ color: '#8C8274' }}>
              Este enlace de reseña ya no es valido. Los enlaces tienen una vigencia de 7 dias.
            </p>
          </div>
        </div>
      </PageShell>
    )
  }

  // ── Ya respondida ──
  if (status === 'done') {
    return (
      <PageShell>
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            backgroundColor: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div>
            <h2 className="font-semibold text-warm-900 mb-1">Ya enviaste tu reseña</h2>
            <p className="text-sm" style={{ color: '#8C8274' }}>
              Gracias, {resena?.cliente_nombre?.split(' ')[0]}. Tu opinion ya fue registrada.
            </p>
          </div>
          {rating > 0 && (
            <div className="flex gap-1 mt-1">
              {[1,2,3,4,5].map(n => (
                <svg key={n} width="20" height="20" viewBox="0 0 24 24"
                  fill={n <= rating ? '#C9A84C' : 'none'}
                  stroke={n <= rating ? '#C9A84C' : '#D6D0C4'}
                  strokeWidth="1.5"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              ))}
            </div>
          )}
        </div>
      </PageShell>
    )
  }

  // ── Exito tras enviar ──
  if (status === 'success') {
    return (
      <PageShell>
        <div className="flex flex-col items-center gap-5 py-6 text-center">
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #C9A84C 0%, #B8973D 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0F0E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-warm-900 mb-2">
              Gracias, {resena?.cliente_nombre?.split(' ')[0]}
            </h2>
            <p className="text-sm" style={{ color: '#6B6158' }}>
              Tu opinion nos ayuda a seguir mejorando.
            </p>
            {resena?.estilista_nombre && (
              <p className="text-sm mt-1" style={{ color: '#8C8274' }}>
                Tu reseña de <strong>{resena.estilista_nombre}</strong> fue registrada.
              </p>
            )}
          </div>
          <div className="flex gap-1.5">
            {[1,2,3,4,5].map(n => (
              <svg key={n} width="22" height="22" viewBox="0 0 24 24"
                fill={n <= rating ? '#C9A84C' : 'none'}
                stroke={n <= rating ? '#C9A84C' : '#D6D0C4'}
                strokeWidth="1.5"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            ))}
          </div>
        </div>
      </PageShell>
    )
  }

  // ── Formulario (pending) ──
  return (
    <PageShell>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Encabezado */}
        <div className="text-center">
          <h1 className="text-xl font-bold text-warm-900 mb-1">
            Califica tu visita
          </h1>
          <p className="text-sm" style={{ color: '#6B6158' }}>
            Hola <strong>{resena?.cliente_nombre?.split(' ')[0]}</strong>, como fue tu experiencia
            {resena?.estilista_nombre ? <> con <strong>{resena.estilista_nombre}</strong></> : ''}?
          </p>
          {resena?.sucursal_nombre && (
            <p className="text-xs mt-1" style={{ color: '#B8B0A0' }}>{resena.sucursal_nombre}</p>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: '1px', backgroundColor: '#F0EDE6' }} />

        {/* Stars */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#B8B0A0' }}>
            Tu calificacion
          </p>
          <StarPicker value={rating} onChange={setRating} />
        </div>

        {/* Comentario */}
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B6158' }}>
            Comentario <span style={{ color: '#B8B0A0', fontWeight: 400 }}>(opcional)</span>
          </label>
          <textarea
            value={comentario}
            onChange={e => setComentario(e.target.value)}
            placeholder="Cuentanos como fue tu experiencia..."
            maxLength={1000}
            rows={4}
            className="w-full rounded-xl px-4 py-3 text-sm text-warm-900 outline-none resize-none transition-colors"
            style={{
              border: '1px solid #EBE8E0',
              backgroundColor: '#FAFAF7',
              lineHeight: '1.6',
            }}
            onFocus={e  => e.target.style.borderColor = '#C9A84C'}
            onBlur={e   => e.target.style.borderColor = '#EBE8E0'}
          />
          <div className="flex justify-between mt-1">
            {submitErr ? (
              <p className="text-xs" style={{ color: '#DC2626' }}>{submitErr}</p>
            ) : <span />}
            <p className="text-xs" style={{ color: '#C8C2B6' }}>{comentario.length}/1000</p>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || rating === 0}
          className="w-full py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer"
          style={{
            backgroundColor: rating > 0 ? '#C9A84C' : '#E5E1D8',
            color: rating > 0 ? '#0F0E0B' : '#B8B0A0',
            border: 'none',
          }}
          onMouseOver={e => { if (rating > 0 && !submitting) e.currentTarget.style.backgroundColor = '#FACC15' }}
          onMouseOut={e  => { if (rating > 0) e.currentTarget.style.backgroundColor = '#C9A84C' }}
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#0F0E0B', borderTopColor: 'transparent' }} />
              Enviando...
            </span>
          ) : 'Enviar reseña'}
        </button>
      </form>
    </PageShell>
  )
}
