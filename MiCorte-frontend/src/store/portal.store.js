import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const usePortalStore = create(
  persist(
    (set) => ({
      accessToken: null,
      cliente:     null,

      login:  (data) => set({ accessToken: data.access_token, cliente: data.cliente }),
      logout: ()     => set({ accessToken: null, cliente: null }),
      setCliente: (cliente) => set({ cliente }),
    }),
    {
      name:    'micorte-portal',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ accessToken: state.accessToken, cliente: state.cliente }),
    }
  )
)
