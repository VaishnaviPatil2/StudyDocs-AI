import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, ChevronRight, Plus } from 'lucide-react'
import { coursesApi } from '@/api/courses'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { useAuth } from '@/context/AuthContext'
import type { Course } from '@/types'

export function DashboardPage() {
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    coursesApi.list().then(setCourses).finally(() => setLoading(false))
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    try {
      const course = await coursesApi.create({ name: newName, description: newDesc || undefined })
      setCourses((prev) => [...prev, course])
      setShowCreate(false)
      setNewName('')
      setNewDesc('')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            {courses.length} course{courses.length !== 1 ? 's' : ''} available
          </p>
        </div>
        {user?.role === 'admin' && (
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" /> New Course
          </Button>
        )}
      </div>

      {/* Create course form */}
      {showCreate && (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-sm font-semibold text-slate-900">Create New Course</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <input
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Course name *"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                autoFocus
              />
              <input
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Description (optional)"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
              <div className="flex gap-3">
                <Button type="submit" loading={creating} size="sm">Create</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Course grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No courses yet.{user?.role === 'admin' ? ' Create one above.' : ' Ask your admin to create one.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <Link
              key={course.id}
              to={`/documents?course=${course.id}`}
              className="group block"
            >
              <Card className="h-full hover:shadow-md hover:border-indigo-200 transition-all">
                <CardContent className="pt-6 pb-5">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center mb-3">
                      <BookOpen className="w-5 h-5 text-indigo-600" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 mt-1 transition-colors" />
                  </div>
                  <h3 className="font-semibold text-slate-900 text-sm leading-tight">
                    {course.name}
                  </h3>
                  {course.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {course.description}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-3">
                    {new Date(course.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
