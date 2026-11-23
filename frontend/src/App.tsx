import { useEffect, useState } from 'react'
import { coursesApi } from '@/api/courses'
import { documentsApi } from '@/api/documents'
import { AuthProvider } from '@/context/AuthContext'
import { useAuth } from '@/hooks/useAuth'
import { AuthPage } from '@/components/AuthPage'
import { Sidebar } from '@/components/Sidebar'
import { DocumentPanel } from '@/components/DocumentPanel'
import { ChatPanel } from '@/components/ChatPanel'
import type { Course, Document } from '@/types'

function IDE() {
  const { user, token, isLoading, logout } = useAuth()

  const [courses, setCourses] = useState<Course[]>([])
  const [courseDocuments, setCourseDocuments] = useState<Record<number, Document[]>>({})
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)

  // Load courses on login
  useEffect(() => {
    if (!token) return
    coursesApi.list().then(cs => {
      setCourses(cs)
      // Auto-select first course
      if (cs.length > 0) {
        setSelectedCourse(cs[0])
        documentsApi.list(cs[0].id).then(docs => {
          setCourseDocuments({ [cs[0].id]: docs })
        })
      }
    })
  }, [token])

  // Poll processing documents every 3s (max 20 times)
  useEffect(() => {
    const busy = Object.entries(courseDocuments)
      .flatMap(([id, docs]) => docs
        .filter(d => d.status === 'pending' || d.status === 'processing')
        .map(d => ({ courseId: Number(id), docId: d.id }))
      )
    if (busy.length === 0) return
    let attempts = 0
    const t = setInterval(async () => {
      attempts++
      if (attempts > 20) { clearInterval(t); return }
      const courseIds = [...new Set(busy.map(b => b.courseId))]
      for (const id of courseIds) {
        const docs = await documentsApi.list(id)
        setCourseDocuments(prev => ({ ...prev, [id]: docs }))
        // Update selected doc if it's one of the busy ones
        setSelectedDoc(prev => {
          if (prev && prev.course_id === id) {
            return docs.find(d => d.id === prev.id) ?? prev
          }
          return prev
        })
      }
      const stillBusy = Object.values(courseDocuments)
        .flat()
        .some(d => d.status === 'pending' || d.status === 'processing')
      if (!stillBusy) clearInterval(t)
    }, 3000)
    return () => clearInterval(t)
  }, [courseDocuments])

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1e1e1e' }}>
        <div style={{ width: 24, height: 24, border: '2px solid #3c3c3c', borderTopColor: '#0e639c', borderRadius: '50%', animation: 'appSpin 0.8s linear infinite' }} />
        <style>{`@keyframes appSpin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  // ── Auth ─────────────────────────────────────────────────────────────────
  if (!token) return <AuthPage />

  const readyDocs = selectedCourse
    ? (courseDocuments[selectedCourse.id] ?? []).filter(d => d.status === 'ready')
    : []

  const totalDocs = Object.values(courseDocuments).flat().length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#1e1e1e' }}>
      {/* ── Title bar ──────────────────────────────────────────────────────── */}
      <div style={{ height: 36, background: '#323233', borderBottom: '1px solid #2d2d2d', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', flexShrink: 0 }}>
        {/* Left: brand + breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 20, height: 20, background: '#0e639c', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="12" height="12" fill="none" stroke="#fff" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M12 3l1.912 5.813a2 2 0 001.272 1.272L21 12l-5.816 1.912a2 2 0 00-1.272 1.272L12 21l-1.912-5.816a2 2 0 00-1.272-1.272L3 12l5.816-1.913a2 2 0 001.272-1.272L12 3z" />
            </svg>
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#cccccc' }}>StudyDocs AI</span>
          {selectedCourse && (
            <>
              <span style={{ color: '#3c3c3c', fontSize: 14 }}>›</span>
              <span style={{ fontSize: 12, color: '#9d9d9d' }}>{selectedCourse.name}</span>
            </>
          )}
          {selectedDoc && (
            <>
              <span style={{ color: '#3c3c3c', fontSize: 14 }}>›</span>
              <span style={{ fontSize: 12, color: '#4ec9b0' }}>{selectedDoc.title}</span>
            </>
          )}
        </div>

        {/* Right: user info + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: '#6a9955' }}>{user?.name}</span>
          <span style={{ fontSize: 11, background: '#0e639c', color: '#fff', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
            {user?.role}
          </span>
          <button
            onClick={logout}
            title="Sign out"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9d9d9d', display: 'flex', alignItems: 'center', padding: 2, borderRadius: 3 }}
          >
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── 3-panel body ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left sidebar */}
        <Sidebar
          courses={courses}
          setCourses={setCourses}
          courseDocuments={courseDocuments}
          setCourseDocuments={setCourseDocuments}
          selectedCourse={selectedCourse}
          setSelectedCourse={(c) => { setSelectedCourse(c); setSelectedDoc(null) }}
          selectedDoc={selectedDoc}
          setSelectedDoc={setSelectedDoc}
          isAdmin={user?.role === 'admin'}
        />

        {/* Centre: document view */}
        <DocumentPanel course={selectedCourse} doc={selectedDoc} />

        {/* Right: AI chat */}
        <ChatPanel
          course={selectedCourse}
          readyDocs={readyDocs}
          defaultDocId={selectedDoc?.status === 'ready' ? selectedDoc.id : null}
        />
      </div>

      {/* ── Status bar ─────────────────────────────────────────────────────── */}
      <div style={{ height: 22, background: '#007acc', display: 'flex', alignItems: 'center', padding: '0 12px', gap: 20, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#fff' }}>
          <svg width="10" height="10" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" d="M20 6L9 17l-5-5" />
          </svg>
          Connected
        </div>
        <span style={{ fontSize: 11, color: '#cce4ff' }}>
          {courses.length} course{courses.length !== 1 ? 's' : ''} · {totalDocs} doc{totalDocs !== 1 ? 's' : ''} · RAG · pgvector · Groq
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#cce4ff' }}>StudyDocs AI v1.0</span>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <IDE />
    </AuthProvider>
  )
}
