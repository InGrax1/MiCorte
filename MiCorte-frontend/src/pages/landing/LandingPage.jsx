import { Link } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'

// ── Datos configurables del salón ──────────────────────────────
const SALON = {
  nombre:   'MiCorte',
  eslogan:  'El arte del estilo, a tu medida.',
  tagline:  'Reserva en segundos. Llega con confianza.',
  telefono: '+52 55 1234 5678',
  email:    'hola@micorte.mx',
  direccion: 'Av. Insurgentes Sur 1234, Col. Del Valle, CDMX',
  horarios: [
    { dias: 'Lunes — Viernes', horas: '9:00 — 20:00' },
    { dias: 'Sabado',          horas: '9:00 — 18:00' },
    { dias: 'Domingo',         horas: 'Cerrado' },
  ],
}

const SERVICIOS = [
  { nombre: 'Corte de cabello',       precio: '$180',  duracion: '45 min', descripcion: 'Corte personalizado adaptado a tu tipo de rostro y estilo.' },
  { nombre: 'Coloracion completa',    precio: '$650',  duracion: '2 hrs',  descripcion: 'Color de raiz a puntas con productos de primera calidad.' },
  { nombre: 'Peinado y estilizado',   precio: '$220',  duracion: '1 hr',   descripcion: 'Lavado, secado y estilizado profesional para cualquier ocasion.' },
  { nombre: 'Tratamiento capilar',    precio: '$350',  duracion: '1.5 hrs',descripcion: 'Hidratacion profunda y reparacion de cabello danado.' },
  { nombre: 'Mechas y highlights',    precio: '$800',  duracion: '3 hrs',  descripcion: 'Iluminacion artesanal con tecnica balayage o foilayage.' },
  { nombre: 'Corte + barba',          precio: '$250',  duracion: '1 hr',   descripcion: 'Corte ejecutivo con perfilado y arreglo de barba.' },
]

const EQUIPO = [
  { nombre: 'Daniela Reyes',   rol: 'Directora creativa',   especialidades: ['Coloracion', 'Mechas'],   rating: 4.9, resenas: 124, inicial: 'DR', color: '#C9A84C' },
  { nombre: 'Marco Fuentes',   rol: 'Barbero senior',       especialidades: ['Corte', 'Barba'],          rating: 4.8, resenas: 98,  inicial: 'MF', color: '#9A7C2E' },
  { nombre: 'Sofia Alcantara', rol: 'Estilista',             especialidades: ['Peinado', 'Tratamientos'], rating: 4.9, resenas: 87,  inicial: 'SA', color: '#B8973D' },
  { nombre: 'Luis Herrera',    rol: 'Estilista junior',     especialidades: ['Corte', 'Estilizado'],     rating: 4.7, resenas: 41,  inicial: 'LH', color: '#7C6122' },
]

// ── Helpers ────────────────────────────────────────────────────
function Stars({ value }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={i <= Math.round(value) ? '#C9A84C' : 'none'} stroke={i <= Math.round(value) ? '#C9A84C' : '#D6D0C4'} strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </span>
  )
}

// ── Hero ───────────────────────────────────────────────────────
function Hero() {
  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: '#0F0E0B' }}
    >
      {/* Fondo decorativo */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(201,168,76,0.06) 0%, transparent 70%)',
        }}
      />
      {/* Lineas decorativas */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ opacity: 0.04 }}>
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0"
            style={{
              left: `${i * 14.28}%`,
              width: '1px',
              background: 'linear-gradient(180deg, transparent 0%, #C9A84C 50%, transparent 100%)',
            }}
          />
        ))}
      </div>

      <div className="relative max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-8"
          style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)', color: '#C9A84C' }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#C9A84C' }} />
          Salón profesional · CDMX
        </div>

        {/* Headline */}
        <h1
          className="text-6xl md:text-7xl font-bold mb-6 leading-[1.05]"
          style={{ letterSpacing: '-0.03em' }}
        >
          <span
            style={{
              background: 'linear-gradient(135deg, #FACC15 0%, #C9A84C 40%, #B8973D 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {SALON.nombre}
          </span>
          <br />
          <span className="text-white">{SALON.eslogan}</span>
        </h1>

        <p className="text-lg mb-12 max-w-lg mx-auto" style={{ color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>
          {SALON.tagline}
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/reservar"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold rounded-xl no-underline"
            style={{ background: 'linear-gradient(135deg, #C9A84C 0%, #B8973D 100%)', color: '#1A1713' }}
          >
            Ver servicios y reservar
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
            </svg>
          </Link>
          <a
            href="#equipo"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-medium rounded-xl no-underline transition-colors"
            style={{ color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.12)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}
          >
            Conoce al equipo
          </a>
        </div>

        {/* Scroll hint */}
        <div className="mt-20 flex flex-col items-center gap-2" style={{ color: 'rgba(255,255,255,0.2)' }}>
          <span className="text-xs tracking-widest uppercase">Desliza</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </div>
      </div>
    </section>
  )
}

// ── Servicios ──────────────────────────────────────────────────
function Servicios() {
  return (
    <section id="servicios" style={{ background: '#FAFAF7' }}>
      <div className="max-w-6xl mx-auto px-6 py-24">
        <div className="mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#C9A84C' }}>
            Servicios
          </p>
          <h2
            className="text-4xl font-bold text-warm-900"
            style={{ letterSpacing: '-0.02em' }}
          >
            Lo que hacemos mejor
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {SERVICIOS.map(s => (
            <div
              key={s.nombre}
              className="bg-white rounded-2xl p-6 transition-all cursor-default"
              style={{ border: '1px solid #EBE8E0' }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)'
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(201,168,76,0.08)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#EBE8E0'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-warm-900">{s.nombre}</h3>
                <span
                  className="text-sm font-bold ml-3 flex-shrink-0"
                  style={{ color: '#C9A84C' }}
                >
                  {s.precio}
                </span>
              </div>
              <p className="text-sm leading-relaxed mb-4" style={{ color: '#8C8274' }}>
                {s.descripcion}
              </p>
              <div className="flex items-center justify-between">
                <span
                  className="inline-flex items-center gap-1.5 text-xs"
                  style={{ color: '#B8B0A0' }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {s.duracion}
                </span>
                <Link
                  to="/reservar"
                  className="text-xs font-semibold no-underline transition-colors"
                  style={{ color: '#C9A84C' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#9A7C2E'}
                  onMouseLeave={e => e.currentTarget.style.color = '#C9A84C'}
                >
                  Reservar →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Equipo ─────────────────────────────────────────────────────
function Equipo() {
  return (
    <section id="equipo" style={{ background: 'white', borderTop: '1px solid #EBE8E0' }}>
      <div className="max-w-6xl mx-auto px-6 py-24">
        <div className="mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#C9A84C' }}>
            Equipo
          </p>
          <h2
            className="text-4xl font-bold text-warm-900"
            style={{ letterSpacing: '-0.02em' }}
          >
            Profesionales que te cuidan
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {EQUIPO.map(e => (
            <div key={e.nombre} className="text-center">
              {/* Avatar */}
              <div className="relative inline-block mb-4">
                <div
                  className="w-24 h-24 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mx-auto"
                  style={{ background: `linear-gradient(135deg, ${e.color} 0%, ${e.color}99 100%)` }}
                >
                  {e.inicial}
                </div>
                {/* Rating badge */}
                <div
                  className="absolute -bottom-2 -right-2 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold"
                  style={{ background: '#0F0E0B', color: '#FACC15' }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="#FACC15" stroke="none">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  {e.rating}
                </div>
              </div>

              <p className="font-semibold text-warm-900 text-sm">{e.nombre}</p>
              <p className="text-xs mt-0.5 mb-3" style={{ color: '#8C8274' }}>{e.rol}</p>

              <div className="flex flex-wrap justify-center gap-1">
                {e.especialidades.map(esp => (
                  <span
                    key={esp}
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: '#FEF9C3', color: '#92400E' }}
                  >
                    {esp}
                  </span>
                ))}
              </div>

              <p className="text-xs mt-3" style={{ color: '#B8B0A0' }}>
                {e.resenas} reseñas
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Contacto ───────────────────────────────────────────────────
function Contacto() {
  return (
    <section id="contacto" style={{ background: '#0F0E0B' }}>
      <div className="max-w-6xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-16 items-start">
        {/* Info */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#C9A84C' }}>
            Contacto
          </p>
          <h2
            className="text-4xl font-bold text-white mb-8"
            style={{ letterSpacing: '-0.02em' }}
          >
            Visítanos o<br />escríbenos
          </h2>

          <div className="space-y-5">
            {[
              {
                icon: <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></>,
                label: 'Direccion',
                value: SALON.direccion,
              },
              {
                icon: <><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12 19.79 19.79 0 0 1 1.08 3.4 2 2 0 0 1 3.05 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16z"/></>,
                label: 'Telefono',
                value: SALON.telefono,
              },
              {
                icon: <><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></>,
                label: 'Email',
                value: SALON.email,
              },
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.2)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {icon}
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {label}
                  </p>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Horarios + CTA */}
        <div>
          <div
            className="rounded-2xl p-7 mb-6"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <p className="text-sm font-semibold text-white mb-5">Horario de atencion</p>
            <div className="space-y-3">
              {SALON.horarios.map(({ dias, horas }) => (
                <div key={dias} className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{dias}</span>
                  <span
                    className="text-sm font-medium"
                    style={{ color: horas === 'Cerrado' ? 'rgba(255,255,255,0.25)' : '#C9A84C' }}
                  >
                    {horas}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div
            className="rounded-2xl p-7"
            style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.15) 0%, rgba(201,168,76,0.05) 100%)', border: '1px solid rgba(201,168,76,0.2)' }}
          >
            <p className="text-sm font-semibold text-white mb-2">Reserva tu cita ahora</p>
            <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Elige servicio, estilista y horario en segundos desde nuestro sistema.
            </p>
            <Link
              to="/reservar"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl no-underline"
              style={{ background: 'linear-gradient(135deg, #C9A84C 0%, #B8973D 100%)', color: '#1A1713' }}
            >
              Reservar ahora
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Footer ─────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ background: '#0F0E0B', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #C9A84C 0%, #9A7C2E 100%)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
              <line x1="20" y1="4" x2="8.12" y2="15.88"/>
              <line x1="14.47" y1="14.48" x2="20" y2="20"/>
              <line x1="8.12" y1="8.12" x2="12" y2="12"/>
            </svg>
          </div>
          <span className="text-white font-semibold text-sm">{SALON.nombre}</span>
        </div>

        <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.2)' }}>
          © {new Date().getFullYear()} {SALON.nombre}. Todos los derechos reservados.
        </p>

        <div className="flex items-center gap-5">
          {['Privacidad', 'Terminos'].map(l => (
            <a
              key={l} href="#"
              className="text-xs no-underline"
              style={{ color: 'rgba(255,255,255,0.25)' }}
              onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.5)'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.25)'}
            >
              {l}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}

// ── Page ───────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div style={{ fontFamily: '"Hanken Grotesk", system-ui, sans-serif' }}>
      <Navbar />
      <Hero />
      <Servicios />
      <Equipo />
      <Contacto />
      <Footer />
    </div>
  )
}
