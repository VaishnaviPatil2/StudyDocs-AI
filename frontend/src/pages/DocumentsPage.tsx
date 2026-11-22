import { useCallback, useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { FileText, X, CheckCircle, AlertCircle, Loader2, MessageSquare } from "lucide-react"
import { coursesApi } from "@/api/courses"
import { documentsApi } from "@/api/documents"
import type { Course, Document } from "@/types"

function fmt(bytes: number) {
  if (bytes < 1024) return bytes + " B"
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
  return (bytes / (1024 * 1024)).toFixed(1) + " MB"
}

function StatusPill({ status }: { status: Document["status"] }) {
  if (status === "ready") return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: "rgba(16,185,129,0.15)", color: "#34d399" }}><CheckCircle className="w-3 h-3" /> Ready</span>
  if (status === "failed") return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: "rgba(239,68,68,0.15)", color: "#f87171" }}><AlertCircle className="w-3 h-3" /> Failed</span>
  return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8" }}><Loader2 className="w-3 h-3 animate-spin" /> {status === "processing" ? "Processing" : "Pending"}</span>
}

export function DocumentsPage() {
  const [searchParams] = useSearchParams()
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<number | null>(searchParams.get("course") ? Number(searchParams.get("course")) : null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [uploadSuccess, setUploadSuccess] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { coursesApi.list().then(setCourses) }, [])

  useEffect(() => {
    if (!selectedCourse) return
    let cancelled = false
    documentsApi.list(selectedCourse).then((data) => {
      if (!cancelled) {
        setDocuments(data)
        setLoadingDocs(false)
      }
    })
    return () => { cancelled = true }
  }, [selectedCourse])
  useEffect(() => {
    const busy = documents.some(d => d.status === "pending" || d.status === "processing")
    if (!busy || !selectedCourse) return
    const t = setInterval(() => documentsApi.list(selectedCourse).then(setDocuments), 3000)
    return () => clearInterval(t)
  }, [documents, selectedCourse])

  const handleUpload = useCallback(async (file: File) => {
    if (!selectedCourse) return
    if (file.type !== "application/pdf") { setUploadError("Only PDF files are accepted."); return }
    setUploadError(""); setUploadSuccess(""); setUploading(true)
    try {
      const doc = await documentsApi.upload(selectedCourse, file)
      setDocuments(prev => [doc, ...prev])
      setUploadSuccess(doc.title + " uploaded — processing in background")
      setTimeout(() => setUploadSuccess(""), 5000)
    } catch { setUploadError("Upload failed. Please try again.") }
    finally { setUploading(false) }
  }, [selectedCourse])

  const course = courses.find(c => c.id === selectedCourse)

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Documents</h1>
        <p className="mt-1 text-sm" style={{ color: "#64748b" }}>Upload PDFs to index them for AI search</p>
      </div>
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#4a5568" }}>Select Course</p>
        <div className="flex flex-wrap gap-2">
          {courses.map(c => (
            <button key={c.id} onClick={() => { setSelectedCourse(c.id); setLoadingDocs(true); setDocuments([]) }} className="px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all" style={selectedCourse === c.id ? { background: "rgba(99,102,241,0.2)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.4)" } : { background: "#161b27", color: "#64748b", border: "1px solid #1e2433" }}>
              {c.name}
            </button>
          ))}
        </div>
      </div>
      {selectedCourse && (
        <>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#4a5568" }}>Upload PDF</p>
              {course && <span className="text-xs" style={{ color: "#4a5568" }}>to {course.name}</span>}
            </div>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleUpload(f) }}
              onClick={() => !uploading && fileRef.current?.click()}
              className="rounded-2xl p-10 text-center cursor-pointer transition-all"
              style={{ background: dragOver ? "rgba(99,102,241,0.08)" : "#161b27", border: "2px dashed " + (dragOver ? "#6366f1" : "#2d3748") }}
            >
              <input ref={fileRef} type="file" accept="application/pdf" onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = "" }} className="hidden" />
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "#1e2433" }}>
                  {uploading ? <Loader2 className="w-7 h-7 animate-spin" style={{ color: "#6366f1" }} /> : (
                    <div className="relative">
                      <FileText className="w-7 h-7" style={{ color: dragOver ? "#818cf8" : "#4a5568" }} />
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center font-bold text-white text-xs" style={{ background: "#6366f1" }}>+</div>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{uploading ? "Uploading..." : <>Drop a PDF here, or <span style={{ color: "#818cf8" }}>click to browse</span></>}</p>
                  <p className="text-xs mt-1" style={{ color: "#4a5568" }}>PDF only · Max 50 MB</p>
                </div>
              </div>
            </div>
            {uploadError && <div className="mt-3 flex items-center gap-2 rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}><X className="w-4 h-4" /> {uploadError}</div>}
            {uploadSuccess && <div className="mt-3 flex items-center gap-2 rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", color: "#34d399" }}><CheckCircle className="w-4 h-4" /> {uploadSuccess}</div>}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#4a5568" }}>{documents.length} Document{documents.length !== 1 ? "s" : ""}</p>
            {loadingDocs ? <div className="space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "#161b27" }} />)}</div>
              : documents.length === 0 ? (
                <div className="text-center py-14 rounded-2xl" style={{ background: "#161b27", border: "1px solid #1e2433" }}>
                  <FileText className="w-10 h-10 mx-auto mb-2" style={{ color: "#2d3748" }} />
                  <p className="text-sm text-white">No documents yet</p>
                  <p className="text-xs mt-1" style={{ color: "#4a5568" }}>Upload a PDF above</p>
                </div>
              ) : (
                <div className="rounded-2xl overflow-hidden" style={{ background: "#161b27", border: "1px solid #1e2433" }}>
                  {documents.map((doc, i) => (
                    <div key={doc.id} className="flex items-center gap-4 px-5 py-4" style={{ borderBottom: i < documents.length - 1 ? "1px solid #1e2433" : "none" }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(99,102,241,0.12)" }}>
                        <FileText className="w-5 h-5" style={{ color: "#818cf8" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{doc.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs" style={{ color: "#4a5568" }}>{fmt(doc.file_size_bytes)}</span>
                          {doc.page_count && <><span style={{ color: "#2d3748" }}>·</span><span className="text-xs" style={{ color: "#4a5568" }}>{doc.page_count}p</span></>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusPill status={doc.status} />
                        {doc.status === "ready" && <span className="hidden sm:inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg" style={{ color: "#64748b", background: "#1e2433" }}><MessageSquare className="w-3 h-3" /> Ask AI</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        </>
      )}
      {!selectedCourse && courses.length > 0 && (
        <div className="text-center py-20 rounded-2xl" style={{ background: "#161b27", border: "1px solid #1e2433" }}>
          <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: "#2d3748" }} />
          <p className="text-white font-medium">Select a course to manage documents</p>
        </div>
      )}
    </div>
  )
}