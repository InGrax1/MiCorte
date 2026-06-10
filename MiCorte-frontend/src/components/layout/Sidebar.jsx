import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, CalendarDays, Users, Scissors,
  Tag, ShoppingBag, BarChart3, Settings, LogOut, Tablet
} from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'

const NAV_ITEMS = [
  { to: '/dashboard',  label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/citas',      label: 'Citas',        icon: CalendarDays },
  { to: '/clientes',   label: 'Clientes',     icon: Users },
  { to: '/estilistas', label: 'Estilistas',   icon: Scissors },
  { to: '/servicios',  label: 'Servicios',    icon: Tag },
  { to: '/tienda',     label: 'Tienda',       icon: ShoppingBag },
  { to: '/reportes',   label: 'Reportes',     icon: BarChart3 },
  { to: '/ajustes',    label: 'Ajustes',      icon: Settings },
]

export default function Sidebar() {
  const navigate  = useNavigate()
  const { usuario, logout } = useAuthStore()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  const initials = usuario?.nombre
    ? usuario.nombre.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '??'

  return (
    <aside style={{
      width: '240px', minHeight: '100svh', flexShrink: 0,
      backgroundColor: '#0F0E0B', display: 'flex', flexDirection: 'column',
      borderRight: '1px solid rgba(255,255,255,0.06)',
    }}>

      {/* Logo */}
      <div style={{
        padding: '24px 20px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #C9A84C 0%, #B8973D 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Scissors size={16} color="#0F0E0B" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#FAFAF7', letterSpacing: '-0.3px' }}>
              MiCorte
            </div>
            <div style={{ fontSize: '11px', color: '#8C8274', marginTop: '1px' }}>
              {usuario?.empresa_id ? 'Panel de gestión' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => isActive ? 'nav-active nav-item' : 'nav-item'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '9px 12px', borderRadius: '7px', textDecoration: 'none',
              fontSize: '13.5px', fontWeight: 500,
              color: isActive ? '#FACC15' : 'rgba(255,255,255,0.6)',
              borderLeft: isActive ? '2px solid #C9A84C' : '2px solid transparent',
            })}
          >
            <Icon size={16} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer: usuario + logout */}
      <div style={{
        padding: '12px 10px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        {/* Perfil */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '8px 12px', borderRadius: '7px',
          marginBottom: '4px',
        }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #C9A84C, #9A7C2E)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', fontWeight: 700, color: '#0F0E0B', flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {usuario?.nombre || 'Usuario'}
            </div>
            <div style={{ fontSize: '10px', color: '#8C8274', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {usuario?.roles?.[0] || ''}
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="nav-item"
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
            padding: '8px 12px', borderRadius: '7px', border: 'none',
            backgroundColor: 'transparent', cursor: 'pointer',
            fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.4)',
            fontFamily: 'inherit',
          }}
        >
          <LogOut size={15} strokeWidth={2} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
