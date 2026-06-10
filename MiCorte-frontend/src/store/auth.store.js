import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      accessToken:  null,
      refreshToken: null,
      usuario:      null,

      login: (data) => set({
        accessToken:  data.access_token,
        refreshToken: data.refresh_token,
        usuario:      data.usuario,
      }),

      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setUsuario: (usuario) => set({ usuario }),

      logout: () => set({
        accessToken:  null,
        refreshToken: null,
        usuario:      null,
      }),
    }),
    {
      name:    'micorte-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken:  state.accessToken,
        refreshToken: state.refreshToken,
        usuario:      state.usuario,
      }),
    }
  )
)
