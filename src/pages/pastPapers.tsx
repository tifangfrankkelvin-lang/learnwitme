// src/pages/pastPapers.tsx
// Shows all past exam questions across every subject,
// grouped by subject for easy browsing.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'

type PastQuestion = {
  id: string
  title: string
  body: string
  exam_type: string | null
  exam_year: number | null
  marks: number | null
  topics: {
    title: string
    subjects: {
      name: string
    }
  }
}

export default function PastPapers() {
  const navigate = useNavigate()
  const [questions, setQuestions] = useState<PastQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedIds, setExpandedIds] = useState<string[]>([])

  useEffect(() => {
    async function loadPastPapers() {
      // Fetch every published PAST_QUESTION item, joined with
      // its topic and subject so we can show context
      const { data, error } = await supabase
        .from('content')
        .select(`
          id,
          title,
          body,
          exam_type,
          exam_year,
          marks,
          topics (
            title,
            subjects (
              name
            )
          )
        `)
        .eq('content_type', 'PAST_QUESTION')
        .eq('is_published', true)
        .order('exam_year', { ascending: false }) // newest exam year first

      if (error) {
        console.error('Error loading past papers:', error)
      } else if (data) {
        setQuestions(data as unknown as PastQuestion[])
      }
      setLoading(false)
    }

    loadPastPapers()
  }, [])

  function toggleExpand(id: string) {
    setExpandedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  // Group questions by subject name for a cleaner browsing experience
  const groupedBySubject = questions.reduce((groups: Record<string, PastQuestion[]>, q) => {
    const subjectName = q.topics?.subjects?.name || 'Other'
    if (!groups[subjectName]) groups[subjectName] = []
    groups[subjectName].push(q)
    return groups
  }, {})

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
            <h1 className="text-lg font-bold text-gray-900">Past Papers</h1>
            <p className="text-xs text-gray-400">{questions.length} questions available</p>
          </div>
        </header>

        {/* Content */}
        <div className="px-8 py-8 max-w-3xl">
          {questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <FileText className="text-gray-400" size={24} />
              </div>
              <p className="text-gray-500 font-medium mb-1">No past papers yet</p>
              <p className="text-gray-400 text-sm">Check back soon — we're adding past exam questions regularly.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {Object.entries(groupedBySubject).map(([subjectName, items]) => (
                <div key={subjectName}>
                  <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">{subjectName}</h2>
                  <div className="flex flex-col gap-3">
                    {items.map(item => {
                      const isExpanded = expandedIds.includes(item.id)
                      return (
                        <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                          <button
                            onClick={() => toggleExpand(item.id)}
                            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors duration-150"
                          >
                            <div>
                              <p className="text-xs text-gray-400 mb-0.5">{item.topics?.title}</p>
                              <h3 className="font-bold text-gray-900 text-sm">{item.title}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                {item.exam_year && <span className="text-xs text-gray-400">📅 {item.exam_year}</span>}
                                {item.marks && <span className="text-xs text-gray-400">✏️ {item.marks} marks</span>}
                              </div>
                            </div>
                            {isExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                          </button>
                          {isExpanded && (
                            <div className="px-5 py-4 border-t border-gray-50 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                              {item.body}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}