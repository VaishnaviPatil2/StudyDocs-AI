import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FileText, Loader2, Upload, X } from 'lucide-react'
import { coursesApi } from '@/api/courses'
import { documentsApi } from '@/api/documents'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import type { Course, Document } from '@/types'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DocumentsPage() {
  const [searchParams] = useSearchParams()
  const activeCourseId = searchParams.get('course') ? Number(searchParams.get('course')) : null

  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<number | null>(activeCourseId)
  const [documents, setDocuments] = useState<Document[]>([])
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    coursesApi.list().then(setCourses)
  }, [])

  useEffect(() => {
    if (!selectedCourse) return
    setLoadingDocs(true)
    documentsApi
      .list(selectedCourse)
      .then(setDocuments)
      .finally(() => setLoadingDocs(false))
  }, [selectedCourse])

  // Poll processing documents every 3s
  useEffect(() => {
    const hasProcessing = documents.some(
      (d) => d.status === 'pending' || d.status === 'processing',
    )
    if (!hasProcessing || !selectedCourse) return
    const timer = setInterval(() => {
      documentsApi.list(selectedCourse).then(setDocuments)
    }, 3000)
    return () => clearInterval(timer)
  }, [documents, selectedCourse])

  const handleUpload = useCallback(
    async (file: File) => {
      if (!selectedCourse) return
      if (file.type !== 'application/pdf') {
        setUploadError('Only PDF files are accepted.')
        return
      }
      setUploadError('')
      setUploading(true)
      try {
        const doc = await documentsApi.upload(selectedCourse, file)
        setDocuments((prev) => [doc, ...prev])
      } catch {
        setUploadError('Upload failed. Please try again.')
      } finally {
        setUploading(false)
      }
    },
    [selectedCourse],
  )

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
        <p className="text-slate-500 mt-1 text-sm">Upload PDFs to index them for AI search</p>
      </div>

      {/* Course selector */}
      <div className="mb-6">
        <label className="text-sm font-medium text-slate-700 block mb-2">Select Course</label>
        <div className="flex flex-wrap gap-2">
          {courses.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCourse(c.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors cursor-pointer ${
                selectedCourse === c.id
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-400'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {selectedCourse && (
        <>
          {/* Upload zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`mb-6 border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
              dragOver
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-slate-300 hover:border-indigo-400 bg-white'
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileInput}
              className="hidden"
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-2 text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                <p className="text-sm">Uploading…</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload className="w-10 h-10 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Drop a PDF here, or{' '}
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="text-indigo-600 hover:underline cursor-pointer"
                    >
                      browse
                    </button>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">PDF only · Max 50 MB</p>
                </div>
              </div>
            )}
            {uploadError && (
              <div className="mt-3 flex items-center justify-center gap-1.5 text-red-600 text-sm">
                <X className="w-4 h-4" /> {uploadError}
              </div>
            )}
          </div>

          {/* Documents list */}
          {loadingDocs ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm py-8">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading documents…
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No documents yet. Upload a PDF above.</p>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold text-slate-900">
                  {documents.length} Document{documents.length !== 1 ? 's' : ''}
                </h2>
              </CardHeader>
              <div className="divide-y divide-slate-100">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-4 px-6 py-4">
                    <FileText className="w-8 h-8 text-indigo-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{doc.title}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-slate-400">{formatBytes(doc.file_size_bytes)}</span>
                        {doc.page_count && (
                          <span className="text-xs text-slate-400">{doc.page_count} pages</span>
                        )}
                        {doc.error_message && (
                          <span className="text-xs text-red-500 truncate max-w-xs">{doc.error_message}</span>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={doc.status} />
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {!selectedCourse && courses.length > 0 && (
        <div className="text-center py-16 text-slate-400">
          <p className="text-sm">Select a course above to manage its documents.</p>
        </div>
      )}
    </div>
  )
}
