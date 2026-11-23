import { useRef, useState } from 'react'
import { coursesApi } from '@/api/courses'
import { documentsApi } from '@/api/documents'
import type { Course, Document } from '@/types'

interface Props {
  courses: Course[]
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>
  courseDocuments: Record<number, Document[]>
  setCourseDocuments: React.Dispatch<React.SetStateAction<Record<number, Document[]>>>
  selectedCourse: Course | null
  setSelectedCourse: (c: Course) => void
  selectedDoc: Document | null
  setSelectedDoc: (d: Document | null) => void
  isAdmin: boolean
}

function StatusDot({ status }: { status: Document['status'] }) {
  const color = { ready: '#3fb950', processing: '#58a6ff', pending: '#d29922', failed: '#f85149' }[status]
  const pulse = status === 'processing' || status === 'pending'
  return (
    <span title={status} style={{
      width: 7, height: 7, borderRadius: '50%', background: color,
      display: 'inline-block', flexShrink: 0,
      animation: pulse ? 'sdPulse 1.4s ease-in-out infinite' : 'none',
    }} />
  )
}

export function Sidebar({
  courses, setCourses, courseDocuments, setCourseDocuments,
  selectedCourse, setSelectedCourse, selectedDoc, setSelectedDoc, isAdmin,
}: Props) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [creating, setCreating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState<number | null>(null)

  async function toggleCourse(c: Course) {
    setSelectedCourse(c)
    setSelectedDoc(null)
    const next = new Set(expanded)
    if (next.has(c.id)) {
      next.delete(c.id)
    } else {
      next.add(c.id)
      if (!courseDocuments[c.id]) {
        const docs = await documentsApi.list(c.id)
        setCourseDocuments(prev => ({ ...prev, [c.id]: docs }))
      }
    }
    setExpanded(next)
  }

  async function createCourse(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    try {
      const c = await coursesApi.create({ name: newName, description: newDesc || undefined })
      setCourses(prev => [...prev, c])
      setCourseDocuments(prev => ({ ...prev, [c.id]: [] }))
      setExpanded(prev => new Set([...prev, c.id]))
      setSelectedCourse(c)
      setSelectedDoc(null)
      setShowNew(false)
      setNewName('')
      setNewDesc('')
    } finally { setCreating(false) }
  }

  async function handleFileUpload(courseId: number, file: File) {
    if (file.type !== 'application/pdf') return
    setUploading(courseId)
    try {
      const doc = await documentsApi.upload(courseId, file)
      setCourseDocuments(prev => ({ ...prev, [courseId]: [doc, ...(prev[courseId] ?? [])] }))
    } finally { setUploading(null) }
  }

  const iS = { fontSize: 13 } // item style base

  return (
    <div style={{ width: 260, background: '#252526', borderRight: '1px solid #2d2d2d', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ height: 35, padding: '0 8px 0 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, borderBottom: '1px solid #2d2d2d' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#bbbbbb', letterSpacing: 1, textTransform: 'uppercase' }}>Explorer</span>
        <div style={{ display: 'flex', gap: 2 }}>
          {isAdmin && (
            <button onClick={() => setShowNew(v => !v)} title="New Course" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9d9d9d', padding: 4, borderRadius: 3, display: 'flex' }}>
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" d="M12 5v14M5 12h14" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* New course form */}
      {showNew && (
        <form onSubmit={createCourse} style={{ padding: '8px 10px', borderBottom: '1px solid #2d2d2d', background: '#2d2d2d' }}>
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Course name *" required autoFocus
            style={{ width: '100%', padding: '5px 8px', background: '#3c3c3c', border: '1px solid #555', borderRadius: 3, color: '#ccc', fontSize: 12, outline: 'none', marginBottom: 6 }} />
          <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description (optional)"
            style={{ width: '100%', padding: '5px 8px', background: '#3c3c3c', border: '1px solid #555', borderRadius: 3, color: '#ccc', fontSize: 12, outline: 'none', marginBottom: 8 }} />
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="submit" disabled={creating} style={{ flex: 1, padding: '5px', background: '#0e639c', border: 'none', borderRadius: 3, color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
              {creating ? '…' : 'Create'}
            </button>
            <button type="button" onClick={() => setShowNew(false)} style={{ flex: 1, padding: '5px', background: '#3c3c3c', border: '1px solid #555', borderRadius: 3, color: '#ccc', fontSize: 12, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Tree */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {courses.length === 0 && (
          <div style={{ padding: '24px 16px', fontSize: 12, color: '#555', textAlign: 'center' }}>
            {isAdmin ? 'Click + to create a course' : 'No courses yet'}
          </div>
        )}
        {courses.map(course => {
          const isExp = expanded.has(course.id)
          const isActive = selectedCourse?.id === course.id && !selectedDoc
          const docs = courseDocuments[course.id] ?? []

          return (
            <div key={course.id}>
              {/* Course row */}
              <div
                onClick={() => toggleCourse(course)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '4px 8px 4px 4px', cursor: 'pointer',
                  background: isActive ? '#37373d' : 'transparent',
                  ...iS,
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = '#2a2d2e' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = isActive ? '#37373d' : 'transparent' }}
              >
                {/* Chevron */}
                <svg width="14" height="14" fill="none" stroke="#6a6a6a" strokeWidth="1.5" viewBox="0 0 24 24" style={{ flexShrink: 0, transform: isExp ? 'rotate(90deg)' : 'none', transition: 'transform 0.1s' }}>
                  <path strokeLinecap="round" d="M9 18l6-6-6-6" />
                </svg>
                {/* Folder icon */}
                <svg width="15" height="15" fill="none" stroke="#e8ab65" strokeWidth="1.6" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                  <path strokeLinecap="round" d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                </svg>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#cccccc' }}>
                  {course.name}
                </span>
                <span style={{ fontSize: 11, color: '#555', flexShrink: 0 }}>{docs.length}</span>
              </div>

              {/* Document rows */}
              {isExp && (
                <>
                  {docs.map(doc => {
                    const isDocActive = selectedDoc?.id === doc.id
                    return (
                      <div
                        key={doc.id}
                        onClick={() => { setSelectedDoc(doc); setSelectedCourse(course) }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          padding: '3px 8px 3px 28px', cursor: 'pointer',
                          background: isDocActive ? '#094771' : 'transparent',
                          ...iS,
                        }}
                        onMouseEnter={e => { if (!isDocActive) (e.currentTarget as HTMLDivElement).style.background = '#2a2d2e' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = isDocActive ? '#094771' : 'transparent' }}
                      >
                        <svg width="13" height="13" fill="none" stroke="#c586c0" strokeWidth="1.5" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                          <path strokeLinecap="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                          <path d="M14 2v6h6" />
                        </svg>
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, color: isDocActive ? '#fff' : '#cccccc' }}>
                          {doc.title}
                        </span>
                        <StatusDot status={doc.status} />
                      </div>
                    )
                  })}

                  {/* Upload row */}
                  <div>
                    <input
                      ref={fileInputRef} type="file" accept="application/pdf"
                      style={{ display: 'none' }}
                      onChange={e => {
                        const f = e.target.files?.[0]
                        if (f) handleFileUpload(course.id, f)
                        e.target.value = ''
                      }}
                    />
                    <div
                      onClick={() => { if (!uploading) { fileInputRef.current?.click() } }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '3px 8px 3px 28px', cursor: uploading ? 'not-allowed' : 'pointer',
                        color: '#555', fontSize: 12,
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.color = '#9d9d9d'}
                      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.color = '#555'}
                    >
                      {uploading === course.id ? (
                        <span>uploading…</span>
                      ) : (
                        <>
                          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                            <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                          </svg>
                          <span>Upload PDF</span>
                        </>
                      )}
                    </div>
                  </div>

                  {docs.length === 0 && !uploading && (
                    <div style={{ padding: '2px 8px 6px 28px', fontSize: 11, color: '#444' }}>
                      No documents
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes sdPulse { 0%,100%{opacity:1} 50%{opacity:.3} }
      `}</style>
    </div>
  )
}
