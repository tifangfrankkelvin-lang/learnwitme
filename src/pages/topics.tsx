// src/pages/topics.tsx
// This page shows all topics for a specific subject.
// Topics are hierarchical — parent topics (e.g. Algebra) contain
// sub-topics (e.g. Quadratic Equations). We group them visually.

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
// useParams — reads the subject ID from the URL (e.g. /subjects/:subjectId)

import { ArrowLeft, ChevronRight, BookOpen } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'

// Shape of a topic row from our database
type Topic = {
  id: string
  title: string
  slug: string
  difficulty: string
  parent_id: string | null
}

// Shape of the subject we're viewing topics for
type Subject = {
  id: string
  name: string
  color_hex: string
}

// Colors for difficulty badges
const DIFFICULTY_STYLES: Record<string, string> = {
  BEGINNER:     'bg-green-50 text-green-600',
  INTERMEDIATE: 'bg-yellow-50 text-yellow-600',
  ADVANCED:     'bg-red-50 text-red-600',
}

export default function Topics() {
  const navigate = useNavigate()
  const { subjectId } = useParams() // grabs :subjectId from the URL

  const [subject, setSubject] = useState<Subject | null>(null)
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTopics() {
      if (!subjectId) return

      // Fetch the subject details (name, color) to show in the header
      const { data: subjectData } = await supabase
        .from('subjects')
        .select('id, name, color_hex')
        .eq('id', subjectId)
        .single()

      if (subjectData) setSubject(subjectData)

      // Fetch all topics belonging to this subject
      // Ordered by sort_order so they appear in a logical sequence
      const { data: topicsData } = await supabase
        .from('topics')
        .select('id, title, slug, difficulty, parent_id')
        .eq('subject_id', subjectId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (topicsData) setTopics(topicsData)
      setLoading(false)
    }

    loadTopics()
  }, [subjectId])

  // Separate parent topics (no parent_id) from sub-topics (have a parent_id)
  // This lets us group sub-topics under their parent visually
  const parentTopics = topics.filter(t => t.parent_id === null)
  const getSubTopics = (parentId: string) => topics.filter(t => t.parent_id === parentId)

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
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{subject?.name || 'Subject'}</h1>
            <p className="text-xs text-gray-400">{parentTopics.length} topics to master</p>
          </div>
        </header>

        {/* Topics list */}
        <div className="px-8 py-8 max-w-3xl">

          {parentTopics.length === 0 ? (
            <p className="text-gray-400 text-sm">No topics available yet for this subject.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {parentTopics.map(parent => {
                const subTopics = getSubTopics(parent.id)

                return (
                  <div key={parent.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                   {/* Parent topic header — clickable, links to its own content page */}
                    <button
                      onClick={() => navigate(`/topics/${parent.id}/content`)}
                      className="w-full flex items-center justify-between px-5 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors duration-150 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center">
                          <BookOpen className="text-indigo-600" size={18} />
                        </div>
                        <h3 className="font-bold text-gray-900">{parent.title}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${DIFFICULTY_STYLES[parent.difficulty]}`}>
                          {parent.difficulty}
                        </span>
                        <ChevronRight size={16} className="text-gray-300" />
                      </div>
                    </button>

                    {/* Sub-topics list — only shown if there are any */}
                    {subTopics.length > 0 && (
                      <div className="flex flex-col">
                        {subTopics.map(sub => (
                          <button
                            key={sub.id}
                            onClick={() => navigate(`/topics/${sub.id}/content`)}
                            className="flex items-center justify-between px-5 py-3 pl-16 hover:bg-gray-50 transition-colors duration-150 text-left border-b border-gray-50 last:border-b-0"
                          >
                            <span className="text-sm text-gray-600">{sub.title}</span>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${DIFFICULTY_STYLES[sub.difficulty]}`}>
                                {sub.difficulty}
                              </span>
                              <ChevronRight size={16} className="text-gray-300" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

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