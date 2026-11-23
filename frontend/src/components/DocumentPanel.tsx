import type { Course, Document } from '@/types'

interface Props {
  course: Course | null
  doc: Document | null
}

function fmt(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const statusColor: Record<Document['status'], string> = {
  ready: '#3fb950',
  processing: '#58a6ff',
  pending: '#d29922',
  failed: '#f85149',
}

export function DocumentPanel({ course, doc }: Props) {
  // ── No selection ──────────────────────────────────────────────────────────
  if (!course) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1e1e1e', flexDirection: 'column', gap: 12, color: '#3c3c3c' }}>
        <svg width="56" height="56" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
          <path strokeLinecap="round" d="M4 19.5A2.5 2.5 0 016.5 17H20" />
          <path strokeLinecap="round" d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
        </svg>
        <div style={{ fontSize: 20, color: '#4a4a4a', fontWeight: 300 }}>StudyDocs AI</div>
        <div style={{ fontSize: 13, color: '#3c3c3c', maxWidth: 320, textAlign: 'center', lineHeight: 1.7 }}>
          Select a course from the Explorer to browse documents and ask AI questions
        </div>
      </div>
    )
  }

  // ── Document detail ───────────────────────────────────────────────────────
  if (doc) {
    return (
      <div style={{ flex: 1, background: '#1e1e1e', overflow: 'auto', padding: 32 }}>
        {/* Document header */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid #2d2d2d' }}>
          <div style={{ width: 52, height: 52, background: '#252526', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #3c3c3c' }}>
            <svg width="26" height="26" fill="none" stroke="#c586c0" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <path d="M14 2v6h6" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 18, color: '#cccccc', fontWeight: 600, marginBottom: 8, wordBreak: 'break-word' }}>
              {doc.title}
            </h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 20px', fontSize: 12, color: '#6a6a6a' }}>
              <span>{fmt(doc.file_size_bytes)}</span>
              {doc.page_count && <span>{doc.page_count} pages</span>}
              <span>Course: <span style={{ color: '#9d9d9d' }}>{course.name}</span></span>
              <span>Uploaded {new Date(doc.created_at).toLocaleDateString()}</span>
              <span style={{ color: statusColor[doc.status], fontWeight: 600 }}>● {doc.status}</span>
            </div>
          </div>
        </div>

        {/* Status card */}
        {doc.status === 'ready' && (
          <div style={{ background: '#0d1117', border: '1px solid #3c3c3c', borderRadius: 6, padding: 20, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3fb950' }} />
              <span style={{ fontSize: 13, color: '#3fb950', fontWeight: 600 }}>Indexed — ready for AI queries</span>
            </div>
            <p style={{ fontSize: 13, color: '#8b949e', lineHeight: 1.7 }}>
              This document has been fully processed and embedded into the vector database using BGE embeddings.
              Switch to the AI Chat panel on the right to ask questions about this document.
            </p>
          </div>
        )}

        {(doc.status === 'processing' || doc.status === 'pending') && (
          <div style={{ background: '#0d1117', border: '1px solid #58a6ff40', borderRadius: 6, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#58a6ff' }}>
              <div style={{ width: 16, height: 16, border: '2px solid #58a6ff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'dpSpin 0.8s linear infinite' }} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Processing — extracting text and generating embeddings…</span>
            </div>
            <p style={{ fontSize: 12, color: '#6a6a6a', marginTop: 10 }}>
              This typically takes 30–60 seconds. The status will update automatically.
            </p>
          </div>
        )}

        {doc.status === 'failed' && (
          <div style={{ background: '#160a0a', border: '1px solid #f8514940', borderRadius: 6, padding: 16 }}>
            <div style={{ color: '#f85149', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Processing failed</div>
            <div style={{ color: '#9d9d9d', fontSize: 12 }}>{doc.error_message ?? 'Unknown error — try uploading the document again.'}</div>
          </div>
        )}

        {/* Metadata table */}
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, marginBottom: 10 }}>Details</div>
          <div style={{ background: '#252526', border: '1px solid #3c3c3c', borderRadius: 4, overflow: 'hidden' }}>
            {[
              ['File name', doc.title],
              ['Size', fmt(doc.file_size_bytes)],
              ['Pages', doc.page_count ? String(doc.page_count) : 'unknown'],
              ['Status', doc.status],
              ['Course', course.name],
              ['Uploaded', new Date(doc.created_at).toLocaleString()],
            ].map(([k, v], i) => (
              <div key={k} style={{ display: 'flex', borderBottom: i < 5 ? '1px solid #2d2d2d' : 'none' }}>
                <div style={{ width: 120, padding: '9px 14px', fontSize: 12, color: '#6a6a6a', background: '#1e1e1e', flexShrink: 0 }}>{k}</div>
                <div style={{ padding: '9px 14px', fontSize: 12, color: '#cccccc', wordBreak: 'break-word' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        <style>{`@keyframes dpSpin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  // ── Course overview ───────────────────────────────────────────────────────
  return (
    <div style={{ flex: 1, background: '#1e1e1e', overflow: 'auto', padding: 32 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 18, color: '#cccccc', fontWeight: 600, marginBottom: 6 }}>{course.name}</h1>
        {course.description && (
          <p style={{ fontSize: 13, color: '#6a6a6a', lineHeight: 1.6 }}>{course.description}</p>
        )}
      </div>
      <div style={{ background: '#252526', border: '1px solid #3c3c3c', borderRadius: 6, padding: 20 }}>
        <div style={{ fontSize: 12, color: '#6a9955', marginBottom: 4 }}>
          Select a document from the Explorer, or upload a PDF using the Upload button in the sidebar.
        </div>
        <div style={{ fontSize: 12, color: '#555' }}>
          Once a document is indexed (status: ready), you can ask questions about it in the AI Chat panel.
        </div>
      </div>
    </div>
  )
}
