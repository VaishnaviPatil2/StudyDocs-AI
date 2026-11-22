import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '@/api/auth'
import { useAuth } from '@/context/AuthContext'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/types'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { access_token } = await authApi.login({ email, password })
      await login(access_token)
      navigate('/dashboard')
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>
      setError(axiosErr.response?.data?.detail || 'Invalid credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #0f1117 0%, #1a1f2e 100%)' }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #818cf8, #6366f1)' }}>
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <span className="font-bold text-white text-lg">StudyDocs AI</span>
        </div>
        <div>
          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
            Your documents,<br />
            <span style={{ color: '#a5b4fc' }}>intelligently answered.</span>
          </h2>
          <p style={{ color: '#c7d2fe' }} className="text-lg">
            Upload PDFs and get instant, accurate answers grounded in your own study material.
          </p>
          <div className="mt-10 space-y-4">
            {['Upload any PDF document', 'Ask questions in plain English', 'Get answers with page citations'].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(129,140,248,0.2)', border: '1px solid rgba(129,140,248,0.4)' }}>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="#818cf8">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span style={{ color: '#e0e7ff' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
        <p style={{ color: 'rgba(165,180,252,0.5)' }} className="text-sm">RAG-powered · pgvector · Groq LLM</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-10 justify-center">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #818cf8, #6366f1)' }}>
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="font-bold text-white">StudyDocs AI</span>
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
          <p className="mb-8" style={{ color: '#94a3b8' }}>Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
                className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all"
                style={{ background: '#1e2433', border: '1px solid #2d3748' }}
                onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)' }}
                onBlur={e => { e.target.style.borderColor = '#2d3748'; e.target.style.boxShadow = 'none' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all"
                style={{ background: '#1e2433', border: '1px solid #2d3748' }}
                onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)' }}
                onBlur={e => { e.target.style.borderColor = '#2d3748'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-semibold text-white transition-all mt-2 cursor-pointer"
              style={{ background: loading ? '#4338ca' : 'linear-gradient(135deg, #6366f1, #4f46e5)', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Signing in…
                </span>
              ) : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: '#64748b' }}>
            Don't have an account?{' '}
            <Link to="/register" className="font-medium transition-colors" style={{ color: '#818cf8' }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
