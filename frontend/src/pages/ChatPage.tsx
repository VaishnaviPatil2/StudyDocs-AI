import { useEffect, useRef, useState } from "react"
import { coursesApi } from "@/api/courses"
import { documentsApi } from "@/api/documents"
import { queryApi } from "@/api/query"
import type { Course, Document, QueryResponse, SourceCitation } from "@/types"
import { Send, Sparkles, ChevronDown, BookOpen, MessageSquare } from "lucide-react"

interface Message {
  id: string; role: "user" | "assistant"; content: string
  sources?: SourceCitation[]; model?: string; loading?: boolean
}

function SourceCard({ s }: { s: SourceCitation }) {
  return (
    <div className="flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs" style={{ background: "#1e2433", border: "1px solid #2d3748" }}>
      <BookOpen className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: "#818cf8" }} />
      <div>
        <p className="font-medium text-white">{s.document_title}{s.page_number ? " — Page " + s.page_number : ""}</p>
        <p className="mt-0.5 italic" style={{ color: "#64748b" }}>"{s.chunk_excerpt.slice(0, 100)}..."</p>
      </div>
    </div>
  )
}

function AiMessage({ msg }: { msg: Message }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex gap-3 max-w-3xl">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-1" style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}>
        <Sparkles className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1">
        <div className="rounded-2xl rounded-tl-none px-4 py-3" style={{ background: "#161b27", border: "1px solid #1e2433" }}>
          {msg.loading ? (
            <div className="flex gap-1 items-center h-5">
              <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: "#6366f1", animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: "#6366f1", animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: "#6366f1", animationDelay: "300ms" }} />
            </div>
          ) : <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">{msg.content}</p>}
        </div>
        {msg.sources && msg.sources.length > 0 && (
          <div className="mt-2">
            <button onClick={() => setOpen(!open)} className="flex items-center gap-1 text-xs font-medium cursor-pointer" style={{ color: "#818cf8" }}>
              <ChevronDown className={"w-3.5 h-3.5 transition-transform " + (open ? "rotate-180" : "")} />
              {msg.sources.length} source{msg.sources.length !== 1 ? "s" : ""}
            </button>
            {open && <div className="mt-2 space-y-2">{msg.sources.map((s, i) => <SourceCard key={i} s={s} />)}</div>}
          </div>
        )}
        {msg.model && !msg.loading && <p className="text-xs mt-1 ml-1" style={{ color: "#2d3748" }}>{msg.model}</p>}
      </div>
    </div>
  )
}

function UserMsg({ msg }: { msg: Message }) {
  return (
    <div className="flex justify-end max-w-3xl ml-auto">
      <div className="rounded-2xl rounded-tr-none px-4 py-3 max-w-xl" style={{ background: "linear-gradient(135deg, #4f46e5, #6366f1)" }}>
        <p className="text-sm text-white leading-relaxed">{msg.content}</p>
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
  const [question, setQuestion] = useState("")
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { coursesApi.list().then(setCourses) }, [])
  useEffect(() => {
    if (!selectedCourse) return
    setSelectedDoc(null)
    documentsApi.list(selectedCourse).then(ds => setDocuments(ds.filter(d => d.status === "ready")))
  }, [selectedCourse])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!question.trim() || !selectedCourse || sending) return
    const q = question.trim(); setQuestion(""); setSending(true)
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: q }
    const aiMsg: Message = { id: crypto.randomUUID(), role: "assistant", content: "", loading: true }
    setMessages(prev => [...prev, userMsg, aiMsg])
    try {
      const res: QueryResponse = await queryApi.ask(selectedCourse, { question: q, document_id: selectedDoc ?? undefined })
      setMessages(prev => prev.map(m => m.id === aiMsg.id ? { ...m, content: res.answer, sources: res.sources, model: res.model, loading: false } : m))
    } catch {
      setMessages(prev => prev.map(m => m.id === aiMsg.id ? { ...m, content: "Something went wrong. Please try again.", loading: false } : m))
    } finally { setSending(false) }
  }

  const readyDocs = documents.filter(d => d.status === "ready")
  const canSend = !sending && !!question.trim() && !!selectedCourse

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 px-6 py-4 flex items-center gap-6" style={{ background: "#161b27", borderBottom: "1px solid #1e2433" }}>
        <div className="flex-1 max-w-xs">
          <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748b" }}>Course</label>
          <select value={selectedCourse ?? ""} onChange={e => setSelectedCourse(Number(e.target.value) || null)} className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none" style={{ background: "#1e2433", border: "1px solid #2d3748" }}>
            <option value="">Select course...</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        {readyDocs.length > 0 && (
          <div className="flex-1 max-w-xs">
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748b" }}>Filter by document <span style={{ color: "#2d3748" }}>(optional)</span></label>
            <select value={selectedDoc ?? ""} onChange={e => setSelectedDoc(Number(e.target.value) || null)} className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none" style={{ background: "#1e2433", border: "1px solid #2d3748" }}>
              <option value="">All documents</option>
              {readyDocs.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
            </select>
          </div>
        )}
        {messages.length > 0 && (
          <button onClick={() => setMessages([])} className="text-xs cursor-pointer ml-auto" style={{ color: "#4a5568" }}>Clear chat</button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {!selectedCourse ? (
          <div className="flex flex-col items-center justify-center h-full pb-20">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#161b27" }}>
              <MessageSquare className="w-8 h-8" style={{ color: "#2d3748" }} />
            </div>
            <p className="font-semibold text-white mb-1">Ask anything about your documents</p>
            <p className="text-sm" style={{ color: "#4a5568" }}>Select a course above to start chatting</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full pb-20">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(79,70,229,0.2))" }}>
              <Sparkles className="w-8 h-8" style={{ color: "#818cf8" }} />
            </div>
            <p className="font-semibold text-white mb-1">Ready to answer your questions</p>
            <p className="text-sm" style={{ color: "#4a5568" }}>Ask anything about the uploaded PDFs</p>
            {readyDocs.length === 0 && (
              <div className="mt-4 px-4 py-3 rounded-xl text-xs" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", color: "#fbbf24" }}>
                No indexed documents in this course yet — upload PDFs in the Documents tab first
              </div>
            )}
          </div>
        ) : (
          messages.map(msg => msg.role === "user" ? <UserMsg key={msg.id} msg={msg} /> : <AiMessage key={msg.id} msg={msg} />)
        )}
        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 px-6 py-4" style={{ background: "#161b27", borderTop: "1px solid #1e2433" }}>
        <form onSubmit={handleSend} className="flex gap-3 max-w-3xl mx-auto">
          <input
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e as unknown as React.FormEvent) } }}
            placeholder={selectedCourse ? "Ask a question about your documents..." : "Select a course first"}
            disabled={!selectedCourse || sending}
            className="flex-1 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none resize-none"
            style={{ background: "#1e2433", border: "1px solid #2d3748" }}
          />
          <button type="submit" disabled={!canSend} className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 cursor-pointer transition-all" style={{ background: canSend ? "linear-gradient(135deg, #6366f1, #4f46e5)" : "#1e2433", opacity: canSend ? 1 : 0.5 }}>
            <Send className="w-4 h-4 text-white" />
          </button>
        </form>
        <p className="text-center text-xs mt-2" style={{ color: "#2d3748" }}>Answers are grounded in your uploaded documents only</p>
      </div>
    </div>
  )
}