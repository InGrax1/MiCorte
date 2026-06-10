import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'

function TabButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors"
      style={
        active
          ? { background: 'linear-gradient(135deg, #C9A84C 0%, #B8973D 100%)', color: '#1A1713' }
          : { color: '#8C8274' }
      }
    >
      {label}
    </button>
  )
}

function fmtMoney(n) {
  return n != null
    ? `$${Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '—'
}

export default function TiendaPage() {
  const [tab, setTab] = useState('productos')

  const { data: productos = [], isLoading: loadingP } = useQuery({
    queryKey: ['productos'],
    queryFn: async () => {
      const res = await api.get('/productos')
      const d = res.data.data
      return Array.isArray(d) ? d : (d?.productos ?? [])
    },
    enabled: tab === 'productos',
  })

  const { data: ordenes = [], isLoading: loadingO } = useQuery({
    queryKey: ['ordenes'],
    queryFn: async () => {
      const res = await api.get('/ordenes')
      const d = res.data.data
      return Array.isArray(d) ? d : (d?.ordenes ?? [])
    },
    enabled: tab === 'ordenes',
  })

  const isLoading = tab === 'productos' ? loadingP : loadingO

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <TabButton label="Productos" active={tab === 'productos'} onClick={() => setTab('productos')} />
        <TabButton label="Ordenes" active={tab === 'ordenes'} onClick={() => setTab('ordenes')} />
      </div>

      <div className="bg-white rounded-xl card-md overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : tab === 'productos' ? (
          productos.length === 0 ? (
            <EmptyState message="No hay productos registrados" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid #F5F3EE' }}>
                    {['Producto', 'Marca', 'SKU', 'Estado', 'Precio'].map((h, i) => (
                      <th
                        key={h}
                        className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide ${i === 4 ? 'text-right' : 'text-left'}`}
                        style={{ color: '#8C8274' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {productos.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #FAFAF7' }} className="hover:bg-warm-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-warm-900">{p.nombre}</td>
                      <td className="px-4 py-3" style={{ color: '#8C8274' }}>{p.marca || '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: '#B8B0A0' }}>{p.sku || '—'}</td>
                      <td className="px-4 py-3"><Badge estado={p.activo ? 'activo' : 'inactivo'} /></td>
                      <td className="px-4 py-3 text-right font-medium text-warm-900">{fmtMoney(p.precio)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          ordenes.length === 0 ? (
            <EmptyState message="No hay ordenes registradas" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid #F5F3EE' }}>
                    {['ID', 'Cliente', 'Fecha', 'Estado', 'Total'].map((h, i) => (
                      <th
                        key={h}
                        className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide ${i === 4 ? 'text-right' : 'text-left'}`}
                        style={{ color: '#8C8274' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ordenes.map(o => (
                    <tr key={o.id} style={{ borderBottom: '1px solid #FAFAF7' }} className="hover:bg-warm-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: '#B8B0A0' }}>{o.id?.slice(0, 8)}</td>
                      <td className="px-4 py-3 font-medium text-warm-900">{o.cliente_nombre || '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap" style={{ color: '#8C8274' }}>
                        {new Date(o.created_at).toLocaleDateString('es-MX')}
                      </td>
                      <td className="px-4 py-3"><Badge estado={o.estado} /></td>
                      <td className="px-4 py-3 text-right font-medium text-warm-900">{fmtMoney(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  )
}
