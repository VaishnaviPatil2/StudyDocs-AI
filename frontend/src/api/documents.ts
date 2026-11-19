import client from './client'
import type { Document } from '@/types'

export const documentsApi = {
  upload: async (courseId: number, file: File): Promise<Document> => {
    const form = new FormData()
    form.append('file', file)
    const res = await client.post<Document>(
      `/courses/${courseId}/documents`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return res.data
  },

  list: async (courseId: number): Promise<Document[]> => {
    const res = await client.get<Document[]>(`/courses/${courseId}/documents`)
    return res.data
  },

  get: async (courseId: number, documentId: number): Promise<Document> => {
    const res = await client.get<Document>(`/courses/${courseId}/documents/${documentId}`)
    return res.data
  },
}
