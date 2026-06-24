// src/components/Sidebar.tsx
// This is the left sidebar navigation that appears on all
// main app pages (dashboard, subjects, past papers, etc.)
// It's a separate component so we can reuse it everywhere.

import { BookOpen, LayoutDashboard, FileText, CheckSquare, Bookmark, LogOut } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// Each navigation item has a label, icon, and the path it links to
const NAV_ITEMS = [
  { label: 'Dashboard',         icon: LayoutDashboard, path: '/dashboard' },
  { label: 'My Subjects',       icon: BookOpen,        path: '/subjects'  },
  { label: 'Past Papers',       icon: FileText,        path: '/past-papers'},
  { label: 'Revision',          icon: CheckSquare,     path: '/revision'  },
  { label: 'Bookmarks',         icon: Bookmark,        path: '/bookmarks' },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  // location.pathname tells us which page we're on
  // so we can highlight the active nav item

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    // h-screen: full height | sticky top-0: stays visible when scrolling
    // w-64: fixed width of 256px
    <aside className="h-screen sticky top-0 w-64 bg-white border-r border-gray-100 flex flex-col">

      {/* Logo at the top of sidebar */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-100">
        <BookOpen className="text-indigo-600" size={24} />
        <span className="text-lg font-bold text-gray-900">
          Learn<span className="text-indigo-600">Wit</span>Me
        </span>
      </div>

      {/* Navigation links */}
      {/* flex-1 makes this section grow to fill available space */}
      <nav className="flex-1 px-4 py-6 flex flex-col gap-1">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon
          // Check if this nav item matches the current page
          const isActive = location.pathname === item.path

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-200 w-full text-left ${
                isActive
                  ? 'bg-indigo-50 text-indigo-600'      // Active page style
                  : 'text-gray-600 hover:bg-gray-50'    // Inactive style
              }`}
            >
              <Icon size={20} />
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Sign out button at the bottom */}
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