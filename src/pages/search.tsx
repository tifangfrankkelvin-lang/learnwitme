// src/pages/search.tsx
// Lets students search across subjects, topics, and content
// (lessons, questions, past papers) by keyword.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search as SearchIcon, BookOpen, FileText, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'

// Shape of a topic search result
type TopicResult = {
  id: string
  title: string
  subject_id: string
  subjects: { name: string }
}

// Shape of a content search result
type ContentResult = {
  id: string
  title: string
  content_type: string
  topic_id: string
  topics: { title: string }
}

export default function SearchPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [topicResults, setTopicResults] = useState<TopicResult[]>([])
  const [contentResults, setContentResults] = useState<ContentResult[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // -------------------------------------------------------
  // Run the search across topics and content tables
  // -------------------------------------------------------
  async function handleSearch(searchTerm: string) {
    setQuery(searchTerm)

    if (!searchTerm.trim()) {
      setTopicResults([])
      setContentResults([])
      setHasSearched(false)
      return
    }

    setLoading(true)
    setHasSearched(true)

    // Search topics by title — case-insensitive partial match
    const { data: topics } = await supabase
      .from('topics')
      .select('id, title, subject_id, subjects(name)')
      .ilike('title', `%${searchTerm}%`)
      .eq('is_active', true)
      .limit(10)

    // Search content by title — only published items
    const { data: content } = await supabase
      .from('content')
      .select('id, title, content_type, topic_id, topics(title)')
      .ilike('title', `%${searchTerm}%`)
      .eq('is_published', true)
      .limit(10)

    if (topics) setTopicResults(topics as unknown as TopicResult[])
    if (content) setContentResults(content as unknown as ContentResult[])
    setLoading(false)
  }

  function clearSearch() {
    setQuery('')
    setTopicResults([])
    setContentResults([])
    setHasSearched(false)
  }

  const noResults = hasSearched && !loading && topicResults.length === 0 && contentResults.length === 0

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">

        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Search</h1>
        </header>

        {/* Search bar */}
        <div className="px-8 py-6 max-w-2xl">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={query}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search topics, lessons, questions..."
              autoFocus
              className="w-full bg-white border border-gray-200 rounded-xl pl-11 pr-10 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-indigo-400"
            />
            {query && (
              <button
                onClick={clearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="px-8 pb-8 max-w-2xl">

          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {noResults && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <SearchIcon className="text-gray-400" size={24} />
              </div>
              <p className="text-gray-500 font-medium mb-1">No results for "{query}"</p>
              <p className="text-gray-400 text-sm">Try a different keyword or check your spelling.</p>
            </div>
          )}

          {!loading && topicResults.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Topics</h2>
              <div className="flex flex-col gap-2">
                {topicResults.map(topic => (
                  <button
                    key={topic.id}
                    onClick={() => navigate(`/topics/${topic.id}/content`)}
                    className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-3 hover:border-indigo-300 hover:shadow-sm transition-all duration-200 text-left"
                  >
                    <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BookOpen className="text-indigo-600" size={16} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">{topic.subjects?.name}</p>
                      <p className="text-sm font-medium text-gray-800">{topic.title}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!loading && contentResults.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Lessons & Questions</h2>
              <div className="flex flex-col gap-2">
                {contentResults.map(item => (
                  <button
                    key={item.id}
                    onClick={() => navigate(`/topics/${item.topic_id}/content`)}
                    className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-3 hover:border-indigo-300 hover:shadow-sm transition-all duration-200 text-left"
                  >
                    <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="text-green-600" size={16} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">{item.topics?.title} · {item.content_type.replace('_', ' ')}</p>
                      <p className="text-sm font-medium text-gray-800">{item.title}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}