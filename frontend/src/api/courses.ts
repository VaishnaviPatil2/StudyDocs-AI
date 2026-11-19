import client from './client'
import type { Course, CreateCourseRequest } from '@/types'

export const coursesApi = {
  list: async (): Promise<Course[]> => {
    const res = await client.get<Course[]>('/courses')
    return res.data
  },

  create: async (data: CreateCourseRequest): Promise<Course> => {
    const res = await client.post<Course>('/courses', data)
    return res.data
  },
}
