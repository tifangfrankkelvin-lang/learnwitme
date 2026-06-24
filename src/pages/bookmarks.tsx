// src/pages/bookmarks.tsx
// Shows all content the student has bookmarked, with a quick
// link back to the topic it belongs to.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Bookmark, BookmarkX, BookOpen, FileText, CheckSquare, FileCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'

// Icons for each content type — same idea as the tabs in content.tsx
const TYPE_ICONS: Record<string, any> = {
  LESSON: BookOpen,
  REVISION_QUESTION: CheckSquare,
  PAST_QUESTION: FileText,
  SUMMARY: FileCheck,
  SOLUTION: FileCheck,
}

const DIFFICULTY_STYLES: Record<string, string> = {
  BEGINNER:     'bg-green-50 text-green-600',
  INTERMEDIATE: 'bg-yellow-50 text-yellow-600',
  ADVANCED:     'bg-red-50 text-red-600',
}

// Shape of a bookmark row joined with its content + topic info
type BookmarkItem = {
  id: string // bookmark id
  content_id: string
  note: string | null
  content: {
    id: string
    title: string
    content_type: string
    difficulty: string
    topic_id: string
    topics: {
      id: string
      title: string
    }
  }
}

export default function Bookmarks() {
  const navigate = useNavigate()
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadBookmarks() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        navigate('/')
        return
      }

      // Fetch all bookmarks for this user, joined with the
      // content item and its parent topic
      const { data, error } = await supabase
        .from('bookmarks')
        .select(`
          id,
          content_id,
          note,
          content (
            id,
            title,
            content_type,
            difficulty,
            topic_id,
            topics (
              id,
              title
            )
          )
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false }) // newest bookmarks first

      if (error) {
        console.error('Error loading bookmarks:', error)
      } else if (data) {
        setBookmarks(data as unknown as BookmarkItem[])
      }
      setLoading(false)
    }

    loadBookmarks()
  }, [navigate])

  // -------------------------------------------------------
  // Remove a bookmark directly from this page
  // -------------------------------------------------------
  async function removeBookmark(bookmarkId: string) {
    await supabase.from('bookmarks').delete().eq('id', bookmarkId)
    // Update the UI immediately without needing to refetch everything
    setBookmarks(prev => prev.filter(b => b.id !== bookmarkId))
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
          <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Bookmark className="text-indigo-600" size={18} />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900">Your Bookmarks</h1>
              <p className="text-xs text-gray-400">{bookmarks.length} saved item{bookmarks.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </header>

        {/* Bookmark list */}
        <div className="px-8 py-8 max-w-3xl">

          {bookmarks.length === 0 ? (
            // Empty state — no bookmarks yet
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <Bookmark className="text-gray-400" size={24} />
              </div>
              <p className="text-gray-500 font-medium mb-1">No bookmarks yet</p>
              <p className="text-gray-400 text-sm">
                Tap the bookmark icon on any lesson or question to save it here.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {bookmarks.map(bookmark => {
                const content = bookmark.content
                if (!content) return null // safety check in case content was deleted

                const Icon = TYPE_ICONS[content.content_type] || BookOpen

                return (
                  <div
                    key={bookmark.id}
                    className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between gap-4"
                  >
                    {/* Clicking the main area navigates to that topic's content */}
                    <button
                      onClick={() => navigate(`/topics/${content.topic_id}/content`)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left"
                    >
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon className="text-indigo-600" size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-400 mb-0.5">{content.topics?.title}</p>
                        <h3 className="font-bold text-gray-900 text-sm truncate">{content.title}</h3>
                        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${DIFFICULTY_STYLES[content.difficulty]}`}>
                          {content.difficulty}
                        </span>
                      </div>
                    </button>

                    {/* Remove bookmark button */}
                    <button
                      onClick={() => removeBookmark(bookmark.id)}
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors duration-200 flex-shrink-0"
                      title="Remove bookmark"
                    >
                      <BookmarkX size={16} />
                    </button>
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