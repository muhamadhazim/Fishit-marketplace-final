import axios from 'axios'

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000',
  timeout: 120000, // 2 minutes timeout for slow email sending
})

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('jwt') : null
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
