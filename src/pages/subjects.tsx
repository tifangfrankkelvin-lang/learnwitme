// src/pages/subjects.tsx
// Shows all subjects the student is enrolled in — a dedicated
// full page version of the subject cards on the dashboard.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronRight, BookOpen } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'

// Subject visual styling — same mapping used on the dashboard
const SUBJECT_COLORS: Record<string, string> = {
  MATH:  'bg-indigo-50 border-indigo-200 text-indigo-700',
  PHY:   'bg-sky-50 border-sky-200 text-sky-700',
  CHEM:  'bg-green-50 border-green-200 text-green-700',
  BIO:   'bg-yellow-50 border-yellow-200 text-yellow-700',
  FMATH: 'bg-violet-50 border-violet-200 text-violet-700',
  CS:    'bg-gray-50 border-gray-200 text-gray-700',
}

const SUBJECT_EMOJIS: Record<string, string> = {
  MATH: '📐', PHY: '⚛️', CHEM: '🧪', BIO: '🧬', FMATH: '🔢', CS: '💻',
}

// Shape of an enrollment row, joined with its subject
type Enrollment = {
  id: string
  subjects: {
    id: string
    name: string
    code: string
  }
}

export default function Subjects() {
  const navigate = useNavigate()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadEnrollments() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        navigate('/')
        return
      }

      const { data } = await supabase
        .from('user_enrollments')
        .select(`
          id,
          subjects (
            id,
            name,
            code
          )
        `)
        .eq('user_id', session.user.id)
        .eq('is_active', true)

      if (data) setEnrollments(data as unknown as Enrollment[])
      setLoading(false)
    }

    loadEnrollments()
  }, [navigate])

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">

        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">My Subjects</h1>
            <p className="text-xs text-gray-400">{enrollments.length} enrolled</p>
          </div>
        </header>

        {/* Subject list */}
        <div className="px-8 py-8">
          {enrollments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <BookOpen className="text-gray-400" size={24} />
              </div>
              <p className="text-gray-500 font-medium mb-1">No subjects enrolled</p>
              <p className="text-gray-400 text-sm">Complete onboarding to pick your subjects.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {enrollments.map(enrollment => {
                const code = enrollment.subjects?.code || ''
                const colorClass = SUBJECT_COLORS[code] || 'bg-gray-50 border-gray-200 text-gray-700'
                const emoji = SUBJECT_EMOJIS[code] || '📚'

                return (
                  <div
                    key={enrollment.id}
                    onClick={() => navigate(`/subjects/${enrollment.subjects?.id}`)}
                    className={`rounded-2xl p-5 border-2 ${colorClass} cursor-pointer hover:shadow-md transition-shadow duration-200`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl">{emoji}</span>
                      <ChevronRight size={18} className="opacity-50" />
                    </div>
                    <h3 className="font-bold text-base">{enrollment.subjects?.name}</h3>
                    <p className="text-xs opacity-60 mt-1">Tap to view topics</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}