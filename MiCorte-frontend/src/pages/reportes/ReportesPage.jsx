import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import Spinner from '@/components/ui/Spinner'

const hoy = new Date().toISOString().slice(0, 10)
const primerDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  .toISOString()
  .slice(0, 10)

function StatCard({ label, value, accentColor = '#C9A84C' }) {
  return (
    <div className="bg-white rounded-xl p-5 card-md border-l-4" style={{ borderLeftColor: accentColor }}>
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8C8274' }}>{label}</p>
      <p className="mt-2 text-2xl font-bold text-warm-900">{value ?? '—'}</p>
    </div>
  )
}

function fmtMoney(n) {
  return n != null
    ? `$${Number(n).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    : '—'
}

function DownloadButton({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-warm-200 cursor-pointer transition-colors hover:bg-warm-50"
      style={{ color: '#6B6158' }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      {label}
    </button>
  )
}

export default function ReportesPage() {
  const [fechaInicio, setFechaInicio] = useState(primerDiaMes)
  const [fechaFin, setFechaFin] = useState(hoy)

  const params = { fecha_inicio: fechaInicio, fecha_fin: fechaFin, formato: 'json' }

  const { data: rIngresos, isLoading: lI } = useQuery({
    queryKey: ['reporte-ingresos', fechaInicio, fechaFin],
    queryFn: async () => {
      const res = await api.get('/reportes/ingresos', { params })
      return res.data.data
    },
  })

  const { data: rCitas, isLoading: lC } = useQuery({
    queryKey: ['reporte-citas', fechaInicio, fechaFin],
    queryFn: async () => {
      const res = await api.get('/reportes/citas', { params })
      return res.data.data
    },
  })

  async function descargar(tipo) {
    try {
      const res = await api.get(`/reportes/${tipo}`, {
        params: { ...params, formato: 'xlsx' },
        responseType: 'blob',
      })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte_${tipo}_${fechaFin}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      /* silencioso */
    }
  }

  const inputDateCls = 'rounded-lg border border-warm-200 px-3 py-2 text-sm outline-none focus:border-gold-500 transition-colors'

  return (
    <div className="space-y-6">
      {/* Filtro de fechas */}
      <div className="bg-white rounded-xl p-4 card-sm flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: '#8C8274' }}>Desde</label>
          <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className={inputDateCls} />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: '#8C8274' }}>Hasta</label>
          <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} className={inputDateCls} />
        </div>
        <p className="text-xs self-end pb-2" style={{ color: '#B8B0A0' }}>
          Los datos se actualizan automaticamente al cambiar el rango.
        </p>
      </div>

      {(lI || lC) && (
        <div className="flex justify-center py-8"><Spinner size="lg" /></div>
      )}

      {!lI && !lC && (
        <>
          {/* Ingresos */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#6B6158' }}>Ingresos</h3>
              <DownloadButton label="XLSX" onClick={() => descargar('ingresos')} />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total ingresos" value={fmtMoney(rIngresos?.total_ingresos ?? rIngresos?.total)} accentColor="#C9A84C" />
              <StatCard label="Ingresos citas" value={fmtMoney(rIngresos?.ingresos_citas)} accentColor="#16A34A" />
              <StatCard label="Ingresos tienda" value={fmtMoney(rIngresos?.ingresos_tienda)} accentColor="#0EA5E9" />
              <StatCard label="Transacciones" value={rIngresos?.total_transacciones ?? rIngresos?.count ?? '—'} accentColor="#8B5CF6" />
            </div>
          </section>

          {/* Citas */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#6B6158' }}>Citas</h3>
              <DownloadButton label="XLSX" onClick={() => descargar('citas')} />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total citas" value={rCitas?.total_citas ?? rCitas?.total ?? '—'} accentColor="#C9A84C" />
              <StatCard label="Completadas" value={rCitas?.completadas ?? '—'} accentColor="#16A34A" />
              <StatCard label="Canceladas" value={rCitas?.canceladas ?? '—'} accentColor="#DC2626" />
              <StatCard label="No show" value={rCitas?.no_show ?? '—'} accentColor="#D97706" />
            </div>
          </section>

          {/* Inventario */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#6B6158' }}>Inventario</h3>
              <DownloadButton label="XLSX" onClick={() => descargar('inventario')} />
            </div>
            <p className="text-sm" style={{ color: '#8C8274' }}>
              Descarga el reporte completo de inventario en formato Excel.
            </p>
          </section>
        </>
      )}
    </div>
  )
}
