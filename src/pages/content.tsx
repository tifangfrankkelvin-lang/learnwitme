// src/pages/content.tsx
// Shows all content (lessons, questions, past papers, summaries) for a topic.
// Students can switch between tabs to filter by content type,
// and bookmark any item for quick access later.

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, FileText, CheckSquare, FileCheck, ChevronDown, ChevronUp, Bookmark, BookmarkCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'

// Shape of a content row from our database
type ContentItem = {
  id: string
  content_type: string
  title: string
  body: string
  difficulty: string
  exam_type: string | null
  exam_year: number | null
  marks: number | null
}

// Shape of the topic we're viewing content for
type TopicInfo = {
  id: string
  title: string
  parent_id: string | null
}

// Shape of a sub-topic card shown at the top of the page
type SubTopic = {
  id: string
  title: string
  difficulty: string
}

// The 4 tabs students can switch between
const TABS = [
  { type: 'LESSON',            label: 'Lessons',           icon: BookOpen },
  { type: 'REVISION_QUESTION', label: 'Revision Questions', icon: CheckSquare },
  { type: 'PAST_QUESTION',     label: 'Past Questions',     icon: FileText },
  { type: 'SUMMARY',           label: 'Summary',            icon: FileCheck },
]

const DIFFICULTY_STYLES: Record<string, string> = {
  BEGINNER:     'bg-green-50 text-green-600',
  INTERMEDIATE: 'bg-yellow-50 text-yellow-600',
  ADVANCED:     'bg-red-50 text-red-600',
}

export default function ContentPage() {
  const navigate = useNavigate()
  const { topicId } = useParams() // grabs :topicId from the URL

  const [topic, setTopic] = useState<TopicInfo | null>(null)
  const [subTopics, setSubTopics] = useState<SubTopic[]>([])
  const [allContent, setAllContent] = useState<ContentItem[]>([])
  const [activeTab, setActiveTab] = useState('LESSON')
  const [loading, setLoading] = useState(true)

  // Tracks which question cards are expanded to show their solution
  const [expandedIds, setExpandedIds] = useState<string[]>([])

  // Tracks which content IDs are bookmarked by the current user
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([])
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    async function loadContent() {
      if (!topicId) return

      // Get the current user — needed to check/save bookmarks
      const { data: { session } } = await supabase.auth.getSession()
      if (session) setUserId(session.user.id)

  // Fetch the topic name for the header
      const { data: topicData } = await supabase
        .from('topics')
        .select('id, title, parent_id')
        .eq('id', topicId)
        .single()

      if (topicData) setTopic(topicData)

      // If this topic has no parent (i.e. it IS a parent topic),
      // fetch its sub-topics to show as cards
      if (topicData && topicData.parent_id === null) {
        const { data: subTopicsData } = await supabase
          .from('topics')
          .select('id, title, difficulty')
          .eq('parent_id', topicId)
          .eq('is_active', true)
          .order('sort_order', { ascending: true })

        if (subTopicsData) setSubTopics(subTopicsData)
      }

      // Fetch all published content for this topic
      const { data: contentData } = await supabase
        .from('content')
        .select('id, content_type, title, body, difficulty, exam_type, exam_year, marks')
        .eq('topic_id', topicId)
        .eq('is_published', true)
        .order('created_at', { ascending: true })

      if (contentData) setAllContent(contentData)

      // Fetch this user's bookmarks so we know which cards to mark as saved
      if (session) {
        const { data: bookmarkData } = await supabase
          .from('bookmarks')
          .select('content_id')
          .eq('user_id', session.user.id)

        if (bookmarkData) {
          setBookmarkedIds(bookmarkData.map(b => b.content_id))
        }
      }

      setLoading(false)
    }

    loadContent()
  }, [topicId])

  // -------------------------------------------------------
  // Toggle a bookmark on or off for a content item
  // -------------------------------------------------------
  async function toggleBookmark(contentId: string) {
    if (!userId) return

    const isBookmarked = bookmarkedIds.includes(contentId)

    if (isBookmarked) {
      await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', userId)
        .eq('content_id', contentId)

      setBookmarkedIds(prev => prev.filter(id => id !== contentId))
    } else {
      await supabase
        .from('bookmarks')
        .insert({ user_id: userId, content_id: contentId })

      setBookmarkedIds(prev => [...prev, contentId])
    }
  }

  // Filter content based on which tab is active
  const filteredContent = allContent.filter(item => item.content_type === activeTab)

  // Toggle whether a question's solution is expanded
  function toggleExpand(id: string) {
    const isCurrentlyExpanded = expandedIds.includes(id)
    setExpandedIds(prev =>
      isCurrentlyExpanded ? prev.filter(i => i !== id) : [...prev, id]
    )

    // Only log progress when OPENING (not closing) a card,
    // and only if we have a logged-in user
    if (!isCurrentlyExpanded && userId && topicId) {
      logProgress(id)
    }
  }

  // -------------------------------------------------------
  // Record that the student viewed this content item.
  // Uses upsert so repeated views don't create duplicate rows —
  // the UNIQUE(user_id, content_id) constraint we set in the
  // database schema handles that automatically.
  // -------------------------------------------------------
  async function logProgress(contentId: string) {
    await supabase
      .from('user_progress')
      .upsert(
        {
          user_id: userId,
          content_id: contentId,
          topic_id: topicId,
          is_completed: true, // viewing counts as "completed" for now — simple v1 definition
          last_accessed: new Date().toISOString(),
        },
        { onConflict: 'user_id,content_id' } // if it already exists, update instead of erroring
      )
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

        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-gray-900">{topic?.title || 'Topic'}</h1>
        </header>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-100 px-8">
          <div className="flex gap-1">
            {TABS.map(tab => {
              const Icon = tab.icon
              const count = allContent.filter(c => c.content_type === tab.type).length
              const isActive = activeTab === tab.type

              return (
                <button
                  key={tab.type}
                  onClick={() => setActiveTab(tab.type)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200 ${
                    isActive
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                  {count > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

  {/* Sub-topics — only shown if this topic has any */}
        {subTopics.length > 0 && (
          <div className="px-8 pt-6 pb-2 max-w-3xl">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Sub-topics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {subTopics.map(sub => (
                <button
                  key={sub.id}
                  onClick={() => navigate(`/topics/${sub.id}/content`)}
                  className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:border-indigo-300 hover:shadow-sm transition-all duration-200 text-left"
                >
                  <span className="text-sm font-medium text-gray-700">{sub.title}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${DIFFICULTY_STYLES[sub.difficulty]}`}>
                    {sub.difficulty}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content list */}
        <div className="px-8 py-8 max-w-3xl">

          {filteredContent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <BookOpen className="text-gray-400" size={24} />
              </div>
              <p className="text-gray-500 font-medium mb-1">Nothing here yet</p>
              <p className="text-gray-400 text-sm">
                We're still adding {TABS.find(t => t.type === activeTab)?.label.toLowerCase()} for this topic.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filteredContent.map(item => {
                const isExpanded = expandedIds.includes(item.id)
                const isBookmarked = bookmarkedIds.includes(item.id)

                return (
                  <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                    {/* Card header — always visible */}
                    <div className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors duration-150">
                      <button
                        onClick={() => toggleExpand(item.id)}
                        className="flex-1 text-left"
                      >
                        <h3 className="font-bold text-gray-900 text-sm mb-1">{item.title}</h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          {item.difficulty && (
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${DIFFICULTY_STYLES[item.difficulty]}`}>
                              {item.difficulty}
                            </span>
                          )}
                          {item.exam_year && (
                            <span className="text-xs text-gray-400">📅 {item.exam_year}</span>
                          )}
                          {item.marks && (
                            <span className="text-xs text-gray-400">✏️ {item.marks} marks</span>
                          )}
                        </div>
                      </button>

                      {/* Bookmark button */}
                      <button
                        onClick={() => toggleBookmark(item.id)}
                        className={`p-2 rounded-lg transition-colors duration-200 flex-shrink-0 ${
                          isBookmarked ? 'text-indigo-600' : 'text-gray-300 hover:text-gray-400'
                        }`}
                        title={isBookmarked ? 'Remove bookmark' : 'Save for later'}
                      >
                        {isBookmarked ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                      </button>

                      {/* Expand/collapse toggle */}
                      <button onClick={() => toggleExpand(item.id)} className="p-2 flex-shrink-0">
                        {isExpanded ? (
                          <ChevronUp size={18} className="text-gray-400" />
                        ) : (
                          <ChevronDown size={18} className="text-gray-400" />
                        )}
                      </button>
                    </div>

                    {/* Card body — only shown when expanded */}
                    {isExpanded && (
                      <div className="px-5 py-4 border-t border-gray-50 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {item.body}
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