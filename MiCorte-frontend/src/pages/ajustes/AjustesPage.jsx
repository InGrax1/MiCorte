import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import Spinner from '@/components/ui/Spinner'
import Modal from '@/components/ui/Modal'
import EmptyState from '@/components/ui/EmptyState'

const inputCls = 'w-full rounded-lg border border-warm-200 px-3 py-2 text-sm text-warm-900 outline-none focus:border-gold-500 transition-colors'

function FormField({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1" style={{ color: '#6B6158' }}>{label}</label>
      {children}
    </div>
  )
}

const EMPTY_FORM = { nombre: '', direccion: '', telefono: '' }

export default function AjustesPage() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [formError, setFormError] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const { data: sucursales = [], isLoading } = useQuery({
    queryKey: ['sucursales'],
    queryFn: async () => {
      const res = await api.get('/sucursales')
      const d = res.data.data
      return Array.isArray(d) ? d : (d?.sucursales ?? [])
    },
  })

  const crear = useMutation({
    mutationFn: (body) => api.post('/sucursales', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sucursales'] })
      setModalOpen(false)
      setForm(EMPTY_FORM)
      setFormError(null)
    },
    onError: (e) => setFormError(e.response?.data?.message || 'Error al crear sucursal'),
  })

  function handleCrear(e) {
    e.preventDefault()
    setFormError(null)
    const body = { nombre: form.nombre }
    if (form.direccion) body.direccion = form.direccion
    if (form.telefono) body.telefono = form.telefono
    crear.mutate(body)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Sucursales */}
      <div className="bg-white rounded-xl card-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #F5F3EE' }}>
          <div>
            <h3 className="text-sm font-semibold text-warm-900">Sucursales</h3>
            <p className="text-xs mt-0.5" style={{ color: '#B8B0A0' }}>Gestiona las ubicaciones del negocio</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="btn-gold px-3 py-1.5 text-xs rounded-lg cursor-pointer"
          >
            + Agregar
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : sucursales.length === 0 ? (
          <EmptyState message="No hay sucursales registradas" description="Agrega la primera sucursal" />
        ) : (
          <ul>
            {sucursales.map((s, i) => (
              <li
                key={s.id}
                className="flex items-center justify-between px-5 py-4"
                style={i < sucursales.length - 1 ? { borderBottom: '1px solid #FAFAF7' } : {}}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #C9A84C 0%, #9A7C2E 100%)' }}
                  >
                    {s.nombre?.charAt(0).toUpperCase() ?? 'S'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-warm-900">{s.nombre}</p>
                    {s.direccion && (
                      <p className="text-xs" style={{ color: '#B8B0A0' }}>{s.direccion}</p>
                    )}
                  </div>
                </div>
                {s.telefono && (
                  <span className="text-xs" style={{ color: '#8C8274' }}>{s.telefono}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Info */}
      <div className="rounded-xl p-5" style={{ border: '1px solid #EBE8E0' }}>
        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#8C8274' }}>
          Configuracion avanzada
        </p>
        <p className="text-sm" style={{ color: '#8C8274' }}>
          Para configurar integraciones de pago, SMS, puntos de fidelidad y otras opciones avanzadas,
          contacta al equipo de soporte de MiCorte.
        </p>
      </div>

      {/* Create Modal */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setFormError(null) }}
        title="Nueva sucursal"
        size="sm"
        footer={
          <>
            <button
              onClick={() => { setModalOpen(false); setFormError(null) }}
              className="px-4 py-2 text-sm rounded-lg border border-warm-200 cursor-pointer transition-colors hover:bg-warm-50"
              style={{ color: '#6B6158' }}
            >
              Cancelar
            </button>
            <button
              form="form-crear-sucursal"
              type="submit"
              disabled={crear.isPending}
              className="btn-gold px-4 py-2 text-sm rounded-lg cursor-pointer flex items-center gap-2"
            >
              {crear.isPending && <Spinner size="sm" />}
              Crear
            </button>
          </>
        }
      >
        <form id="form-crear-sucursal" onSubmit={handleCrear} className="space-y-4">
          {formError && (
            <div className="rounded-lg px-4 py-2.5 text-sm" style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
              {formError}
            </div>
          )}
          <FormField label="Nombre *">
            <input type="text" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} className={inputCls} required placeholder="Ej. Sucursal Centro" />
          </FormField>
          <FormField label="Direccion">
            <input type="text" value={form.direccion} onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))} className={inputCls} placeholder="Calle, numero, colonia" />
          </FormField>
          <FormField label="Telefono">
            <input type="tel" value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} className={inputCls} placeholder="+52 55 0000 0000" />
          </FormField>
        </form>
      </Modal>
    </div>
  )
}
