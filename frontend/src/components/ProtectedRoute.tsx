import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: '#0f1117' }}>
        <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '3px solid #1e2433', borderTopColor: '#6366f1' }} />
      </div>
    )
  }

  return token ? <>{children}</> : <Navigate to="/login" replace />
}
