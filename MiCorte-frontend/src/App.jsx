import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'

// Public pages
import LandingPage   from '@/pages/landing/LandingPage'
import LoginPage     from '@/pages/auth/LoginPage'
import QuioscoPage   from '@/pages/quiosco/QuioscoPage'
import ReservaPage   from '@/pages/reserva/ReservaPage'
import ResenaPage         from '@/pages/resena/ResenaPage'
import PortalPage         from '@/pages/portal/PortalPage'
import TiendaPublicaPage from '@/pages/tienda/TiendaPublicaPage'

// Protected pages
import DashboardPage  from '@/pages/dashboard/DashboardPage'
import CitasPage      from '@/pages/citas/CitasPage'
import ClientesPage   from '@/pages/clientes/ClientesPage'
import EstilistasPage  from '@/pages/estilistas/EstilistasPage'
import ServiciosPage   from '@/pages/servicios/ServiciosPage'
import TiendaPage      from '@/pages/tienda/TiendaPage'
import ReportesPage   from '@/pages/reportes/ReportesPage'
import AjustesPage    from '@/pages/ajustes/AjustesPage'

function RequireAuth({ children }) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    // Espera a que zustand-persist hidrate desde localStorage
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true))
    if (useAuthStore.persist.hasHydrated()) setHydrated(true)
    return unsub
  }, [])

  if (!hydrated) return null
  if (!accessToken) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      {/* Publicas */}
      <Route path="/"                    element={<LandingPage />} />
      <Route path="/login"               element={<LoginPage />} />
      <Route path="/quiosco/:sucursalId" element={<QuioscoPage />} />
      <Route path="/reservar"            element={<ReservaPage />} />
      <Route path="/reservar/:sucursalId" element={<ReservaPage />} />
      <Route path="/resena/:token"        element={<ResenaPage />} />
      <Route path="/portal"               element={<PortalPage />} />
      <Route path="/portal/:sucursalId"   element={<PortalPage />} />
      <Route path="/tienda"               element={<TiendaPublicaPage />} />
      <Route path="/tienda/:sucursalId"   element={<TiendaPublicaPage />} />

      {/* Protegidas — AppLayout como layout route sin path propio */}
      <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
        <Route path="/dashboard"  element={<DashboardPage />} />
        <Route path="/citas"      element={<CitasPage />} />
        <Route path="/clientes"   element={<ClientesPage />} />
        <Route path="/estilistas" element={<EstilistasPage />} />
        <Route path="/servicios"  element={<ServiciosPage />} />
        <Route path="/tienda"     element={<TiendaPage />} />
        <Route path="/reportes"   element={<ReportesPage />} />
        <Route path="/ajustes"    element={<AjustesPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
