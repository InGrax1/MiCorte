import { Bell } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { useLocation, Link } from 'react-router-dom'

const PAGE_TITLES = {
  '/dashboard':  'Dashboard',
  '/citas':      'Citas',
  '/clientes':   'Clientes',
  '/estilistas': 'Estilistas',
  '/servicios':  'Servicios',
  '/tienda':     'Tienda',
  '/reportes':   'Reportes',
  '/ajustes':    'Ajustes',
}

export default function Topbar() {
  const { pathname } = useLocation()
  const usuario = useAuthStore((s) => s.usuario)
  const title   = PAGE_TITLES[pathname] || 'MiCorte'

  return (
    <header style={{
      height: '60px', backgroundColor: '#FFFFFF',
      borderBottom: '1px solid #EBE8E0',
      display: 'flex', alignItems: 'center',
      padding: '0 24px', gap: '16px',
      flexShrink: 0,
    }}>
      <div style={{ flex: 1 }}>
        <h1 style={{
          margin: 0, fontSize: '18px', fontWeight: 700,
          color: '#1A1713', letterSpacing: '-0.3px',
        }}>
          {title}
        </h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Ver sitio publico */}
        <Link
          to="/"
          title="Ver sitio publico"
          style={{
            height: '34px', padding: '0 10px', borderRadius: '8px',
            border: '1px solid #EBE8E0', backgroundColor: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            cursor: 'pointer', color: '#6B6158', fontSize: '12px', fontWeight: 500,
            textDecoration: 'none', transition: 'border-color 150ms, color 150ms',
            flexShrink: 0,
          }}
          onMouseOver={e => { e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.color = '#C9A84C' }}
          onMouseOut={e  => { e.currentTarget.style.borderColor = '#EBE8E0'; e.currentTarget.style.color = '#6B6158' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span className="hidden sm:inline">Sitio publico</span>
        </Link>

        {/* Bell */}
        <button
          aria-label="Notificaciones"
          style={{
            width: '34px', height: '34px', borderRadius: '8px',
            border: '1px solid #EBE8E0', backgroundColor: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#6B6158', transition: 'border-color 150ms',
          }}
          onMouseOver={e => e.currentTarget.style.borderColor = '#C9A84C'}
          onMouseOut={e  => e.currentTarget.style.borderColor = '#EBE8E0'}
        >
          <Bell size={15} strokeWidth={2} />
        </button>

        {/* Tenant badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '4px 10px',
          backgroundColor: '#F5F3EE',
          borderRadius: '8px',
          border: '1px solid #EBE8E0',
        }}>
          <div style={{
            width: '6px', height: '6px', borderRadius: '50%',
            backgroundColor: '#16A34A',
          }} />
          <span style={{ fontSize: '12px', fontWeight: 500, color: '#4E4740' }}>
            {usuario?.nombre?.split(' ')[0] || 'Usuario'}
          </span>
        </div>
      </div>
    </header>
  )
}
