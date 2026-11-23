import client from './client'
import type { Course } from '@/types'

export const coursesApi = {
  list: () => client.get<Course[]>('/courses').then(r => r.data),
  create: (d: { name: string; description?: string }) =>
    client.post<Course>('/courses', d).then(r => r.data),
}
