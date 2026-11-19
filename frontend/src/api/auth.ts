import client from './client'
import type { LoginRequest, RegisterRequest, TokenResponse, User } from '@/types'

export const authApi = {
  login: async (data: LoginRequest): Promise<TokenResponse> => {
    const res = await client.post<TokenResponse>('/auth/login', data)
    return res.data
  },

  register: async (data: RegisterRequest): Promise<User> => {
    const res = await client.post<User>('/users', data)
    return res.data
  },

  me: async (): Promise<User> => {
    const res = await client.get<User>('/users/me')
    return res.data
  },
}
