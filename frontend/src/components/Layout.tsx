import { BookOpen, FileText, LogOut, MessageSquare, User } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/dashboard', icon: BookOpen, label: 'Courses' },
  { to: '/documents', icon: FileText, label: 'Documents' },
  { to: '/chat', icon: MessageSquare, label: 'Ask AI' },
]

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* ── Sidebar ───────────────────────────────────────────────── */}
      <aside className="w-64 flex flex-col bg-white border-r border-slate-200 shadow-sm">
        {/* Brand */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">StudyDocs AI</p>
            <p className="text-xs text-slate-500">RAG-powered Q&A</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User / Logout */}
        <div className="px-3 py-4 border-t border-slate-100 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-50">
            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-900 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-red-600 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
