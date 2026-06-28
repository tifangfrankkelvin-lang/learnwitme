// src/pages/settings.tsx
// Lets students update their exam type, enrolled subjects,
// and target year after initial onboarding.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Save } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'

const EXAM_TYPES = [
  { value: 'GCE_O_LEVEL',           label: 'GCE O Level',                emoji: '📘' },
  { value: 'GCE_A_LEVEL',           label: 'GCE A Level',                emoji: '📗' },
  { value: 'ENGINEERING_ENTRANCE',  label: 'Engineering Entrance',        emoji: '⚙️' },
  { value: 'MEDICINE_ENTRANCE',     label: 'Medicine Entrance',           emoji: '🩺' },
  { value: 'TEACHERS_TRAINING',     label: 'Teachers Training (ENS/ENSET)', emoji: '📚' },
  { value: 'BEPC',                  label: 'BEPC',                        emoji: '📝' },
  { value: 'PROBATOIRE',            label: 'Probatoire',                  emoji: '📝' },
  { value: 'BACCALAUREAT',          label: 'Baccalauréat',               emoji: '🎓' },
]

const SUBJECTS = [
  { code: 'MATH',  label: 'Mathematics',         emoji: '📐' },
  { code: 'PHY',   label: 'Physics',             emoji: '⚛️' },
  { code: 'CHEM',  label: 'Chemistry',           emoji: '🧪' },
  { code: 'BIO',   label: 'Biology',             emoji: '🧬' },
  { code: 'FMATH', label: 'Further Mathematics', emoji: '🔢' },
  { code: 'CS',    label: 'Computer Science',    emoji: '💻' },
]

const CURRENT_YEAR = new Date().getFullYear()
const TARGET_YEARS = [CURRENT_YEAR, CURRENT_YEAR + 1, CURRENT_YEAR + 2]

export default function Settings() {
  const navigate = useNavigate()
  const [userId, setUserId] = useState<string | null>(null)

  const [selectedExam, setSelectedExam] = useState('')
  const [selectedSubjectCodes, setSelectedSubjectCodes] = useState<string[]>([])
  const [targetYear, setTargetYear] = useState(CURRENT_YEAR)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    async function loadCurrentSettings() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        navigate('/')
        return
      }
      setUserId(session.user.id)

      // Fetch current enrollments, joined with subject codes
      const { data } = await supabase
        .from('user_enrollments')
        .select(`
          exam_type,
          target_year,
          subjects (
            code
          )
        `)
        .eq('user_id', session.user.id)
        .eq('is_active', true)

      if (data && data.length > 0) {
        setSelectedExam(data[0].exam_type)
        setTargetYear(data[0].target_year)
        setSelectedSubjectCodes(data.map((e: any) => e.subjects?.code).filter(Boolean))
      }

      setLoading(false)
    }

    loadCurrentSettings()
  }, [navigate])

  function toggleSubject(code: string) {
    setSelectedSubjectCodes(prev =>
      prev.includes(code) ? prev.filter(s => s !== code) : [...prev, code]
    )
  }

  // -------------------------------------------------------
  // Save updated settings — replaces all existing enrollments
  // with a fresh set based on current selections
  // -------------------------------------------------------
  async function handleSave() {
    if (!userId || !selectedExam || selectedSubjectCodes.length === 0) {
      alert('Please select an exam type and at least one subject.')
      return
    }

    setSaving(true)
    setSuccessMessage('')

    // Step 1: deactivate all existing enrollments
    // (simpler and safer than trying to diff add/remove individually)
    await supabase
      .from('user_enrollments')
      .update({ is_active: false })
      .eq('user_id', userId)

    // Step 2: look up subject UUIDs for the selected codes
    const { data: subjectRows } = await supabase
      .from('subjects')
      .select('id, code')
      .in('code', selectedSubjectCodes)

    if (subjectRows && subjectRows.length > 0) {
      // Step 3: upsert fresh enrollment rows for each selected subject
      const enrollments = subjectRows.map(subject => ({
        user_id: userId,
        exam_type: selectedExam,
        subject_id: subject.id,
        target_year: targetYear,
        is_active: true,
      }))

      await supabase
        .from('user_enrollments')
        .upsert(enrollments, { onConflict: 'user_id,exam_type,subject_id' })
    }

    setSaving(false)
    setSuccessMessage('✅ Settings updated successfully!')
  }

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

        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Study Settings</h1>
        </header>

        <div className="px-8 py-8 max-w-2xl">

          {successMessage && (
            <div className="bg-green-50 text-green-700 text-sm font-medium px-4 py-3 rounded-xl mb-6">
              {successMessage}
            </div>
          )}

          {/* Exam type */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
            <h2 className="text-sm font-bold text-gray-700 mb-4">Exam Type</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {EXAM_TYPES.map(exam => (
                <button
                  key={exam.value}
                  onClick={() => setSelectedExam(exam.value)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all duration-200 ${
                    selectedExam === exam.value
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 bg-white hover:border-indigo-300'
                  }`}
                >
                  <span className="text-xl">{exam.emoji}</span>
                  <span className={`text-sm font-medium ${selectedExam === exam.value ? 'text-indigo-700' : 'text-gray-700'}`}>
                    {exam.label}
                  </span>
                  {selectedExam === exam.value && <CheckCircle className="text-indigo-600 ml-auto" size={18} />}
                </button>
              ))}
            </div>
          </div>

          {/* Subjects */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
            <h2 className="text-sm font-bold text-gray-700 mb-4">Subjects</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SUBJECTS.map(subject => (
                <button
                  key={subject.code}
                  onClick={() => toggleSubject(subject.code)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 ${
                    selectedSubjectCodes.includes(subject.code)
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 bg-white hover:border-indigo-300'
                  }`}
                >
                  <span className="text-xl">{subject.emoji}</span>
                  <span className={`text-xs font-medium text-center ${
                    selectedSubjectCodes.includes(subject.code) ? 'text-indigo-700' : 'text-gray-700'
                  }`}>
                    {subject.label}
                  </span>
                  {selectedSubjectCodes.includes(subject.code) && <CheckCircle className="text-indigo-600" size={14} />}
                </button>
              ))}
            </div>
          </div>

          {/* Target year */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
            <h2 className="text-sm font-bold text-gray-700 mb-4">Target Year</h2>
            <div className="flex flex-col gap-2">
              {TARGET_YEARS.map(year => (
                <button
                  key={year}
                  onClick={() => setTargetYear(year)}
                  className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all duration-200 ${
                    targetYear === year
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 bg-white hover:border-indigo-300'
                  }`}
                >
                  <span className={`text-sm font-medium ${targetYear === year ? 'text-indigo-700' : 'text-gray-700'}`}>
                    {year}
                  </span>
                  {targetYear === year && <CheckCircle className="text-indigo-600" size={18} />}
                </button>
              ))}
            </div>
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 rounded-xl transition-colors duration-200 w-full"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>

        </div>
      </main>
    </div>
  )
}