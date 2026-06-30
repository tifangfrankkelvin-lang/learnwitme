// src/components/NotificationBell.tsx
// A bell icon with a badge count shown in the dashboard header.
// Clicking it opens a dropdown list of notifications.

import { useEffect, useState, useRef } from 'react'
import { Bell } from 'lucide-react'
import { generateNotifications } from '../lib/notifications'
import type { Notification } from '../lib/notifications'
import { supabase } from '../lib/supabase'

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const notifs = await generateNotifications(session.user.id)
      setNotifications(notifs)
    }
    load()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const urgentCount = notifications.filter(n => n.urgent).length
  const badgeCount = notifications.length

  return (
    <div className="relative" ref={dropdownRef}>

      {/* Bell button */}
      <button
        onClick={() => setOpen(prev => !prev)}
        className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
      >
        <Bell size={18} className={urgentCount > 0 ? 'text-orange-500' : 'text-gray-500'} />
        {badgeCount > 0 && (
          <span className={`absolute -top-1 -right-1 w-5 h-5 text-white text-xs font-bold rounded-full flex items-center justify-center ${
            urgentCount > 0 ? 'bg-red-500' : 'bg-indigo-600'
          }`}>
            {badgeCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-sm font-bold text-gray-900">Notifications</p>
          </div>

          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-gray-400 text-sm">You're all caught up! 🎉</p>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {notifications.map(notif => (
                <div
                  key={notif.id}
                  className={`px-4 py-3 border-b border-gray-50 last:border-b-0 ${
                    notif.urgent ? 'bg-red-50' : 'bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0">{notif.emoji}</span>
                    <div>
                      <p className={`text-sm font-bold ${notif.urgent ? 'text-red-700' : 'text-gray-800'}`}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}