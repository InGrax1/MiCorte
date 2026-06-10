import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import Spinner from '@/components/ui/Spinner'

function StatCard({ label, value, sub, accentColor = '#C9A84C' }) {
  return (
    <div className="bg-white rounded-xl p-5 card-md border-l-4" style={{ borderLeftColor: accentColor }}>
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8C8274' }}>{label}</p>
      <p className="mt-2 text-3xl font-bold text-warm-900">{value ?? '—'}</p>
      {sub && <p className="mt-1 text-xs" style={{ color: '#B8B0A0' }}>{sub}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const usuario = useAuthStore(s => s.usuario)

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', usuario?.sucursal_id],
    queryFn: async () => {
      const params = usuario?.sucursal_id ? { sucursal_id: usuario.sucursal_id } : {}
      const res = await api.get('/dashboard', { params })
      return res.data.data
    },
    enabled: !!usuario,
    refetchInterval: 60_000,
  })

  const fmt$ = (n) =>
    n != null
      ? `$${Number(n).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
      : '—'

  const today = new Date().toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-48">
        <Spinner size="lg" />
      </div>
    )

  if (error)
    return (
      <div className="rounded-lg p-4 text-sm" style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
        Error al cargar el dashboard: {error.response?.data?.message || error.message}
      </div>
    )

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium capitalize" style={{ color: '#8C8274' }}>{today}</p>
        <h2 className="mt-0.5 text-lg font-semibold text-warm-900">Resumen del dia</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Citas hoy"
          value={data?.citas_hoy ?? 0}
          sub={`${data?.citas_completadas_hoy ?? 0} completadas · ${data?.citas_pendientes_hoy ?? 0} pendientes`}
          accentColor="#C9A84C"
        />
        <StatCard
          label="Ingresos citas"
          value={fmt$(data?.ingresos_citas_hoy)}
          sub="del dia de hoy"
          accentColor="#16A34A"
        />
        <StatCard
          label="Ingresos tienda"
          value={fmt$(data?.ingresos_tienda_hoy)}
          sub={`${data?.productos_vendidos_hoy ?? 0} productos vendidos`}
          accentColor="#0EA5E9"
        />
        <StatCard
          label="Nuevos clientes"
          value={data?.nuevos_clientes_mes ?? 0}
          sub="este mes"
          accentColor="#8B5CF6"
        />
      </div>

      {data?.estilista_top_hoy ? (
        <div className="bg-white rounded-xl p-5 card-md flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #C9A84C 0%, #9A7C2E 100%)' }}
          >
            {data.estilista_top_hoy.nombre?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#8C8274' }}>
              Estilista destacado hoy
            </p>
            <p className="font-semibold text-warm-900 text-sm mt-0.5">{data.estilista_top_hoy.nombre}</p>
            <p className="text-xs" style={{ color: '#B8B0A0' }}>
              {data.estilista_top_hoy.citas_completadas} citas completadas
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-5 card-md text-sm" style={{ color: '#B8B0A0' }}>
          Aun no hay citas completadas hoy.
        </div>
      )}
    </div>
  )
}
