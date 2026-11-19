import { useEffect, useRef, useState } from 'react'
import { coursesApi } from '@/api/courses'
import { documentsApi } from '@/api/documents'
import { queryApi } from '@/api/query'
import { Button } from '@/components/ui/Button'
import type { Course, Document, QueryResponse, SourceCitation } from '@/types'
import { BookOpen, ChevronDown, MessageSquare, Send, Sparkles } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: SourceCitation[]
  model?: string
}

function SourceCard({ source }: { source: SourceCitation }) {
  return (
    <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs">
      <BookOpen className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
      <div>
        <p className="font-medium text-slate-700">
          {source.document_title}
          {source.page_number ? ` — Page ${source.page_number}` : ''}
        </p>
        <p className="text-slate-500 mt-0.5 line-clamp-2 italic">"{source.chunk_excerpt}…"</p>
      </div>
    </div>
  )
}

function AssistantMessage({ message }: { message: Message }) {
  const [showSources, setShowSources] = useState(false)
  return (
    <div className="flex gap-3 max-w-3xl">
      <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 mt-1">
        <Sparkles className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1">
        <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
          <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
        {message.sources && message.sources.length > 0 && (
          <div className="mt-2">
            <button
              onClick={() => setShowSources(!showSources)}
              className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSources ? 'rotate-180' : ''}`} />
              {message.sources.length} source{message.sources.length !== 1 ? 's' : ''}
            </button>
            {showSources && (
              <div className="mt-2 space-y-2">
                {message.sources.map((s, i) => (
                  <SourceCard key={i} source={s} />
                ))}
              </div>
            )}
          </div>
        )}
        {message.model && (
          <p className="text-xs text-slate-400 mt-1 ml-1">{message.model}</p>
        )}
      </div>
    </div>
  )
}

function UserMessage({ message }: { message: Message }) {
  return (
    <div className="flex gap-3 justify-end max-w-3xl ml-auto">
      <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-none px-4 py-3 max-w-xl">
        <p className="text-sm leading-relaxed">{message.content}</p>
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 max-w-3xl">
      <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
        <Sparkles className="w-4 h-4 text-white" />
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center h-5">
          <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" />
        </div>
      </div>
    </div>
  )
}

export function ChatPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedDoc, setSelectedDoc] = useState<number | null>(null)

  const [messages, setMessages] = useState<Message[]>([])
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    coursesApi.list().then(setCourses)
  }, [])

  useEffect(() => {
    if (!selectedCourse) return
    setSelectedDoc(null)
    documentsApi.list(selectedCourse).then((docs) => {
      setDocuments(docs.filter((d) => d.status === 'ready'))
    })
  }, [selectedCourse])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!question.trim() || !selectedCourse || loading) return

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question.trim(),
    }
    setMessages((prev) => [...prev, userMsg])
    setQuestion('')
    setLoading(true)

    try {
      const res: QueryResponse = await queryApi.ask(selectedCourse, {
        question: userMsg.content,
        document_id: selectedDoc ?? undefined,
      })
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: res.answer,
          sources: res.sources,
          model: res.model,
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Sorry, something went wrong. Please check that the backend is running and try again.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const readyDocs = documents.filter((d) => d.status === 'ready')

  return (
    <div className="flex flex-col h-full">
      {/* ── Top bar ───────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-6 shrink-0">
        {/* Course select */}
        <div className="flex-1 max-w-xs">
          <label className="text-xs font-medium text-slate-500 block mb-1">Course</label>
          <select
            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            value={selectedCourse ?? ''}
            onChange={(e) => setSelectedCourse(Number(e.target.value) || null)}
          >
            <option value="">Select a course…</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Document filter */}
        {readyDocs.length > 0 && (
          <div className="flex-1 max-w-xs">
            <label className="text-xs font-medium text-slate-500 block mb-1">
              Filter by document <span className="text-slate-400">(optional)</span>
            </label>
            <select
              className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              value={selectedDoc ?? ''}
              onChange={(e) => setSelectedDoc(Number(e.target.value) || null)}
            >
              <option value="">All documents</option>
              {readyDocs.map((d) => (
                <option key={d.id} value={d.id}>{d.title}</option>
              ))}
            </select>
          </div>
        )}

        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="text-xs text-slate-400 hover:text-slate-600 ml-auto cursor-pointer"
          >
            Clear chat
          </button>
        )}
      </div>

      {/* ── Messages ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {!selectedCourse && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4 pb-20">
            <MessageSquare className="w-14 h-14 opacity-20" />
            <div className="text-center">
              <p className="font-medium text-slate-600">Ask anything about your documents</p>
              <p className="text-sm mt-1">Select a course above to get started</p>
            </div>
          </div>
        )}

        {selectedCourse && messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3 pb-20">
            <Sparkles className="w-12 h-12 opacity-20" />
            <div className="text-center">
              <p className="font-medium text-slate-600">What would you like to know?</p>
              <p className="text-sm mt-1">Ask a question about the uploaded PDFs in this course</p>
            </div>
            {readyDocs.length === 0 && (
              <p className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg px-4 py-2 mt-2">
                No indexed documents yet — upload PDFs in the Documents tab first
              </p>
            )}
          </div>
        )}

        {messages.map((msg) =>
          msg.role === 'user'
            ? <UserMessage key={msg.id} message={msg} />
            : <AssistantMessage key={msg.id} message={msg} />,
        )}

        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ─────────────────────────────────────────────────── */}
      <div className="bg-white border-t border-slate-200 px-6 py-4 shrink-0">
        <form onSubmit={handleSend} className="flex gap-3 max-w-3xl mx-auto">
          <input
            className="flex-1 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-400"
            placeholder={selectedCourse ? 'Ask a question about your documents…' : 'Select a course first'}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={!selectedCourse || loading}
          />
          <Button
            type="submit"
            disabled={!question.trim() || !selectedCourse || loading}
            loading={loading}
            className="shrink-0 px-5"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
        <p className="text-center text-xs text-slate-400 mt-2">
          Answers are grounded in your uploaded documents only
        </p>
      </div>
    </div>
  )
}
