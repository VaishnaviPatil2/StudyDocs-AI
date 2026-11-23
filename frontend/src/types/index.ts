export interface User { id: number; name: string; email: string; role: string }
export interface TokenResponse { access_token: string; token_type: string }
export interface LoginRequest { email: string; password: string }
export interface RegisterRequest { name: string; email: string; password: string }

export interface Course {
  id: number; name: string; description: string | null
  created_by: number; created_at: string
}

export type DocumentStatus = 'pending' | 'processing' | 'ready' | 'failed'

export interface Document {
  id: number; course_id: number; uploaded_by: number; title: string
  file_size_bytes: number; page_count: number | null
  status: DocumentStatus; error_message: string | null
  created_at: string; updated_at: string
}

export interface SourceCitation {
  document_id: number; document_title: string
  page_number: number | null; chunk_excerpt: string
}

export interface QueryRequest { question: string; document_id?: number | null }

export interface QueryResponse {
  answer: string; sources: SourceCitation[]
  model: string; question: string
}

export interface ApiError { detail: string }
