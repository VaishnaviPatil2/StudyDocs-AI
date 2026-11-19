import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { authApi } from '@/api/auth'
import type { User } from '@/types'

interface AuthContextValue {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (token: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('access_token'),
  )
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (token) {
      authApi
        .me()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('access_token')
          setToken(null)
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [token])

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
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
