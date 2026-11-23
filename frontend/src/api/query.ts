import client from './client'
import type { QueryRequest, QueryResponse } from '@/types'

export const queryApi = {
  ask: (courseId: number, d: QueryRequest) =>
    client.post<QueryResponse>(`/courses/${courseId}/query`, d).then(r => r.data),
}
