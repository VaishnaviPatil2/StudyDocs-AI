import { createContext, useEffect, useState, type ReactNode } from 'react'
import { authApi } from '@/api/auth'
import type { User } from '@/types'

export interface AuthContextValue {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (token: string) => Promise<void>
  logout: () => void
}

// oxlint-disable-next-line react/only-export-components -- context + provider must coexist
export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('access_token'),
  )

  // Derive loading from token+user instead of calling setState inside effect
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (!token) {
      setInitialized(true)
      return
    }
    authApi
      .me()
      .then((me) => {
        setUser(me)
        setInitialized(true)
      })
      .catch(() => {
        localStorage.removeItem('access_token')
        setToken(null)
        setInitialized(true)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function login(newToken: string) {
    localStorage.setItem('access_token', newToken)
    setToken(newToken)
    const me = await authApi.me()
    setUser(me)
  }

  function logout() {
    localStorage.removeItem('access_token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading: !initialized, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}
