import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const useCartStore = create(
  persist(
    (set, get) => ({
      items:       [],
      sucursal_id: null,

      setSucursal: (id) => {
        if (get().sucursal_id !== id) set({ sucursal_id: id, items: [] });
      },

      addItem: (producto) => set((state) => {
        const existing = state.items.find((i) => i.id === producto.id);
        if (existing) {
          return {
            items: state.items.map((i) =>
              i.id === producto.id
                ? { ...i, cantidad: Math.min(i.cantidad + 1, i.stock) }
                : i
            ),
          };
        }
        return { items: [...state.items, { ...producto, cantidad: 1 }] };
      }),

      removeItem: (id) => set((state) => ({
        items: state.items.filter((i) => i.id !== id),
      })),

      updateCantidad: (id, cantidad) => set((state) => ({
        items: cantidad <= 0
          ? state.items.filter((i) => i.id !== id)
          : state.items.map((i) => (i.id === id ? { ...i, cantidad } : i)),
      })),

      clearCart: () => set({ items: [] }),

      get total() { return get().items.reduce((s, i) => s + i.precio * i.cantidad, 0); },
      get count()  { return get().items.reduce((s, i) => s + i.cantidad, 0); },
    }),
    {
      name:    'micorte-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items, sucursal_id: state.sucursal_id }),
    }
  )
)
