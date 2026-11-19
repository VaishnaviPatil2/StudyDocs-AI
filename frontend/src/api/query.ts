import client from './client'
import type { QueryRequest, QueryResponse } from '@/types'

export const queryApi = {
  ask: async (courseId: number, data: QueryRequest): Promise<QueryResponse> => {
    const res = await client.post<QueryResponse>(`/courses/${courseId}/query`, data)
    return res.data
  },
}
