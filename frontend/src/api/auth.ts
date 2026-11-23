import client from './client'
import type { LoginRequest, RegisterRequest, TokenResponse, User } from '@/types'

export const authApi = {
  login: (d: LoginRequest) =>
    client.post<TokenResponse>('/auth/login', d).then(r => r.data),
  register: (d: RegisterRequest) =>
    client.post<User>('/users', d).then(r => r.data),
  me: () => client.get<User>('/users/me').then(r => r.data),
}
