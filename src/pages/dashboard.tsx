import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Target, Calendar, ChevronRight, Brain, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import Sidebar from '../components/Sidebar'

const EXAM_LABELS: Record<string, string> = {
  GCE_O_LEVEL: 'GCE O Level',
  GCE_A_LEVEL: 'GCE A Level',
  ENGINEERING_ENTRANCE: 'Engineering Entrance',
  MEDICINE_ENTRANCE: 'Medicine Entrance',
  TEACHERS_TRAINING: 'Teachers Training',
  BEPC: 'BEPC',
  PROBATOIRE: 'Probatoire',
  BACCALAUREAT: 'Baccalaureat',
}

const SUBJECT_COLORS: Record<string, string> = {
  MATH: 'bg-indigo-50 border-indigo-200 text-indigo-700',
  PHY: 'bg-sky-50 border-sky-200 text-sky-700',
  CHEM: 'bg-green-50 border-green-200 text-green-700',
  BIO: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  FMATH: 'bg-violet-50 border-violet-200 text-violet-700',
  CS: 'bg-gray-50 border-gray-200 text-gray-700',

}

const SUBJECT_EMOJIS: Record<string, string> = {
  MATH: '📐', PHY: '⚛️', CHEM: '🧪', BIO: '🧬',
  ENG: '📖', FRE: '🗣️', HIST: '🏛️', GEO: '🌍',
  ECON: '📈', FMATH: '🔢', CS: '💻', LIT: '📜',
}

type Enrollment = {
  id: string
  exam_type: string
  target_year: number
  subjects: {
    id: string
    name: string
    code: string
  }
}

export default function Dashboard() {
  const { setUser, setSession } = useAuthStore()
  const navigate = useNavigate()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [profile, setProfile] = useState<{ full_name: string; avatar_url: string } | null>(null)
  const [loading, setLoading] = useState(true)
  // Tracks total completed items and total available items
  const [progressStats, setProgressStats] = useState({ completed: 0, total: 0 })

  useEffect(() => {
    async function loadDashboard() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        navigate('/')
        return
      }
      setUser(session.user)
      setSession(session)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', session.user.id)
        .single()
      if (profileData) setProfile(profileData)

      const { data: enrollmentData } = await supabase
        .from('user_enrollments')
        .select('id, exam_type, target_year, subjects(id, name, code)')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
     if (enrollmentData) setEnrollments(enrollmentData as unknown as Enrollment[])

      // Fetch total completed content items for this student
      const { count: completedCount } = await supabase
        .from('user_progress')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .eq('is_completed', true)

      // Fetch total published content items available across the app
      // (a simple global denominator for now — good enough for a v1 progress %)
      const { count: totalCount } = await supabase
        .from('content')
        .select('id', { count: 'exact', head: true })
        .eq('is_published', true)

      setProgressStats({
        completed: completedCount || 0,
        total: totalCount || 0,
      })

      setLoading(false)
    }

    loadDashboard()
  }, [navigate, setUser, setSession])

  const examType = enrollments[0]?.exam_type || ''
  const targetYear = enrollments[0]?.target_year || ''
  const today = new Date()
  const examDate = new Date(`${targetYear}-06-01`)
  const daysLeft = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Welcome back, {profile?.full_name?.split(' ')[0] || 'Student'}! 👋
            </h1>
            <p className="text-sm text-gray-500">Ready to study today?</p>
          </div>
          <div className="flex items-center gap-3">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Profile"
                className="w-10 h-10 rounded-full border-2 border-indigo-100"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-indigo-600 font-bold text-sm">
                  {profile?.full_name?.[0] || 'S'}
                </span>
              </div>
            )}
          </div>
        </header>

        <div className="px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
       <button onClick={() => navigate('/settings')} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4 hover:border-indigo-300 hover:shadow-md transition-all duration-200 text-left">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                <Target className="text-indigo-600" size={24} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Exam</p>
                <p className="text-sm font-bold text-gray-900">{EXAM_LABELS[examType] || examType}</p>
              </div>
            </button>
         <button onClick={() => navigate('/settings')} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4 hover:border-indigo-300 hover:shadow-md transition-all duration-200 text-left">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <BookOpen className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Subjects</p>
                <p className="text-sm font-bold text-gray-900">{enrollments.length} enrolled</p>
              </div>
            </button>
   <button onClick={() => navigate('/settings')} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4 hover:border-indigo-300 hover:shadow-md transition-all duration-200 text-left">
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                <Calendar className="text-orange-600" size={24} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Target Year</p>
                <p className="text-sm font-bold text-gray-900">
                  {targetYear} · {daysLeft > 0 ? `${daysLeft} days left` : 'Exam passed'}
                </p>
              </div>
            </button>

            {/* Progress card */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Progress</p>
                <p className="text-sm font-bold text-gray-900">
                  {progressStats.completed} / {progressStats.total} viewed
                </p>
              </div>
            </div>

          </div>

          <div className="bg-indigo-600 rounded-2xl p-6 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Brain className="text-white" size={24} />
              </div>
              <div>
                <p className="text-white font-bold text-lg">Ask your AI Tutor</p>
                <p className="text-indigo-200 text-sm">Get instant explanations on any topic</p>
              </div>
            </div>
            <button onClick={() => navigate('/ai-tutor')}
  className="flex items-center gap-2 bg-white text-indigo-600 font-semibold text-sm px-4 py-2 rounded-xl hover:bg-indigo-50 transition-colors duration-200"
>
  Start chatting <ChevronRight size={16} />
</button>
          </div>

          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Your Subjects</h2>
            {enrollments.length === 0 ? (
              <p className="text-gray-400 text-sm">No subjects enrolled yet.</p>
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
                      <p className="text-xs opacity-60 mt-1">Tap to start studying</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}