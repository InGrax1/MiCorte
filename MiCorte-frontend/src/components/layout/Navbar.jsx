import { Link, useLocation } from 'react-router-dom'

/**
 * Props:
 *   onLogout — si se pasa, reemplaza "Mi cuenta" con "Cerrar sesion"
 */
export default function Navbar({ onLogout = null }) {
  const { pathname } = useLocation()
  const isLanding = pathname === '/'

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(15,14,11,0.96)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(201,168,76,0.1)',
      }}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 no-underline">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #C9A84C 0%, #9A7C2E 100%)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
              <line x1="20" y1="4" x2="8.12" y2="15.88"/>
              <line x1="14.47" y1="14.48" x2="20" y2="20"/>
              <line x1="8.12" y1="8.12" x2="12" y2="12"/>
            </svg>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">MiCorte</span>
        </Link>

        {/* Nav central */}
        <nav className="hidden md:flex items-center gap-7">
          {[['Servicios', 'servicios'], ['Equipo', 'equipo'], ['Contacto', 'contacto']].map(([l, id]) => (
            <a
              key={l}
              href={isLanding ? `#${id}` : `/#${id}`}
              className="text-sm no-underline transition-colors"
              style={{ color: 'rgba(255,255,255,0.5)' }}
              onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.9)'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.5)'}
            >
              {l}
            </a>
          ))}
        </nav>

        {/* CTAs derecha */}
        <div className="flex items-center gap-3">
          <Link
            to="/tienda"
            className="hidden sm:inline-flex text-xs no-underline px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
          >
            Tienda
          </Link>

          {onLogout ? (
            <button
              onClick={onLogout}
              className="hidden sm:inline-flex text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
              style={{
                color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)',
                background: 'none', fontFamily: 'inherit',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#C9A84C'
                e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.4)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
              }}
            >
              Cerrar sesion
            </button>
          ) : (
            <Link
              to="/portal"
              className="hidden sm:inline-flex text-xs no-underline px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
            >
              Mi cuenta
            </Link>
          )}

          <Link
            to="/dashboard"
            className="hidden sm:inline-flex text-xs no-underline px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
          >
            Panel admin
          </Link>

          <Link
            to="/reservar"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg no-underline"
            style={{ background: 'linear-gradient(135deg, #C9A84C 0%, #B8973D 100%)', color: '#1A1713' }}
          >
            Reservar cita
          </Link>
        </div>
      </div>
    </header>
  )
}
