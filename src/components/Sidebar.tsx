// src/components/Sidebar.tsx
// Left sidebar navigation. Shows an extra "Admin" link
// only if the logged-in user has admin privileges.

import { useEffect, useState } from 'react'
import { BookOpen, LayoutDashboard, FileText, CheckSquare, Bookmark, LogOut, ShieldCheck, Search, Calendar } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { isCurrentUserAdmin } from '../lib/admin'

const NAV_ITEMS = [
  { label: 'Dashboard',   icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Search',      icon: Search,          path: '/search'    },
  { label: 'My Subjects', icon: BookOpen,        path: '/subjects'  },
  { label: 'Past Papers', icon: FileText,        path: '/past-papers'},
  { label: 'Revision',    icon: CheckSquare,     path: '/revision'  },
  { label: 'Study Plan', icon: Calendar, path: '/study-plan' },
  { label: 'Bookmarks',   icon: Bookmark,        path: '/bookmarks' },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  // Tracks whether the current user has admin privileges
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // Check admin status once when the sidebar mounts
    isCurrentUserAdmin().then(setIsAdmin)
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <aside className="h-screen sticky top-0 w-64 bg-white border-r border-gray-100 flex flex-col">

      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-100">
        <BookOpen className="text-indigo-600" size={24} />
        <span className="text-lg font-bold text-gray-900">
          Learn<span className="text-indigo-600">Wit</span>Me
        </span>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 px-4 py-6 flex flex-col gap-1">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon
          const isActive = location.pathname === item.path

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-200 w-full text-left ${
                isActive
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon size={20} />
              {item.label}
            </button>
          )
        })}

        {/* Admin link — only rendered if the user is an admin */}
        {isAdmin && (
          <>
            {/* Visual divider to separate admin tools from regular nav */}
            <div className="my-2 border-t border-gray-100" />
            <button
              onClick={() => navigate('/admin')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-200 w-full text-left ${
                location.pathname === '/admin'
                  ? 'bg-amber-50 text-amber-600'
                  : 'text-amber-600 hover:bg-amber-50'
              }`}
            >
              <ShieldCheck size={20} />
              Admin
            </button>
          </>
        )}
      </nav>

      {/* Sign out */}
      <div className="px-4 py-4 border-t border-gray-100">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors duration-200 w-full text-left"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>

    </aside>
  )
}