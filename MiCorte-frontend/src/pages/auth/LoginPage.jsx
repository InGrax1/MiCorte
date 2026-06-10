import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Scissors, Eye, EyeOff } from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'

export default function LoginPage() {
  const navigate = useNavigate()
  const login    = useAuthStore((s) => s.login)

  const [form, setForm]     = useState({ email: '', password: '' })
  const [show, setShow]     = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', form)
      login(data.data)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.error || 'Email o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100svh', display: 'flex',
      fontFamily: '"Hanken Grotesk", system-ui, sans-serif',
    }}>
      {/* Panel izquierdo — decorativo */}
      <div style={{
        flex: '0 0 45%', backgroundColor: '#0F0E0B',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', padding: '48px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Círculo decorativo de fondo */}
        <div style={{
          position: 'absolute', bottom: '-80px', right: '-80px',
          width: '360px', height: '360px', borderRadius: '50%',
          border: '1px solid rgba(201,168,76,0.15)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-40px', right: '-40px',
          width: '240px', height: '240px', borderRadius: '50%',
          border: '1px solid rgba(201,168,76,0.1)',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #C9A84C 0%, #9A7C2E 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Scissors size={18} color="#0F0E0B" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: '20px', fontWeight: 800, color: '#FAFAF7', letterSpacing: '-0.4px' }}>
            MiCorte
          </span>
        </div>

        {/* Copy */}
        <div>
          <p style={{
            fontSize: '13px', fontWeight: 500,
            color: '#C9A84C', letterSpacing: '2px', textTransform: 'uppercase',
            marginBottom: '16px',
          }}>
            Plataforma de gestión
          </p>
          <h2 style={{
            fontSize: '34px', fontWeight: 800, color: '#FAFAF7',
            lineHeight: 1.2, letterSpacing: '-0.8px', margin: '0 0 16px',
          }}>
            Administra tu negocio<br />con precisión.
          </h2>
          <p style={{ fontSize: '15px', color: '#6B6158', lineHeight: 1.6, margin: 0 }}>
            Citas, clientes, inventario y reportes<br />en un solo lugar.
          </p>
        </div>

        {/* Stats decorativos */}
        <div style={{ display: 'flex', gap: '24px' }}>
          {[
            { value: '100%', label: 'Backend listo' },
            { value: 'Multi', label: 'Sucursales' },
            { value: 'Real', label: 'Tiempo real' },
          ].map(({ value, label }) => (
            <div key={label}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#C9A84C' }}>{value}</div>
              <div style={{ fontSize: '11px', color: '#4E4740', marginTop: '2px' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#FAFAF7', padding: '40px',
      }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>
          <h1 style={{
            fontSize: '26px', fontWeight: 800, color: '#1A1713',
            letterSpacing: '-0.5px', margin: '0 0 6px',
          }}>
            Iniciar sesión
          </h1>
          <p style={{ fontSize: '14px', color: '#6B6158', margin: '0 0 32px' }}>
            Ingresa tus credenciales para continuar
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#2E2A25', marginBottom: '6px' }}>
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="admin@tuempresa.com"
                required
                style={{
                  width: '100%', padding: '10px 14px', fontSize: '14px',
                  border: '1.5px solid #D6D0C4', borderRadius: '8px',
                  backgroundColor: '#FFFFFF', color: '#1A1713',
                  fontFamily: 'inherit', outline: 'none',
                  transition: 'border-color 150ms',
                  boxSizing: 'border-box',
                }}
                onFocus={e  => e.target.style.borderColor = '#C9A84C'}
                onBlur={e   => e.target.style.borderColor = '#D6D0C4'}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#2E2A25', marginBottom: '6px' }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={show ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%', padding: '10px 40px 10px 14px', fontSize: '14px',
                    border: '1.5px solid #D6D0C4', borderRadius: '8px',
                    backgroundColor: '#FFFFFF', color: '#1A1713',
                    fontFamily: 'inherit', outline: 'none',
                    transition: 'border-color 150ms',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = '#C9A84C'}
                  onBlur={e  => e.target.style.borderColor = '#D6D0C4'}
                />
                <button
                  type="button"
                  onClick={() => setShow(s => !s)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    border: 'none', background: 'none', cursor: 'pointer', color: '#8C8274',
                    display: 'flex', alignItems: 'center', padding: 0,
                  }}
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: '8px',
                backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
                fontSize: '13px', color: '#DC2626',
              }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-gold"
              style={{
                width: '100%', padding: '11px 20px', borderRadius: '8px',
                border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px', fontFamily: 'inherit',
                marginTop: '4px',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <p style={{
            marginTop: '24px', fontSize: '12px', color: '#8C8274', textAlign: 'center',
          }}>
            ¿Nuevo en MiCorte?{' '}
            <a href="/registro" style={{ color: '#C9A84C', fontWeight: 600, textDecoration: 'none' }}>
              Registra tu negocio
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
