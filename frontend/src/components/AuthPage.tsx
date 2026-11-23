import { useState } from 'react'
import { authApi } from '@/api/auth'
import { useAuth } from '@/hooks/useAuth'

export function AuthPage() {
  const { login } = useAuth()
  const [view, setView] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [loading, setLoading] = useState(false)

  const inp: React.CSSProperties = {
    width: '100%', padding: '7px 10px',
    background: '#3c3c3c', border: '1px solid #555', borderRadius: 4,
    color: '#cccccc', fontSize: 13, outline: 'none',
  }
  const lbl: React.CSSProperties = {
    fontSize: 11, color: '#9d9d9d', display: 'block', marginBottom: 4,
    textTransform: 'uppercase', letterSpacing: 0.5,
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    setLoading(true)
    try {
      if (view === 'login') {
        const { access_token } = await authApi.login({ email, password })
        await login(access_token)
      } else {
        if (password.length < 8) {
          setMsg({ text: 'Password must be at least 8 characters', ok: false })
          setLoading(false)
          return
        }
        await authApi.register({ name, email, password })
        setView('login')
        setMsg({ text: 'Account created — sign in now', ok: true })
      }
    } catch (ex: unknown) {
      const detail = (ex as { response?: { data?: { detail?: string } } })
        .response?.data?.detail
      setMsg({ text: detail ?? 'Something went wrong', ok: false })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', background: '#1e1e1e',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ width: 360 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{ width: 40, height: 40, background: '#0e639c', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" fill="none" stroke="#fff" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l1.912 5.813a2 2 0 001.272 1.272L21 12l-5.816 1.912a2 2 0 00-1.272 1.272L12 21l-1.912-5.816a2 2 0 00-1.272-1.272L3 12l5.816-1.913a2 2 0 001.272-1.272L12 3z" />
            </svg>
          </div>
          <div>
            <div style={{ color: '#cccccc', fontSize: 16, fontWeight: 700 }}>StudyDocs AI</div>
            <div style={{ color: '#6a9955', fontSize: 11 }}>RAG-powered document Q&amp;A</div>
          </div>
        </div>

        <div style={{ background: '#252526', border: '1px solid #3c3c3c', borderRadius: 6, padding: 28 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #3c3c3c', marginBottom: 24 }}>
            {(['login', 'register'] as const).map(v => (
              <button key={v} onClick={() => { setView(v); setMsg(null) }} style={{
                flex: 1, padding: '8px', background: 'none', border: 'none',
                cursor: 'pointer', fontSize: 13, fontWeight: 600,
                color: view === v ? '#cccccc' : '#6a6a6a',
                borderBottom: view === v ? '2px solid #0e639c' : '2px solid transparent',
                marginBottom: -1,
              }}>
                {v === 'login' ? 'Sign in' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {view === 'register' && (
              <div>
                <label style={lbl}>Full name</label>
                <input style={inp} value={name} onChange={e => setName(e.target.value)}
                  placeholder="Vaishnavi Patil" required autoFocus />
              </div>
            )}
            <div>
              <label style={lbl}>Email</label>
              <input style={inp} type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required autoFocus={view === 'login'} />
            </div>
            <div>
              <label style={lbl}>Password</label>
              <input style={inp} type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required />
            </div>

            {msg && (
              <div style={{
                fontSize: 12, padding: '8px 12px', borderRadius: 4,
                background: msg.ok ? '#1a3a1a' : '#2d1a1a',
                color: msg.ok ? '#3fb950' : '#f85149',
                border: `1px solid ${msg.ok ? '#3fb95040' : '#f8514940'}`,
              }}>{msg.text}</div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '9px', background: loading ? '#1a4a6e' : '#0e639c',
              border: 'none', borderRadius: 4, color: '#fff',
              fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            }}>
              {loading ? 'Please wait…' : view === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>
        <div style={{ marginTop: 16, fontSize: 12, color: '#555', textAlign: 'center' }}>
          Industry-grade RAG · FastAPI · pgvector · Groq LLM
        </div>
      </div>
    </div>
  )
}
