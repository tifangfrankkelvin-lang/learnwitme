// src/components/Sidebar.tsx
// Left sidebar navigation — responsive:
// - Desktop (md+): permanently visible on the left
// - Mobile: hidden by default, slides in when hamburger menu is tapped

import { useEffect, useState } from 'react'
import { BookOpen, LayoutDashboard, FileText, CheckSquare, Bookmark, LogOut, ShieldCheck, Search, Calendar, Menu, X, Zap  } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { isCurrentUserAdmin } from '../lib/admin'

const NAV_ITEMS = [
  { label: 'Dashboard',   icon: LayoutDashboard, path: '/dashboard'  },
  { label: 'Search',      icon: Search,          path: '/search'     },
  { label: 'My Subjects', icon: BookOpen,        path: '/subjects'   },
  { label: 'Past Papers', icon: FileText,        path: '/past-papers'},
  { label: 'Revision',    icon: CheckSquare,     path: '/revision'   },
  { label: 'Study Plan',  icon: Calendar,        path: '/study-plan' },
  { label: 'Bookmarks',   icon: Bookmark,        path: '/bookmarks'  },
  { label: 'Upgrade', icon: Zap, path: '/pricing' },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isAdmin, setIsAdmin] = useState(false)
  // Controls whether the mobile drawer is open or closed
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    isCurrentUserAdmin().then(setIsAdmin)
  }, [])

  // Close the mobile drawer whenever the route changes
  // (so it auto-closes after the student taps a nav link)
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/')
  }

  // The actual sidebar content — shared between desktop and mobile
  const SidebarContent = (
    <aside className="h-full w-64 bg-white flex flex-col">

      {/* Logo + mobile close button */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <BookOpen className="text-indigo-600" size={24} />
          <span className="text-lg font-bold text-gray-900">
            Learn<span className="text-indigo-600">Wit</span>Me
          </span>
        </div>
        {/* Only show close button on mobile */}
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 px-4 py-6 flex flex-col gap-1 overflow-y-auto">
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

        {isAdmin && (
          <>
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

  return (
    <>
      {/* ============ DESKTOP — always visible ============ */}
      {/* hidden on mobile (below md), sticky on desktop */}
      <div className="hidden md:flex h-screen sticky top-0 w-64 border-r border-gray-100 flex-shrink-0">
        {SidebarContent}
      </div>

      {/* ============ MOBILE — hamburger button ============ */}
      {/* Fixed button in top-left corner, only visible on mobile */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center shadow-sm"
      >
        <Menu size={20} className="text-gray-600" />
      </button>

      {/* ============ MOBILE — overlay backdrop ============ */}
      {/* Dark semi-transparent overlay behind the drawer */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ============ MOBILE — slide-in drawer ============ */}
      {/* Slides in from the left when mobileOpen is true */}
      <div className={`md:hidden fixed top-0 left-0 h-full z-50 transform transition-transform duration-300 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {SidebarContent}
      </div>
    </>
  )
}