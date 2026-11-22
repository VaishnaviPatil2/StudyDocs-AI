import { BookOpen, FileText, LogOut, MessageSquare, User } from "lucide-react"
import { NavLink, Outlet, useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"

const nav = [
  { to: "/dashboard", icon: BookOpen, label: "Courses" },
  { to: "/documents", icon: FileText, label: "Documents" },
  { to: "/chat", icon: MessageSquare, label: "Ask AI" },
]

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() { logout(); navigate("/login") }

  return (
    <div className="flex h-screen" style={{ background: "#0f1117" }}>
      <aside className="w-60 flex flex-col shrink-0" style={{ background: "#161b27", borderRight: "1px solid #1e2433" }}>
        <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: "1px solid #1e2433" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #818cf8, #6366f1)" }}>
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">StudyDocs AI</p>
            <p className="text-xs" style={{ color: "#64748b" }}>RAG-powered Q&A</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) =>
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all " +
              (isActive ? "text-white" : "hover:text-white")
            }
            style={({ isActive }) => isActive
              ? { background: "rgba(99,102,241,0.15)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.2)" }
              : { color: "#64748b", border: "1px solid transparent" }
            }>
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4" style={{ borderTop: "1px solid #1e2433" }}>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1" style={{ background: "#1e2433" }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(99,102,241,0.2)" }}>
              <User className="w-3.5 h-3.5" style={{ color: "#818cf8" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <p className="text-xs capitalize" style={{ color: "#64748b" }}>{user?.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer" style={{ color: "#64748b" }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#f87171"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.08)" }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#64748b"; (e.currentTarget as HTMLButtonElement).style.background = "transparent" }}>
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto" style={{ background: "#0f1117" }}>
        <Outlet />
      </main>
    </div>
  )
}
