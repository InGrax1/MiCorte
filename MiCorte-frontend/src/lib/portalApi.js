import axios from 'axios'
import { usePortalStore } from '@/store/portal.store'

const portalApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

portalApi.interceptors.request.use((config) => {
  const token = usePortalStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

portalApi.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      usePortalStore.getState().logout()
    }
    return Promise.reject(error)
  }
)

export default portalApi
