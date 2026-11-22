import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { BookOpen, Plus, ChevronRight, Users, FileText } from "lucide-react"
import { coursesApi } from "@/api/courses"
import { useAuth } from "@/context/AuthContext"
import type { Course } from "@/types"

export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [creating, setCreating] = useState(false)

  useEffect(() => { coursesApi.list().then(setCourses).finally(() => setLoading(false)) }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    try {
      const c = await coursesApi.create({ name: newName, description: newDesc || undefined })
      setCourses(prev => [...prev, c])
      setShowCreate(false); setNewName(""); setNewDesc("")
    } finally { setCreating(false) }
  }

  const colors = ["#6366f1","#8b5cf6","#06b6d4","#10b981","#f59e0b","#ef4444"]

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Good day, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#64748b" }}>
            {courses.length} course{courses.length !== 1 ? "s" : ""} available
          </p>
        </div>
        {user?.role === "admin" && (
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer transition-all" style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.opacity = "0.85"}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity = "1"}>
            <Plus className="w-4 h-4" /> New Course
          </button>
        )}
      </div>

      {showCreate && (
        <div className="mb-6 rounded-2xl p-6" style={{ background: "#161b27", border: "1px solid #1e2433" }}>
          <h2 className="text-sm font-semibold text-white mb-4">Create New Course</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Course name *" required className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none" style={{ background: "#1e2433", border: "1px solid #2d3748" }} />
            <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description (optional)" className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none" style={{ background: "#1e2433", border: "1px solid #2d3748" }} />
            <div className="flex gap-3">
              <button type="submit" disabled={creating} className="px-4 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer" style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}>
                {creating ? "Creating..." : "Create"}
              </button>
              <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer" style={{ background: "#1e2433", color: "#94a3b8" }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-40 rounded-2xl animate-pulse" style={{ background: "#161b27" }} />)}
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "#161b27" }}>
            <BookOpen className="w-8 h-8" style={{ color: "#4a5568" }} />
          </div>
          <p className="text-white font-medium mb-1">No courses yet</p>
          <p className="text-sm" style={{ color: "#64748b" }}>{user?.role === "admin" ? "Create your first course above." : "Ask your admin to create a course."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course, idx) => (
            <div key={course.id} onClick={() => navigate("/documents?course=" + course.id)} className="group relative rounded-2xl p-6 cursor-pointer transition-all" style={{ background: "#161b27", border: "1px solid #1e2433" }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = colors[idx % colors.length] + "55"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)" }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#1e2433"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)" }}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: colors[idx % colors.length] + "22" }}>
                  <BookOpen className="w-5 h-5" style={{ color: colors[idx % colors.length] }} />
                </div>
                <ChevronRight className="w-4 h-4 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: colors[idx % colors.length] }} />
              </div>
              <h3 className="font-semibold text-white text-sm mb-1 leading-tight">{course.name}</h3>
              {course.description && <p className="text-xs line-clamp-2 mb-3" style={{ color: "#64748b" }}>{course.description}</p>}
              <div className="flex items-center gap-3 mt-auto">
                <span className="text-xs flex items-center gap-1" style={{ color: "#4a5568" }}>
                  <FileText className="w-3 h-3" /> Documents
                </span>
                <span className="text-xs" style={{ color: "#2d3748" }}>·</span>
                <span className="text-xs" style={{ color: "#4a5568" }}>
                  {new Date(course.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
