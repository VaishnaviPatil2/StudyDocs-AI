import client from './client'
import type { Document } from '@/types'

export const documentsApi = {
  upload: (courseId: number, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return client.post<Document>(
      `/courses/${courseId}/documents`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    ).then(r => r.data)
  },
  list: (courseId: number) =>
    client.get<Document[]>(`/courses/${courseId}/documents`).then(r => r.data),
}
