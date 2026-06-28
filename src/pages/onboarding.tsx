// src/pages/Onboarding.tsx
// This is the onboarding flow for new students.
// It has 3 steps:
// Step 1 — Pick your exam type (GCE O Level, A Level, etc.)
// Step 2 — Pick your subjects (Math, Physics, etc.)
// Step 3 — Set your target year
// When done, it updates the profile in Supabase and redirects to the dashboard.

import { useState } from 'react'
// useState — lets us track which step we're on and what the student has selected

import { useNavigate } from 'react-router-dom'
import { BookOpen, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

// -------------------------------------------------------
// DATA: Exam types the student can choose from
// -------------------------------------------------------
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

// -------------------------------------------------------
// DATA: Subjects the student can choose from
// Each subject has a color for its icon background
// -------------------------------------------------------
const SUBJECTS = [
  { code: 'MATH',  label: 'Mathematics',         emoji: '📐', color: 'bg-indigo-50 text-indigo-600' },
  { code: 'PHY',   label: 'Physics',             emoji: '⚛️', color: 'bg-sky-50 text-sky-600' },
  { code: 'CHEM',  label: 'Chemistry',           emoji: '🧪', color: 'bg-green-50 text-green-600' },
  { code: 'BIO',   label: 'Biology',             emoji: '🧬', color: 'bg-yellow-50 text-yellow-600' },
  { code: 'FMATH', label: 'Further Mathematics', emoji: '🔢', color: 'bg-violet-50 text-violet-600' },
  { code: 'CS',    label: 'Computer Science',    emoji: '💻', color: 'bg-gray-50 text-gray-600' },
]

// -------------------------------------------------------
// Target years a student can pick from
// -------------------------------------------------------
const CURRENT_YEAR = new Date().getFullYear()
const TARGET_YEARS = [CURRENT_YEAR, CURRENT_YEAR + 1, CURRENT_YEAR + 2]

export default function Onboarding() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  // Track which step we're on (1, 2, or 3)
  const [step, setStep] = useState(1)

  // Track what the student has selected
  const [selectedExam, setSelectedExam] = useState('')
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [targetYear, setTargetYear] = useState(CURRENT_YEAR)
  const [loading, setLoading] = useState(false)

  // -------------------------------------------------------
  // Toggle a subject on or off when the student clicks it
  // -------------------------------------------------------
  function toggleSubject(code: string) {
    setSelectedSubjects(prev =>
      // If already selected, remove it. If not, add it.
      prev.includes(code) ? prev.filter(s => s !== code) : [...prev, code]
    )
  }

  // -------------------------------------------------------
  // Final step: save everything to Supabase
  // -------------------------------------------------------
  async function handleFinish() {
    if (!user) return
    setLoading(true)

    try {
      // 1. Mark onboarding as done in the profiles table
      await supabase
        .from('profiles')
        .update({ onboarding_done: true })
        .eq('id', user.id)

      // 2. Save each selected subject as an enrollment row
      // We look up each subject's UUID from the subjects table first
      const { data: subjectRows } = await supabase
        .from('subjects')
        .select('id, code')
        .in('code', selectedSubjects)

      if (subjectRows && subjectRows.length > 0) {
        // Build an array of enrollment objects to insert
        const enrollments = subjectRows.map(subject => ({
          user_id: user.id,
          exam_type: selectedExam,
          subject_id: subject.id,
          target_year: targetYear,
        }))

        await supabase.from('user_enrollments').insert(enrollments)
      }

      // 3. Redirect to dashboard
      navigate('/dashboard')
    } catch (error) {
      console.error('Onboarding error:', error)
    } finally {
      setLoading(false)
    }
  }

  // -------------------------------------------------------
  // RENDER
  // -------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Top navbar */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="flex items-center gap-2">
          <BookOpen className="text-indigo-600" size={24} />
          <span className="text-lg font-bold text-gray-900">
            Learn<span className="text-indigo-600">Wit</span>Me
          </span>
        </div>
      </nav>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">

          {/* Progress indicator — shows which step we're on */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors duration-200 ${
                  s === step
                    ? 'bg-indigo-600 text-white'        // Current step
                    : s < step
                    ? 'bg-green-500 text-white'          // Completed step
                    : 'bg-gray-200 text-gray-400'        // Future step
                }`}>
                  {s < step ? <CheckCircle size={16} /> : s}
                </div>
                {/* Line connecting steps */}
                {s < 3 && <div className={`w-16 h-1 rounded ${s < step ? 'bg-green-500' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          {/* ============ STEP 1: Pick Exam Type ============ */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
                What are you preparing for? 🎯
              </h2>
              <p className="text-gray-500 text-center mb-8">
                Select the exam you're currently studying for
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {EXAM_TYPES.map(exam => (
                  <button
                    key={exam.value}
                    onClick={() => setSelectedExam(exam.value)}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                      selectedExam === exam.value
                        ? 'border-indigo-600 bg-indigo-50'   // Selected style
                        : 'border-gray-200 bg-white hover:border-indigo-300'  // Default style
                    }`}
                  >
                    <span className="text-2xl">{exam.emoji}</span>
                    <span className={`font-medium ${selectedExam === exam.value ? 'text-indigo-700' : 'text-gray-700'}`}>
                      {exam.label}
                    </span>
                    {selectedExam === exam.value && (
                      <CheckCircle className="text-indigo-600 ml-auto" size={20} />
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!selectedExam}
                className="mt-8 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors duration-200"
              >
                Next — Pick your subjects <ArrowRight size={18} />
              </button>
              {/* disabled:bg-gray-300 — button turns grey if no exam is selected */}
            </div>
          )}

          {/* ============ STEP 2: Pick Subjects ============ */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
                Which subjects are you taking? 📚
              </h2>
              <p className="text-gray-500 text-center mb-8">
                Select all that apply — you can change this later
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {SUBJECTS.map(subject => (
                  <button
                    key={subject.code}
                    onClick={() => toggleSubject(subject.code)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                      selectedSubjects.includes(subject.code)
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 bg-white hover:border-indigo-300'
                    }`}
                  >
                    <span className="text-2xl">{subject.emoji}</span>
                    <span className={`text-sm font-medium text-center ${
                      selectedSubjects.includes(subject.code) ? 'text-indigo-700' : 'text-gray-700'
                    }`}>
                      {subject.label}
                    </span>
                    {selectedSubjects.includes(subject.code) && (
                      <CheckCircle className="text-indigo-600" size={16} />
                    )}
                  </button>
                ))}
              </div>

              {/* Show how many subjects are selected */}
              <p className="text-center text-sm text-gray-400 mt-4">
                {selectedSubjects.length} subject{selectedSubjects.length !== 1 ? 's' : ''} selected
              </p>

              <div className="flex gap-3 mt-8">
                {/* Back button */}
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-medium hover:border-gray-300 transition-colors duration-200"
                >
                  <ArrowLeft size={18} /> Back
                </button>
                {/* Next button */}
                <button
                  onClick={() => setStep(3)}
                  disabled={selectedSubjects.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors duration-200"
                >
                  Next — Set target year <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* ============ STEP 3: Set Target Year ============ */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
                When are you sitting the exam? 📅
              </h2>
              <p className="text-gray-500 text-center mb-8">
                This helps us tailor your study plan
              </p>

              <div className="flex flex-col gap-3">
                {TARGET_YEARS.map(year => (
                  <button
                    key={year}
                    onClick={() => setTargetYear(year)}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                      targetYear === year
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 bg-white hover:border-indigo-300'
                    }`}
                  >
                    <span className={`font-medium ${targetYear === year ? 'text-indigo-700' : 'text-gray-700'}`}>
                      {year} {year === CURRENT_YEAR ? '— This year' : year === CURRENT_YEAR + 1 ? '— Next year' : '— In 2 years'}
                    </span>
                    {targetYear === year && <CheckCircle className="text-indigo-600" size={20} />}
                  </button>
                ))}
              </div>

              {/* Summary of what they selected */}
              <div className="mt-6 p-4 bg-gray-100 rounded-xl text-sm text-gray-600">
                <p className="font-medium text-gray-700 mb-1">Your setup:</p>
                <p>📋 Exam: <span className="font-medium">{EXAM_TYPES.find(e => e.value === selectedExam)?.label}</span></p>
                <p>📚 Subjects: <span className="font-medium">{selectedSubjects.length} selected</span></p>
                <p>📅 Target year: <span className="font-medium">{targetYear}</span></p>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-medium hover:border-gray-300 transition-colors duration-200"
                >
                  <ArrowLeft size={18} /> Back
                </button>
                <button
                  onClick={handleFinish}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 rounded-xl transition-colors duration-200"
                >
                  {loading ? 'Setting up your account...' : 'Let\'s start learning! 🚀'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}