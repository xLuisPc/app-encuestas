import api from './axios'

export interface LoginCredentials {
  username: string
  password: string
}

export interface RegisterData {
  username: string
  email: string
  password: string
  password2: string
  role: 'admin' | 'creator' | 'viewer'
  first_name?: string
  last_name?: string
}

export interface AuthResponse {
  access: string
  refresh: string
}

export interface User {
  id: number
  username: string
  email: string
  role: 'admin' | 'creator' | 'viewer'
  first_name?: string
  last_name?: string
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await api.post('/auth/login/', credentials)
      if (!response.data.access || !response.data.refresh) {
        throw new Error('Respuesta inválida del servidor')
      }
      return response.data
    } catch (error: any) {
      console.error('Error en authApi.login:', error)
      if (error.response) {
        // El servidor respondió con un error
        throw error
      } else if (error.request) {
        // La petición se hizo pero no hubo respuesta
        throw new Error('No se pudo conectar con el servidor')
      } else {
        // Algo más pasó
        throw error
      }
    }
  },

  register: async (data: RegisterData): Promise<{ user: User; message: string }> => {
    const response = await api.post('/auth/register/', data)
    return response.data
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get('/auth/profile/')
    return response.data
  },

  getViewers: async (): Promise<User[]> => {
    const response = await api.get('/auth/viewers/')
    console.log('Response completa:', response)
    console.log('Response data:', response.data)
    // Manejar respuesta paginada o directa
    if (response.data && Array.isArray(response.data)) {
      return response.data
    } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
      return response.data.results
    }
    return []
  },
}

