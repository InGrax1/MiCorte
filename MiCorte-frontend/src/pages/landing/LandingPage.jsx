import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import Navbar from '@/components/layout/Navbar'
import ParallaxBarberia from '@/components/landing/ParallaxBarberia'

gsap.registerPlugin(ScrollTrigger)

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

const STATS = [
  { value: 12000, suffix: '+', decimals: 0, label: 'Cortes realizados' },
  { value: 4.8,   suffix: '',  decimals: 1, label: 'Valoracion promedio' },
  { value: 350,   suffix: '+', decimals: 0, label: 'Resenas verificadas' },
  { value: 10,    suffix: '',  decimals: 0, label: 'Anos de experiencia' },
]

const MARQUEE_ITEMS = ['Corte', 'Barba', 'Color', 'Mechas', 'Tratamientos', 'Peinado', 'Estilizado']

// Collage del hero: fotos de cortes en abanico alrededor del logo.
// Posiciones en % del contenedor cuadrado; cada pieza con su rotacion.
const COLLAGE = [
  { src: '/img/landing/barber-corte.jpg',       left: 27, top: -2, rot: -12 },
  { src: '/img/landing/corte-maquina.jpg',      left: 54, top: 8,  rot: 14  },
  { src: '/img/landing/navaja-barba.jpg',       left: 56, top: 40, rot: 26  },
  { src: '/img/landing/barba-perfilado.jpg',    left: 29, top: 56, rot: -8  },
  { src: '/img/landing/salon-espejos.jpg',      left: 3,  top: 44, rot: -20 },
  { src: '/img/landing/barberia-interior.jpg',  left: 0,  top: 10, rot: -30 },
]

const GALERIA = [
  { src: '/img/landing/barberia-interior.jpg', alt: 'Interior de la barberia con sillones clasicos', label: 'Nuestro espacio',     span: 'sm:col-span-2' },
  { src: '/img/landing/corte-maquina.jpg',     alt: 'Barbero estilizando a un cliente',             label: 'Acabado profesional', span: '' },
  { src: '/img/landing/navaja-barba.jpg',      alt: 'Perfilado de barba con navaja',                label: 'Detalle a navaja',    span: '' },
  { src: '/img/landing/salon-espejos.jpg',     alt: 'Area de estilismo y color',                    label: 'Area de color',       span: 'sm:col-span-2' },
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

function ArrowIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
    </svg>
  )
}

// ── Hero ───────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="hero-section relative overflow-hidden" style={{ background: '#0F0E0B', minHeight: '100svh' }}>
      {/* Escena parallax por capas: sala -> muebles -> sillones -> lamparas */}
      <ParallaxBarberia className="absolute inset-0" />

      {/* Degradado para legibilidad y fusion con la siguiente seccion */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, rgba(15,14,11,0.6) 0%, rgba(15,14,11,0.2) 35%, rgba(15,14,11,0.3) 70%, #0F0E0B 100%)' }} />

      <div className="hero-content relative max-w-6xl mx-auto px-6 flex flex-col justify-center"
        style={{ minHeight: '100svh', paddingTop: '96px', paddingBottom: '120px' }}>

        {/* Collage de cortes + logo — espacio derecho del hero (solo desktop) */}
        <div className="hidden lg:block absolute pointer-events-none"
          style={{ right: '-3%', top: '50%', transform: 'translateY(-50%)', width: 'min(28vw, 480px)', height: 'min(28vw, 480px)' }}>
          {COLLAGE.map(c => (
            <div key={c.src} className="collage-item absolute rounded-3xl overflow-hidden"
              style={{
                width: '44%', height: '44%',
                left: `${c.left}%`, top: `${c.top}%`,
                transform: `rotate(${c.rot}deg)`,
                border: '1px solid rgba(201,168,76,0.25)',
                boxShadow: '0 18px 40px rgba(0,0,0,0.5)',
              }}>
              <img src={c.src} alt="" loading="lazy" decoding="async"
                className="w-full h-full object-cover"
                style={{ filter: 'brightness(0.85) saturate(0.9)' }} />
            </div>
          ))}

          {/* Logo circular al centro */}
          <div className="collage-logo absolute rounded-full flex flex-col items-center justify-center text-center"
            style={{
              left: '50%', top: '50%', width: '42%', height: '42%',
              transform: 'translate(-50%, -50%)',
              background: 'linear-gradient(145deg, #1A1713 0%, #0F0E0B 100%)',
              border: '2px solid rgba(201,168,76,0.55)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.65), 0 0 0 8px rgba(15,14,11,0.55), 0 0 44px rgba(201,168,76,0.25)',
            }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-2"
              style={{ background: 'linear-gradient(135deg, #C9A84C 0%, #9A7C2E 100%)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0F0E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
                <line x1="20" y1="4" x2="8.12" y2="15.88"/>
                <line x1="14.47" y1="14.48" x2="20" y2="20"/>
                <line x1="8.12" y1="8.12" x2="12" y2="12"/>
              </svg>
            </div>
            <p className="font-extrabold text-white" style={{ fontSize: 'clamp(1rem, 1.4vw, 1.5rem)', letterSpacing: '-0.02em' }}>
              {SALON.nombre}
            </p>
            <p className="text-xs font-semibold tracking-[0.3em] uppercase mt-1" style={{ color: '#C9A84C' }}>
              Barberia
            </p>
          </div>
        </div>

        {/* Titulo gigante con reveal por linea */}
        <h1 className="font-extrabold leading-[0.95] mb-7" style={{ letterSpacing: '-0.03em', fontSize: 'clamp(3rem, 9.5vw, 7.5rem)' }}>
          <span className="hero-line block overflow-hidden">
            <span className="inline-block text-white">El arte</span>
          </span>
          <span className="hero-line block overflow-hidden">
            <span className="inline-block" style={{ color: '#C9A84C' }}>del estilo,</span>
          </span>
          <span className="hero-line block overflow-hidden">
            <span className="inline-block text-white">a tu medida.</span>
          </span>
        </h1>

        <p className="hero-sub max-w-md text-base sm:text-lg mb-9" style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
          {SALON.tagline} Corte, barba y color con los mejores estilistas de la ciudad.
        </p>

        {/* CTAs — misma altura fija para alineacion exacta */}
        <div className="hero-cta flex flex-wrap items-stretch gap-3 mb-12">
          <Link to="/reservar"
            className="inline-flex h-[52px] items-center gap-2 px-7 text-sm font-bold rounded-xl no-underline transition-transform hover:scale-[1.03] active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #C9A84C 0%, #B8973D 100%)', color: '#1A1713', boxShadow: '0 8px 32px rgba(201,168,76,0.35)' }}>
            Reservar cita
            <ArrowIcon />
          </Link>
          <a href="#servicios"
            className="inline-flex h-[52px] items-center gap-2 px-7 text-sm font-semibold rounded-xl no-underline transition-colors"
            style={{ color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(201,168,76,0.6)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}>
            Ver servicios
          </a>
        </div>

        {/* Tarjetas flotantes — estilo referencia */}
        <div className="flex flex-wrap items-stretch gap-3">
          <div className="hero-float flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)' }}>
            <span className="text-2xl font-extrabold text-white">4.8</span>
            <div>
              <Stars value={4.8} />
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>350+ resenas</p>
            </div>
          </div>
          <div className="hero-float flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(201,168,76,0.28)', backdropFilter: 'blur(12px)' }}>
            <div className="relative w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(201,168,76,0.16)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/>
              </svg>
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full animate-pulse"
                style={{ background: '#4ADE80', boxShadow: '0 0 8px rgba(74,222,128,0.7)', border: '2px solid #0F0E0B' }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white" style={{ lineHeight: 1.15 }}>Reserva online</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>Lista en menos de 60 segundos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Indicador de scroll */}
      <div className="hero-float absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none">
        <span className="text-xs tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>Scroll</span>
        <div className="w-px h-10 overflow-hidden" style={{ background: 'rgba(255,255,255,0.12)' }}>
          <div className="w-px h-4 scroll-hint-dot" style={{ background: '#C9A84C' }} />
        </div>
      </div>
    </section>
  )
}

// ── Marquee ────────────────────────────────────────────────────
function Marquee() {
  const row = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS]
  return (
    <div className="overflow-hidden py-5 select-none" style={{ background: '#C9A84C' }} aria-hidden="true">
      <div className="marquee-track flex items-center gap-10 whitespace-nowrap w-max">
        {row.map((item, i) => (
          <span key={i} className="flex items-center gap-10">
            <span className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight" style={{ color: '#1A1713' }}>{item}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#1A1713"><circle cx="12" cy="12" r="4"/></svg>
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Stats ──────────────────────────────────────────────────────
function StatsBar() {
  return (
    <section style={{ background: '#FAFAF7', borderBottom: '1px solid #EFEBE2' }}>
      <div className="max-w-6xl mx-auto px-6 py-16 sm:py-20 grid grid-cols-2 lg:grid-cols-4 gap-10">
        {STATS.map(s => (
          <div key={s.label} className="reveal text-center lg:text-left">
            <p className="text-4xl sm:text-5xl font-extrabold mb-2" style={{ color: '#0F0E0B', letterSpacing: '-0.03em' }}>
              <span className="stat-num" data-value={s.value} data-decimals={s.decimals} data-suffix={s.suffix}>
                {s.value.toLocaleString('es-MX', { minimumFractionDigits: s.decimals, maximumFractionDigits: s.decimals })}{s.suffix}
              </span>
            </p>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#8C8274' }}>{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── Servicios (bento grid) ─────────────────────────────────────
function ServCard({ s, featured = false }) {
  return (
    <div
      className={`serv-card group relative rounded-3xl overflow-hidden p-6 sm:p-7 flex flex-col cursor-pointer transition-shadow hover:shadow-xl ${featured ? 'lg:col-span-2 lg:row-span-2 justify-between' : ''}`}
      style={{
        background: featured ? '#0F0E0B' : '#FFFFFF',
        border: featured ? '1px solid rgba(201,168,76,0.25)' : '1px solid #EFEBE2',
        minHeight: featured ? '320px' : undefined,
      }}>
      {featured && (
        <>
          <img src="/img/landing/barber-corte.jpg" alt="" loading="lazy" decoding="async"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(160deg, rgba(15,14,11,0.93) 0%, rgba(15,14,11,0.55) 55%, rgba(15,14,11,0.88) 100%)' }} />
        </>
      )}
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <span className="text-xs font-semibold px-3 py-1 rounded-full"
            style={featured
              ? { background: 'rgba(201,168,76,0.15)', color: '#C9A84C' }
              : { background: '#F5F0E8', color: '#8C8274' }}>
            {s.duracion}
          </span>
          <span className={`font-extrabold ${featured ? 'text-3xl' : 'text-xl'}`} style={{ color: '#C9A84C', letterSpacing: '-0.02em' }}>
            {s.precio}
          </span>
        </div>
        <h3 className={`font-bold mb-2 ${featured ? 'text-2xl sm:text-4xl' : 'text-lg'}`}
          style={{ color: featured ? '#FFFFFF' : '#0F0E0B', letterSpacing: '-0.02em' }}>
          {s.nombre}
        </h3>
        <p className={`leading-relaxed ${featured ? 'text-sm sm:text-base max-w-sm' : 'text-sm'}`}
          style={{ color: featured ? 'rgba(255,255,255,0.5)' : '#8C8274' }}>
          {s.descripcion}
        </p>
      </div>
      <Link to="/reservar"
        className="relative mt-6 inline-flex items-center gap-2 text-sm font-semibold no-underline w-fit transition-all group-hover:gap-3"
        style={{ color: '#C9A84C' }}>
        Reservar
        <ArrowIcon size={13} />
      </Link>
    </div>
  )
}

function Servicios() {
  return (
    <section id="servicios" style={{ background: '#FAFAF7' }}>
      <div className="max-w-6xl mx-auto px-6 py-24 sm:py-32">
        <div className="reveal flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#9A7C2E' }}>
              Servicios
            </p>
            <h2 className="text-4xl sm:text-5xl font-extrabold" style={{ color: '#0F0E0B', letterSpacing: '-0.03em' }}>
              Disenado para tu<br />mejor version
            </h2>
          </div>
          <Link to="/reservar"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl no-underline self-start sm:self-auto transition-transform hover:scale-[1.03]"
            style={{ background: '#0F0E0B', color: '#C9A84C' }}>
            Reservar ahora
            <ArrowIcon size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          <ServCard s={SERVICIOS[0]} featured />
          {SERVICIOS.slice(1).map(s => <ServCard key={s.nombre} s={s} />)}
        </div>
      </div>
    </section>
  )
}

// ── Equipo ─────────────────────────────────────────────────────
function Equipo() {
  return (
    <section id="equipo" style={{ background: '#0F0E0B' }}>
      <div className="max-w-6xl mx-auto px-6 py-24 sm:py-32">
        <div className="reveal text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#C9A84C' }}>
            Nuestro equipo
          </p>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white" style={{ letterSpacing: '-0.03em' }}>
            Profesionales que te cuidan
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {EQUIPO.map(e => (
            <div key={e.nombre}
              className="team-card rounded-3xl p-6 text-center transition-colors"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              onMouseEnter={ev => ev.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)'}
              onMouseLeave={ev => ev.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}>
              <div className="relative inline-block mb-4">
                <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mx-auto"
                  style={{ background: `linear-gradient(135deg, ${e.color} 0%, ${e.color}99 100%)` }}>
                  {e.inicial}
                </div>
                <div className="absolute -bottom-2 -right-2 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold"
                  style={{ background: '#0F0E0B', color: '#FACC15', border: '1px solid rgba(250,204,21,0.25)' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="#FACC15" stroke="none">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  {e.rating}
                </div>
              </div>

              <p className="font-semibold text-white text-sm">{e.nombre}</p>
              <p className="text-xs mt-0.5 mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>{e.rol}</p>

              <div className="flex flex-wrap justify-center gap-1">
                {e.especialidades.map(esp => (
                  <span key={esp} className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(201,168,76,0.12)', color: '#C9A84C' }}>
                    {esp}
                  </span>
                ))}
              </div>

              <p className="text-xs mt-3" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {e.resenas} resenas
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Galeria ────────────────────────────────────────────────────
function Galeria() {
  return (
    <section style={{ background: '#0F0E0B' }}>
      <div className="max-w-6xl mx-auto px-6 pb-24 sm:pb-32">
        <div className="reveal mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#C9A84C' }}>
            Galeria
          </p>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white" style={{ letterSpacing: '-0.03em' }}>
            Nuestra casa,<br />tu estilo
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          {GALERIA.map(g => (
            <div key={g.src}
              className={`gallery-item group relative rounded-3xl overflow-hidden ${g.span}`}
              style={{ height: 'clamp(240px, 30vw, 360px)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {/* Capa con parallax interno (GSAP mueve este wrapper, CSS escala la img al hover) */}
              <div className="gallery-par absolute" style={{ inset: '-10% 0' }}>
                <img src={g.src} alt={g.alt} loading="lazy" decoding="async"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.06]" />
              </div>
              <div className="absolute inset-x-0 bottom-0 pointer-events-none"
                style={{ height: '55%', background: 'linear-gradient(180deg, transparent 0%, rgba(15,14,11,0.85) 100%)' }} />
              <p className="absolute bottom-4 left-5 text-sm font-semibold text-white">
                {g.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── CTA cinematografica ────────────────────────────────────────
function BigCTA() {
  return (
    <section className="cta-section relative overflow-hidden" style={{ background: '#141209' }}>
      {/* Resplandor dorado animado con scroll */}
      <div className="cta-glow absolute pointer-events-none rounded-full"
        style={{
          width: '70vw', height: '70vw', left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(201,168,76,0.28) 0%, rgba(154,124,46,0.12) 40%, transparent 70%)',
          opacity: 0.5,
        }} />

      <div className="relative max-w-6xl mx-auto px-6 py-28 sm:py-40 text-center">
        <h2 className="font-extrabold leading-[1.02] mb-8" style={{ letterSpacing: '-0.03em', fontSize: 'clamp(2.5rem, 7vw, 5.5rem)' }}>
          <span className="cta-line block overflow-hidden">
            <span className="inline-block text-white">Tu proximo corte</span>
          </span>
          <span className="cta-line block overflow-hidden">
            <span className="inline-block" style={{ background: 'linear-gradient(135deg, #C9A84C 0%, #FACC15 60%, #C9A84C 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
              comienza aqui.
            </span>
          </span>
        </h2>
        <p className="reveal max-w-md mx-auto text-base mb-10" style={{ color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
          Unete a los mas de 12,000 clientes que confian su estilo a {SALON.nombre}.
        </p>
        <div className="reveal flex flex-wrap justify-center gap-3">
          <Link to="/reservar"
            className="inline-flex items-center gap-2 px-8 py-4 text-sm font-bold rounded-xl no-underline transition-transform hover:scale-[1.04] active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #C9A84C 0%, #B8973D 100%)', color: '#1A1713', boxShadow: '0 10px 40px rgba(201,168,76,0.4)' }}>
            Reservar cita
            <ArrowIcon />
          </Link>
          <Link to="/tienda"
            className="inline-flex items-center gap-2 px-8 py-4 text-sm font-semibold rounded-xl no-underline transition-colors"
            style={{ color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.2)' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(201,168,76,0.6)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}>
            Visitar tienda
          </Link>
        </div>
      </div>
    </section>
  )
}

// ── Contacto ───────────────────────────────────────────────────
function Contacto() {
  return (
    <section id="contacto" style={{ background: '#0F0E0B', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="max-w-6xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-16 items-start">
        {/* Info */}
        <div className="reveal">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#C9A84C' }}>
            Contacto
          </p>
          <h2 className="text-4xl font-extrabold text-white mb-8" style={{ letterSpacing: '-0.02em' }}>
            Visitanos o<br />escribenos
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
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.2)' }}>
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
        <div className="reveal">
          <div className="rounded-2xl p-7 mb-6"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-sm font-semibold text-white mb-5">Horario de atencion</p>
            <div className="space-y-3">
              {SALON.horarios.map(({ dias, horas }) => (
                <div key={dias} className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{dias}</span>
                  <span className="text-sm font-medium"
                    style={{ color: horas === 'Cerrado' ? 'rgba(255,255,255,0.25)' : '#C9A84C' }}>
                    {horas}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl p-7"
            style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.15) 0%, rgba(201,168,76,0.05) 100%)', border: '1px solid rgba(201,168,76,0.2)' }}>
            <p className="text-sm font-semibold text-white mb-2">Reserva tu cita ahora</p>
            <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Elige servicio, estilista y horario en segundos desde nuestro sistema.
            </p>
            <Link to="/reservar"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl no-underline"
              style={{ background: 'linear-gradient(135deg, #C9A84C 0%, #B8973D 100%)', color: '#1A1713' }}>
              Reservar ahora
              <ArrowIcon />
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
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #C9A84C 0%, #9A7C2E 100%)' }}>
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
            <a key={l} href="#"
              className="text-xs no-underline"
              style={{ color: 'rgba(255,255,255,0.25)' }}
              onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.5)'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.25)'}>
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
  const rootRef = useRef(null)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return // sin animaciones: el contenido es visible por defecto

    // ── Lenis: scroll suave de alta gama ──
    const lenis = new Lenis({ duration: 1.15, smoothWheel: true, anchors: true })
    lenis.on('scroll', ScrollTrigger.update)
    const tick = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    // ── GSAP: escenas cinematograficas por seccion ──
    const ctx = gsap.context(() => {
      // Hero: entrada en cascada
      gsap.timeline({ defaults: { ease: 'power4.out' } })
        .from('.hero-line > span', { yPercent: 115, duration: 1.1, stagger: 0.13, delay: 0.15 })
        .from('.hero-sub', { y: 28, opacity: 0, duration: 0.9 }, '-=0.65')
        .from('.hero-cta > *', { y: 22, opacity: 0, duration: 0.7, stagger: 0.08, clearProps: 'transform,opacity' }, '-=0.6')
        .from('.hero-float', { y: 30, opacity: 0, duration: 0.8, stagger: 0.1 }, '-=0.5')

      // ── Collage: cada pieza con animacion independiente ──
      // Entrada: las fotos brotan en cascada con rebote; el logo al final con elastico
      gsap.from('.collage-item', {
        scale: 0, opacity: 0, duration: 0.9, ease: 'back.out(1.7)',
        stagger: 0.13, delay: 0.7,
      })
      gsap.from('.collage-logo', {
        scale: 0, opacity: 0, duration: 1.2, ease: 'elastic.out(1, 0.55)', delay: 1.6,
      })
      // Flotacion continua: cada foto con su propia amplitud, duracion y fase
      gsap.utils.toArray('.collage-item').forEach((el, i) => {
        gsap.to(el, {
          y: `+=${9 + (i % 3) * 5}`,
          rotate: `+=${i % 2 ? 2.5 : -2.5}`,
          duration: 2.4 + i * 0.45,
          repeat: -1, yoyo: true, ease: 'sine.inOut',
          delay: 1.8 + i * 0.3,
        })
      })
      // El logo levita lento, a su propio ritmo
      gsap.to('.collage-logo', {
        y: '+=10', duration: 3.4, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 2.6,
      })

      // Hero: parallax de salida al hacer scroll
      gsap.to('.hero-content', {
        yPercent: -16, opacity: 0.1, ease: 'none',
        scrollTrigger: { trigger: '.hero-section', start: 'top top', end: 'bottom top', scrub: true },
      })

      // Reveals genericos
      gsap.utils.toArray('.reveal').forEach(el => {
        gsap.from(el, {
          y: 48, opacity: 0, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 86%', once: true },
        })
      })

      // Servicios: cards en stagger.
      // Estado inicial con gsap.set + animar con gsap.to — un gsap.from dentro
      // de onEnter ocultaria la card cuando ya esta en pantalla (parpadeo).
      gsap.set('.serv-card', { y: 56, opacity: 0, scale: 0.97 })
      ScrollTrigger.batch('.serv-card', {
        start: 'top 88%', once: true,
        onEnter: els => gsap.to(els, {
          y: 0, opacity: 1, scale: 1, duration: 0.9, stagger: 0.09, ease: 'power3.out',
        }),
      })

      // Equipo: cards con rotacion alterna
      gsap.utils.toArray('.team-card').forEach((el, i) => {
        gsap.from(el, {
          y: 60, opacity: 0, rotate: i % 2 ? 2 : -2, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        })
      })

      // Galeria: reveal de cada pieza + parallax interno de la foto.
      // Mismo patron set + to que en serv-card para evitar el parpadeo.
      gsap.set('.gallery-item', { y: 64, opacity: 0 })
      ScrollTrigger.batch('.gallery-item', {
        start: 'top 88%', once: true,
        onEnter: els => gsap.to(els, {
          y: 0, opacity: 1, duration: 1, stagger: 0.1, ease: 'power3.out',
        }),
      })
      gsap.utils.toArray('.gallery-par').forEach(el => {
        gsap.fromTo(el, { yPercent: -6 }, {
          yPercent: 6, ease: 'none',
          scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
        })
      })

      // Contadores de stats
      gsap.utils.toArray('.stat-num').forEach(el => {
        const end      = parseFloat(el.dataset.value)
        const decimals = Number(el.dataset.decimals || 0)
        const suffix   = el.dataset.suffix || ''
        const obj = { v: 0 }
        gsap.to(obj, {
          v: end, duration: 1.8, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
          onUpdate: () => {
            el.textContent = obj.v.toLocaleString('es-MX', {
              minimumFractionDigits: decimals, maximumFractionDigits: decimals,
            }) + suffix
          },
        })
      })

      // CTA: titulo con reveal + resplandor que crece con el scroll
      gsap.from('.cta-line > span', {
        yPercent: 110, duration: 1.1, stagger: 0.14, ease: 'power4.out',
        scrollTrigger: { trigger: '.cta-section', start: 'top 72%', once: true },
      })
      gsap.fromTo('.cta-glow',
        { scale: 0.6, opacity: 0.25 },
        {
          scale: 1.5, opacity: 0.9, ease: 'none',
          scrollTrigger: { trigger: '.cta-section', start: 'top bottom', end: 'bottom top', scrub: true },
        })
    }, rootRef)

    return () => {
      ctx.revert()
      gsap.ticker.remove(tick)
      lenis.destroy()
    }
  }, [])

  return (
    <div ref={rootRef} style={{ fontFamily: '"Hanken Grotesk", system-ui, sans-serif', background: '#0F0E0B' }}>
      {/* Animaciones CSS puras (marquee + indicador de scroll) */}
      <style>{`
        @keyframes marquee-slide {
          from { transform: translateX(0); }
          to   { transform: translateX(-33.333%); }
        }
        .marquee-track { animation: marquee-slide 24s linear infinite; }
        @keyframes scroll-hint {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(250%); }
        }
        .scroll-hint-dot { animation: scroll-hint 1.8s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .marquee-track, .scroll-hint-dot { animation: none; }
        }
      `}</style>

      <Navbar />
      <Hero />
      <Marquee />
      <StatsBar />
      <Servicios />
      <Equipo />
      <Galeria />
      <BigCTA />
      <Contacto />
      <Footer />
    </div>
  )
}
