import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { useCartStore } from '@/store/cart.store'
import Navbar from '@/components/layout/Navbar'

const tApi = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' })

function fmtMoney(n) {
  return `$${Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ── Spinner ──────────────────────────────────────────────────────────────────
function Spin() {
  return (
    <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin"
      style={{ borderTopColor: '#C9A84C' }} />
  )
}

// ── Picker de sucursal ───────────────────────────────────────────────────────
function SucursalPicker({ onSelect }) {
  const { data, isLoading } = useQuery({
    queryKey: ['tienda-sucursales'],
    queryFn: async () => {
      const res = await tApi.get('/reserva/sucursales')
      return res.data.data ?? []
    },
  })

  if (isLoading) return (
    <div className="min-h-screen" style={{ background: '#FAFAF7' }}>
      <Navbar />
      <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 64px)', marginTop: '64px' }}>
        <Spin />
      </div>
    </div>
  )

  if (data?.length === 1) {
    onSelect(data[0].id)
    return null
  }

  return (
    <div style={{ background: '#FAFAF7' }}>
      <Navbar />
      <div className="flex flex-col items-center justify-center px-4"
        style={{ minHeight: '100vh', paddingTop: '64px' }}>
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'linear-gradient(135deg, #C9A84C 0%, #B8973D 100%)' }}>
              <svg className="w-7 h-7" fill="none" stroke="#1A1713" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: '#1A1713' }}>Tienda</h1>
            <p className="mt-1 text-sm" style={{ color: '#8C8274' }}>Selecciona una sucursal</p>
          </div>
          <div className="space-y-3">
            {data?.map((s) => (
              <button key={s.id} onClick={() => onSelect(s.id)}
                className="w-full text-left px-5 py-4 rounded-xl bg-white border cursor-pointer transition-all hover:shadow-md"
                style={{ borderColor: '#E8E2D8' }}>
                <div className="font-semibold" style={{ color: '#1A1713' }}>{s.nombre}</div>
                {s.direccion && <div className="text-xs mt-0.5" style={{ color: '#8C8274' }}>{s.direccion}</div>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Tarjeta de producto ──────────────────────────────────────────────────────
function ProductCard({ producto, cantidadEnCarrito, onAdd, onUpdate }) {
  const agotado = producto.stock === 0

  return (
    <div className="bg-white rounded-2xl overflow-hidden flex flex-col"
      style={{ border: '1px solid #E8E2D8' }}>
      {/* Imagen placeholder */}
      <div className="h-40 flex items-center justify-center text-3xl font-bold select-none"
        style={{ background: 'linear-gradient(135deg, #F5F3EE 0%, #EDE8DF 100%)', color: '#C9A84C' }}>
        {producto.nombre.charAt(0).toUpperCase()}
      </div>

      <div className="p-4 flex flex-col gap-2 flex-1">
        {/* Categoria chip */}
        <span className="text-xs font-medium px-2 py-0.5 rounded-full w-fit"
          style={{ background: '#F5F3EE', color: '#8C8274' }}>
          {producto.categoria_nombre}
        </span>

        <div className="flex-1">
          <h3 className="font-semibold leading-snug" style={{ color: '#1A1713' }}>{producto.nombre}</h3>
          {producto.marca && (
            <p className="text-xs mt-0.5" style={{ color: '#B8B0A0' }}>{producto.marca}</p>
          )}
          {producto.descripcion && (
            <p className="text-xs mt-1 line-clamp-2" style={{ color: '#8C8274' }}>
              {producto.descripcion}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="text-lg font-bold" style={{ color: '#1A1713' }}>
            {fmtMoney(producto.precio)}
          </span>
          {producto.stock <= 3 && !agotado && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: '#FEF3C7', color: '#92400E' }}>
              Quedan {producto.stock}
            </span>
          )}
        </div>

        {agotado ? (
          <div className="w-full py-2 rounded-xl text-center text-sm font-medium"
            style={{ background: '#F5F3EE', color: '#B8B0A0' }}>
            Sin stock
          </div>
        ) : cantidadEnCarrito > 0 ? (
          <div className="flex items-center justify-between rounded-xl overflow-hidden"
            style={{ border: '1.5px solid #C9A84C' }}>
            <button onClick={() => onUpdate(producto.id, cantidadEnCarrito - 1)}
              className="px-3 py-2 text-lg font-bold cursor-pointer transition-colors hover:bg-yellow-50"
              style={{ color: '#C9A84C' }}>−</button>
            <span className="font-semibold text-sm" style={{ color: '#1A1713' }}>
              {cantidadEnCarrito}
            </span>
            <button
              onClick={() => onUpdate(producto.id, Math.min(cantidadEnCarrito + 1, producto.stock))}
              disabled={cantidadEnCarrito >= producto.stock}
              className="px-3 py-2 text-lg font-bold cursor-pointer transition-colors hover:bg-yellow-50 disabled:opacity-40"
              style={{ color: '#C9A84C' }}>+</button>
          </div>
        ) : (
          <button onClick={() => onAdd(producto)}
            className="w-full py-2 rounded-xl text-sm font-semibold cursor-pointer transition-all hover:shadow-md active:scale-95"
            style={{ background: 'linear-gradient(135deg, #C9A84C 0%, #B8973D 100%)', color: '#1A1713' }}>
            Agregar
          </button>
        )}
      </div>
    </div>
  )
}

// ── Cart Drawer ──────────────────────────────────────────────────────────────
function CartDrawer({ open, onClose, onCheckout }) {
  const items       = useCartStore((s) => s.items)
  const removeItem  = useCartStore((s) => s.removeItem)
  const updateCant  = useCartStore((s) => s.updateCantidad)

  const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0)

  return (
    <>
      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 transition-opacity"
          onClick={onClose} />
      )}

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-sm z-50 flex flex-col shadow-2xl transition-transform duration-300"
        style={{
          background: '#FFFFFF',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
        }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid #F5F3EE' }}>
          <h2 className="font-bold text-lg" style={{ color: '#1A1713' }}>
            Tu carrito {items.length > 0 && <span style={{ color: '#C9A84C' }}>({items.reduce((s, i) => s + i.cantidad, 0)})</span>}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3"
              style={{ color: '#B8B0A0' }}>
              <svg className="w-14 h-14 opacity-40" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <p className="text-sm">Tu carrito esta vacio</p>
            </div>
          ) : items.map((item) => (
            <div key={item.id} className="flex gap-3">
              {/* Miniatura */}
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold flex-shrink-0"
                style={{ background: '#F5F3EE', color: '#C9A84C' }}>
                {item.nombre.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate" style={{ color: '#1A1713' }}>{item.nombre}</div>
                <div className="text-xs mt-0.5" style={{ color: '#8C8274' }}>{fmtMoney(item.precio)} c/u</div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center rounded-lg overflow-hidden"
                    style={{ border: '1px solid #E8E2D8' }}>
                    <button onClick={() => updateCant(item.id, item.cantidad - 1)}
                      className="px-2 py-1 text-sm cursor-pointer hover:bg-gray-50 transition-colors"
                      style={{ color: '#C9A84C' }}>−</button>
                    <span className="px-2 text-sm font-semibold" style={{ color: '#1A1713' }}>
                      {item.cantidad}
                    </span>
                    <button
                      onClick={() => updateCant(item.id, Math.min(item.cantidad + 1, item.stock))}
                      disabled={item.cantidad >= item.stock}
                      className="px-2 py-1 text-sm cursor-pointer hover:bg-gray-50 transition-colors disabled:opacity-40"
                      style={{ color: '#C9A84C' }}>+</button>
                  </div>
                  <span className="text-sm font-semibold ml-auto" style={{ color: '#1A1713' }}>
                    {fmtMoney(item.precio * item.cantidad)}
                  </span>
                </div>
              </div>
              <button onClick={() => removeItem(item.id)}
                className="p-1 cursor-pointer opacity-40 hover:opacity-100 transition-opacity self-start mt-0.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-5 py-4 space-y-3" style={{ borderTop: '1px solid #F5F3EE' }}>
            <div className="flex justify-between text-base font-bold" style={{ color: '#1A1713' }}>
              <span>Total</span>
              <span style={{ color: '#C9A84C' }}>{fmtMoney(total)}</span>
            </div>
            <button onClick={onCheckout}
              className="w-full py-3 rounded-xl font-semibold text-sm cursor-pointer transition-all hover:shadow-md active:scale-95"
              style={{ background: 'linear-gradient(135deg, #C9A84C 0%, #B8973D 100%)', color: '#1A1713' }}>
              Proceder al pago
            </button>
          </div>
        )}
      </div>
    </>
  )
}

// ── Checkout Modal ───────────────────────────────────────────────────────────
function CheckoutModal({ open, onClose, sucursalId, onSuccess }) {
  const items     = useCartStore((s) => s.items)
  const clearCart = useCartStore((s) => s.clearCart)
  const total     = items.reduce((s, i) => s + i.precio * i.cantidad, 0)

  const [form, setForm] = useState({
    nombre: '', email: '', telefono: '',
    tipo_entrega: 'recoger_tienda', direccion_envio: '', notas: '',
  })
  const [fieldErr, setFieldErr] = useState({})

  const mutation = useMutation({
    mutationFn: async (data) => {
      const res = await tApi.post(`/tienda/${sucursalId}/orden`, data)
      return res.data.data
    },
    onSuccess: (data) => {
      clearCart()
      onSuccess(data)
    },
  })

  function validate() {
    const errs = {}
    if (!form.nombre.trim())  errs.nombre = 'Requerido'
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Email invalido'
    if (form.tipo_entrega === 'envio' && !form.direccion_envio.trim())
      errs.direccion_envio = 'Requerida para envio a domicilio'
    return errs
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setFieldErr(errs); return }
    setFieldErr({})
    mutation.mutate({
      ...form,
      items: items.map((i) => ({ producto_id: i.id, cantidad: i.cantidad })),
    })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full sm:max-w-lg bg-white sm:rounded-2xl overflow-y-auto max-h-screen sm:max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid #F5F3EE' }}>
          <h2 className="font-bold text-lg" style={{ color: '#1A1713' }}>Finalizar pedido</h2>
          <button onClick={onClose} className="p-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-5">
          {/* Datos del cliente */}
          <div>
            <h3 className="text-sm font-semibold mb-3" style={{ color: '#8C8274' }}>
              TUS DATOS
            </h3>
            <div className="space-y-3">
              <div>
                <input placeholder="Nombre completo *" value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{
                    border: `1.5px solid ${fieldErr.nombre ? '#EF4444' : '#E8E2D8'}`,
                    background: '#FAFAF7', color: '#1A1713',
                  }} />
                {fieldErr.nombre && <p className="text-xs mt-1 text-red-500">{fieldErr.nombre}</p>}
              </div>
              <div>
                <input placeholder="Email *" type="email" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{
                    border: `1.5px solid ${fieldErr.email ? '#EF4444' : '#E8E2D8'}`,
                    background: '#FAFAF7', color: '#1A1713',
                  }} />
                {fieldErr.email && <p className="text-xs mt-1 text-red-500">{fieldErr.email}</p>}
              </div>
              <input placeholder="Telefono (opcional)" value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ border: '1.5px solid #E8E2D8', background: '#FAFAF7', color: '#1A1713' }} />
            </div>
          </div>

          {/* Tipo de entrega */}
          <div>
            <h3 className="text-sm font-semibold mb-3" style={{ color: '#8C8274' }}>
              TIPO DE ENTREGA
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'recoger_tienda', label: 'Recoger en tienda' },
                { value: 'envio',          label: 'Envio a domicilio' },
              ].map((opt) => (
                <button key={opt.value} type="button"
                  onClick={() => setForm({ ...form, tipo_entrega: opt.value })}
                  className="px-4 py-3 rounded-xl text-sm font-medium cursor-pointer transition-all"
                  style={{
                    border: `1.5px solid ${form.tipo_entrega === opt.value ? '#C9A84C' : '#E8E2D8'}`,
                    background: form.tipo_entrega === opt.value ? '#FEF9EC' : '#FAFAF7',
                    color: form.tipo_entrega === opt.value ? '#92400E' : '#8C8274',
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>
            {form.tipo_entrega === 'envio' && (
              <div className="mt-3">
                <input placeholder="Direccion de entrega *" value={form.direccion_envio}
                  onChange={(e) => setForm({ ...form, direccion_envio: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{
                    border: `1.5px solid ${fieldErr.direccion_envio ? '#EF4444' : '#E8E2D8'}`,
                    background: '#FAFAF7', color: '#1A1713',
                  }} />
                {fieldErr.direccion_envio && (
                  <p className="text-xs mt-1 text-red-500">{fieldErr.direccion_envio}</p>
                )}
              </div>
            )}
          </div>

          {/* Notas */}
          <textarea placeholder="Notas o instrucciones (opcional)" value={form.notas}
            onChange={(e) => setForm({ ...form, notas: e.target.value })}
            rows={2}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
            style={{ border: '1.5px solid #E8E2D8', background: '#FAFAF7', color: '#1A1713' }} />

          {/* Resumen */}
          <div className="rounded-xl p-4 space-y-2" style={{ background: '#F5F3EE' }}>
            <h3 className="text-xs font-semibold mb-2" style={{ color: '#8C8274' }}>RESUMEN</h3>
            {items.map((i) => (
              <div key={i.id} className="flex justify-between text-sm">
                <span style={{ color: '#5C5248' }}>{i.nombre} x{i.cantidad}</span>
                <span className="font-medium" style={{ color: '#1A1713' }}>
                  {fmtMoney(i.precio * i.cantidad)}
                </span>
              </div>
            ))}
            <div className="pt-2 flex justify-between font-bold" style={{ borderTop: '1px solid #E8E2D8' }}>
              <span style={{ color: '#1A1713' }}>Total</span>
              <span style={{ color: '#C9A84C' }}>{fmtMoney(total)}</span>
            </div>
          </div>

          {mutation.isError && (
            <p className="text-sm text-red-500 text-center">
              {mutation.error?.response?.data?.error || 'Error al procesar el pedido'}
            </p>
          )}

          <button type="submit" disabled={mutation.isPending}
            className="w-full py-3 rounded-xl font-semibold text-sm cursor-pointer transition-all hover:shadow-md active:scale-95 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #C9A84C 0%, #B8973D 100%)', color: '#1A1713' }}>
            {mutation.isPending ? 'Procesando...' : 'Confirmar pedido'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Confirmacion ─────────────────────────────────────────────────────────────
function ConfirmacionView({ orden, onBack }) {
  return (
    <div className="min-h-screen" style={{ background: '#FAFAF7' }}>
      <Navbar />
      <div className="flex items-center justify-center px-4"
        style={{ minHeight: 'calc(100vh - 64px)', marginTop: '64px' }}>
      <div className="w-full max-w-sm bg-white rounded-2xl p-8 text-center shadow-sm"
        style={{ border: '1px solid #E8E2D8' }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: '#F0FDF4' }}>
          <svg className="w-8 h-8" fill="none" stroke="#16A34A" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-1" style={{ color: '#1A1713' }}>Pedido confirmado</h2>
        <p className="text-sm mb-4" style={{ color: '#8C8274' }}>
          Gracias, {orden.cliente_nombre}
        </p>
        <div className="rounded-xl p-4 mb-5 space-y-2 text-left"
          style={{ background: '#F5F3EE' }}>
          <div className="flex justify-between text-sm">
            <span style={{ color: '#8C8274' }}>Pedido</span>
            <span className="font-mono font-semibold text-xs" style={{ color: '#1A1713' }}>
              #{orden.orden_id.slice(0, 8).toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: '#8C8274' }}>Total</span>
            <span className="font-bold" style={{ color: '#C9A84C' }}>{fmtMoney(orden.total)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: '#8C8274' }}>Entrega</span>
            <span style={{ color: '#1A1713' }}>
              {orden.tipo_entrega === 'recoger_tienda' ? 'Recoger en tienda' : 'Envio a domicilio'}
            </span>
          </div>
        </div>
        <p className="text-xs mb-6" style={{ color: '#8C8274' }}>
          Te contactaremos para confirmar los detalles de tu pedido.
        </p>
        <button onClick={onBack}
          className="w-full py-2.5 rounded-xl font-semibold text-sm cursor-pointer transition-all"
          style={{ background: '#F5F3EE', color: '#5C5248' }}>
          Volver a la tienda
        </button>
      </div>
      </div>
    </div>
  )
}

// ── Pagina principal del catalogo ────────────────────────────────────────────
function CatalogPage({ sucursalId }) {
  const [categoriaFiltro, setCategoriaFiltro] = useState(null)
  const [busqueda, setBusqueda]               = useState('')
  const [cartOpen, setCartOpen]               = useState(false)
  const [checkoutOpen, setCheckoutOpen]       = useState(false)
  const [confirmacion, setConfirmacion]       = useState(null)

  const items      = useCartStore((s) => s.items)
  const addItem    = useCartStore((s) => s.addItem)
  const updateCant = useCartStore((s) => s.updateCantidad)
  const setSuc     = useCartStore((s) => s.setSucursal)
  const cartCount  = items.reduce((s, i) => s + i.cantidad, 0)

  useEffect(() => { setSuc(sucursalId) }, [sucursalId])

  const { data: categorias = [] } = useQuery({
    queryKey: ['tienda-categorias', sucursalId],
    queryFn: async () => {
      const res = await tApi.get(`/tienda/${sucursalId}/categorias`)
      return res.data.data ?? []
    },
  })

  const { data: catalogoData, isLoading } = useQuery({
    queryKey: ['tienda-catalogo', sucursalId, categoriaFiltro, busqueda],
    queryFn: async () => {
      const params = {}
      if (categoriaFiltro) params.categoria_id = categoriaFiltro
      if (busqueda)        params.q = busqueda
      const res = await tApi.get(`/tienda/${sucursalId}/catalogo`, { params })
      return res.data.data ?? { sucursal: null, productos: [] }
    },
  })

  const sucursal = catalogoData?.sucursal
  const productos = catalogoData?.productos ?? []

  if (confirmacion) {
    return <ConfirmacionView orden={confirmacion} onBack={() => setConfirmacion(null)} />
  }

  return (
    <div className="min-h-screen" style={{ background: '#FAFAF7' }}>
      <Navbar />
      <div style={{ height: '64px' }} />

      {/* Sub-barra sticky: sucursal + busqueda + carrito */}
      <div className="sticky z-30 bg-white/95 backdrop-blur-sm"
        style={{ top: '64px', borderBottom: '1px solid #E8E2D8' }}>
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center gap-3">
          {/* Nombre de sucursal */}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm leading-none truncate" style={{ color: '#1A1713' }}>
              {sucursal?.nombre ?? 'Tienda'}
            </p>
            {sucursal?.direccion && (
              <p className="text-xs mt-0.5 truncate hidden sm:block" style={{ color: '#8C8274' }}>
                {sucursal.direccion}
              </p>
            )}
          </div>

          {/* Buscador — desktop */}
          <div className="relative hidden sm:block w-44">
            <svg className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: '#B8B0A0' }}
              fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
            </svg>
            <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs outline-none"
              style={{ background: '#F5F3EE', color: '#1A1713', border: '1.5px solid transparent' }}
              onFocus={(e) => (e.target.style.border = '1.5px solid #C9A84C')}
              onBlur={(e) => (e.target.style.border = '1.5px solid transparent')} />
          </div>

          {/* Carrito */}
          <button onClick={() => setCartOpen(true)}
            className="relative p-2 rounded-xl cursor-pointer transition-colors hover:bg-gray-100 flex-shrink-0"
            style={{ color: '#1A1713' }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-xs font-bold flex items-center justify-center"
                style={{ background: '#C9A84C', color: '#1A1713', fontSize: '10px' }}>
                {cartCount}
              </span>
            )}
          </button>
        </div>

        {/* Buscador mobile */}
        <div className="sm:hidden px-4 pb-2.5">
          <div className="relative">
            <svg className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: '#B8B0A0' }}
              fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
            </svg>
            <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar producto..."
              className="w-full pl-8 pr-4 py-2 rounded-xl text-sm outline-none"
              style={{ background: '#F5F3EE', color: '#1A1713' }} />
          </div>
        </div>
      </div>

      {/* Filtros de categoria */}
      {categorias.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setCategoriaFiltro(null)}
              className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap cursor-pointer transition-all flex-shrink-0"
              style={!categoriaFiltro
                ? { background: 'linear-gradient(135deg, #C9A84C 0%, #B8973D 100%)', color: '#1A1713' }
                : { background: '#F5F3EE', color: '#8C8274' }}>
              Todos
            </button>
            {categorias.map((cat) => (
              <button key={cat.id}
                onClick={() => setCategoriaFiltro(cat.id === categoriaFiltro ? null : cat.id)}
                className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap cursor-pointer transition-all flex-shrink-0"
                style={categoriaFiltro === cat.id
                  ? { background: 'linear-gradient(135deg, #C9A84C 0%, #B8973D 100%)', color: '#1A1713' }
                  : { background: '#F5F3EE', color: '#8C8274' }}>
                {cat.nombre}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grid de productos */}
      <main className="max-w-6xl mx-auto px-4 pb-16">
        {isLoading ? (
          <div className="flex justify-center py-20"><Spin /></div>
        ) : productos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3"
            style={{ color: '#B8B0A0' }}>
            <svg className="w-14 h-14 opacity-40" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-sm">No hay productos disponibles</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {productos.map((p) => {
              const enCarrito = items.find((i) => i.id === p.id)
              return (
                <ProductCard
                  key={p.id}
                  producto={p}
                  cantidadEnCarrito={enCarrito?.cantidad ?? 0}
                  onAdd={addItem}
                  onUpdate={updateCant}
                />
              )
            })}
          </div>
        )}
      </main>

      {/* Boton flotante de carrito (mobile) */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center z-20 px-4 sm:hidden">
          <button onClick={() => setCartOpen(true)}
            className="flex items-center gap-3 px-6 py-3 rounded-2xl shadow-lg cursor-pointer transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #C9A84C 0%, #B8973D 100%)', color: '#1A1713' }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="font-semibold text-sm">{cartCount} producto{cartCount !== 1 ? 's' : ''}</span>
            <span className="font-bold text-sm">
              {fmtMoney(items.reduce((s, i) => s + i.precio * i.cantidad, 0))}
            </span>
          </button>
        </div>
      )}

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={() => { setCartOpen(false); setCheckoutOpen(true) }}
      />

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        sucursalId={sucursalId}
        onSuccess={(orden) => { setCheckoutOpen(false); setConfirmacion(orden) }}
      />
    </div>
  )
}

// ── Export ───────────────────────────────────────────────────────────────────
export default function TiendaPublicaPage() {
  const { sucursalId } = useParams()
  const [selected, setSelected] = useState(sucursalId || null)

  if (!selected) return <SucursalPicker onSelect={setSelected} />
  return <CatalogPage sucursalId={selected} />
}
