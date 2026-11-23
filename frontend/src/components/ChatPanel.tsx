import { useEffect, useRef, useState } from 'react'
import { queryApi } from '@/api/query'
import type { Course, Document, SourceCitation } from '@/types'

interface Message {
  id: string
  role: 'user' | 'ai'
  text: string
  sources?: SourceCitation[]
  loading?: boolean
}

interface Props {
  course: Course | null
  readyDocs: Document[]
  defaultDocId: number | null
}

function SourceList({ sources }: { sources: SourceCitation[] }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ marginTop: 6 }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6a9955', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, padding: '2px 0' }}
      >
        <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
        </svg>
        {sources.length} source{sources.length !== 1 ? 's' : ''}
        <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>
          <path strokeLinecap="round" d="M9 18l6-6-6-6" />
        </svg>
      </button>
      {open && (
        <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {sources.map((s, i) => (
            <div key={i} style={{ padding: '7px 10px', background: '#161616', border: '1px solid #2d2d2d', borderRadius: 4 }}>
              <div style={{ fontSize: 11, color: '#4ec9b0', marginBottom: 3, fontWeight: 600 }}>
                {s.document_title}{s.page_number ? ` — p.${s.page_number}` : ''}
              </div>
              <div style={{ fontSize: 11, color: '#5a5a5a', fontStyle: 'italic', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as React.CSSProperties}>
                "{s.chunk_excerpt}"
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function ChatPanel({ course, readyDocs, defaultDocId }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [docFilter, setDocFilter] = useState<number | null>(defaultDocId)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setDocFilter(defaultDocId)
  }, [defaultDocId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || !course || sending) return
    const q = input.trim()
    setInput('')
    setSending(true)

    const uid = crypto.randomUUID()
    const aid = crypto.randomUUID()
    setMessages(prev => [
      ...prev,
      { id: uid, role: 'user', text: q },
      { id: aid, role: 'ai', text: '', loading: true },
    ])

    try {
      const res = await queryApi.ask(course.id, {
        question: q,
        document_id: docFilter ?? undefined,
      })
      setMessages(prev =>
        prev.map(m =>
          m.id === aid
            ? { ...m, text: res.answer, sources: res.sources, loading: false }
            : m,
        ),
      )
    } catch {
      setMessages(prev =>
        prev.map(m =>
          m.id === aid
            ? { ...m, text: 'Something went wrong. Please try again.', loading: false }
            : m,
        ),
      )
    } finally {
      setSending(false)
      textRef.current?.focus()
    }
  }

  const canSend = !!input.trim() && !!course && !sending

  return (
    <div style={{ width: 400, display: 'flex', flexDirection: 'column', background: '#1e1e1e', borderLeft: '1px solid #2d2d2d', flexShrink: 0 }}>
      {/* Header */}
      <div style={{ height: 35, background: '#252526', borderBottom: '1px solid #2d2d2d', display: 'flex', alignItems: 'center', padding: '0 14px', gap: 8, flexShrink: 0 }}>
        <svg width="14" height="14" fill="none" stroke="#0e639c" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" d="M12 3l1.912 5.813a2 2 0 001.272 1.272L21 12l-5.816 1.912a2 2 0 00-1.272 1.272L12 21l-1.912-5.816a2 2 0 00-1.272-1.272L3 12l5.816-1.913a2 2 0 001.272-1.272L12 3z" />
        </svg>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#cccccc', flex: 1 }}>AI Chat</span>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', fontSize: 11 }}
          >
            clear
          </button>
        )}
      </div>

      {/* Document filter */}
      {course && (
        <div style={{ padding: '8px 12px', borderBottom: '1px solid #2d2d2d', background: '#252526', flexShrink: 0 }}>
          <div style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Search scope</div>
          <select
            value={docFilter ?? ''}
            onChange={e => setDocFilter(Number(e.target.value) || null)}
            style={{ width: '100%', padding: '4px 8px', background: '#3c3c3c', border: '1px solid #555', borderRadius: 3, color: '#ccc', fontSize: 12, outline: 'none' }}
          >
            <option value="">All documents in {course.name}</option>
            {readyDocs.map(d => (
              <option key={d.id} value={d.id}>{d.title}</option>
            ))}
          </select>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {!course ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, color: '#3c3c3c', textAlign: 'center' }}>
            <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M12 3l1.912 5.813a2 2 0 001.272 1.272L21 12l-5.816 1.912a2 2 0 00-1.272 1.272L12 21l-1.912-5.816a2 2 0 00-1.272-1.272L3 12l5.816-1.913a2 2 0 001.272-1.272L12 3z" />
            </svg>
            <div style={{ fontSize: 13, color: '#4a4a4a' }}>Select a course to begin</div>
          </div>
        ) : messages.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 14, textAlign: 'center' }}>
            <svg width="32" height="32" fill="none" stroke="#0e639c" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M12 3l1.912 5.813a2 2 0 001.272 1.272L21 12l-5.816 1.912a2 2 0 00-1.272 1.272L12 21l-1.912-5.816a2 2 0 00-1.272-1.272L3 12l5.816-1.913a2 2 0 001.272-1.272L12 3z" />
            </svg>
            <div>
              <div style={{ fontSize: 14, color: '#9d9d9d', marginBottom: 6 }}>Ask anything about your documents</div>
              <div style={{ fontSize: 12, color: '#555', maxWidth: 260, lineHeight: 1.6 }}>
                {readyDocs.length === 0
                  ? 'Upload a PDF first — once indexed, ask questions about its content'
                  : 'Answers are grounded in your documents with source citations'}
              </div>
            </div>
            {readyDocs.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', maxWidth: 280 }}>
                {[
                  'What are the main topics covered?',
                  'Summarise the key points',
                  'What examples are given?',
                ].map(s => (
                  <button
                    key={s}
                    onClick={() => { setInput(s); textRef.current?.focus() }}
                    style={{ padding: '7px 12px', background: '#252526', border: '1px solid #3c3c3c', borderRadius: 4, color: '#9d9d9d', fontSize: 12, cursor: 'pointer', textAlign: 'left' }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              {msg.role === 'user' ? (
                <div style={{ maxWidth: '88%', padding: '8px 12px', background: '#0e639c', borderRadius: '12px 12px 2px 12px', fontSize: 13, color: '#fff', lineHeight: 1.5 }}>
                  {msg.text}
                </div>
              ) : (
                <div style={{ maxWidth: '100%' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <div style={{ width: 24, height: 24, background: '#252526', border: '1px solid #3c3c3c', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                      <svg width="11" height="11" fill="none" stroke="#0e639c" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path strokeLinecap="round" d="M12 3l1.912 5.813a2 2 0 001.272 1.272L21 12l-5.816 1.912a2 2 0 00-1.272 1.272L12 21l-1.912-5.816a2 2 0 00-1.272-1.272L3 12l5.816-1.913a2 2 0 001.272-1.272L12 3z" />
                      </svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ padding: '8px 12px', background: '#252526', border: '1px solid #3c3c3c', borderRadius: '2px 12px 12px 12px', fontSize: 13, color: '#cccccc', lineHeight: 1.65 }}>
                        {msg.loading ? (
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center', height: 20 }}>
                            {[0, 150, 300].map(d => (
                              <span key={d} style={{ width: 6, height: 6, borderRadius: '50%', background: '#0e639c', display: 'inline-block', animation: `chatBounce 1.2s ${d}ms ease-in-out infinite` }} />
                            ))}
                          </div>
                        ) : (
                          <span style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</span>
                        )}
                      </div>
                      {!msg.loading && msg.sources && msg.sources.length > 0 && (
                        <SourceList sources={msg.sources} />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '10px 12px', borderTop: '1px solid #2d2d2d', flexShrink: 0, background: '#252526' }}>
        <form onSubmit={send} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea
            ref={textRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send(e as unknown as React.FormEvent)
              }
            }}
            placeholder={course ? 'Ask about your documents… (Enter to send, Shift+Enter for newline)' : 'Select a course first'}
            disabled={!course || sending}
            rows={2}
            style={{ flex: 1, padding: '8px 10px', background: '#3c3c3c', border: '1px solid #555', borderRadius: 4, color: '#ccc', fontSize: 13, outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: 1.4 }}
          />
          <button
            type="submit"
            disabled={!canSend}
            style={{
              width: 40, height: 56, background: canSend ? '#0e639c' : '#2d2d2d',
              border: 'none', borderRadius: 4, cursor: canSend ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              transition: 'background 0.15s',
            }}
          >
            <svg width="15" height="15" fill="none" stroke={canSend ? '#fff' : '#555'} strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </form>
        <div style={{ fontSize: 10, color: '#3c3c3c', marginTop: 5, textAlign: 'center' }}>
          {course ? `openai/gpt-oss-20b via Groq · ${readyDocs.length} indexed doc${readyDocs.length !== 1 ? 's' : ''}` : '—'}
        </div>
      </div>

      <style>{`
        @keyframes chatBounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} }
      `}</style>
    </div>
  )
}
