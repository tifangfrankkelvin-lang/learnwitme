// src/pages/admin.tsx
// Admin-only page for adding lessons, questions, and solutions.
// Protected by checking isCurrentUserAdmin() on load.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, BookOpen, Trash2, Pencil, X, List, PlusCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { isCurrentUserAdmin } from '../lib/admin'
import Sidebar from '../components/Sidebar'

// Shape of a subject row, used to populate the subject dropdown
type Subject = {
  id: string
  name: string
}

// Shape of a topic row, used to populate the topic dropdown
type Topic = {
  id: string
  title: string
  subject_id: string
}

export default function Admin() {
  const navigate = useNavigate()

  // Access control state
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  // Dropdown data
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [topics, setTopics] = useState<Topic[]>([])

  // Form fields
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [selectedTopicId, setSelectedTopicId] = useState('')
  const [contentType, setContentType] = useState('LESSON')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [examType, setExamType] = useState('')
  const [examYear, setExamYear] = useState('')
  const [marks, setMarks] = useState('')
  const [difficulty, setDifficulty] = useState('INTERMEDIATE')
  const [isPublished, setIsPublished] = useState(true)

  // UI feedback
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  // Which tab: 'add' for the form, 'manage' for the list
  const [activeTab, setActiveTab] = useState<'add' | 'manage'>('add')

  // All content items fetched for the "Manage" tab
  const [allContent, setAllContent] = useState<any[]>([])
  const [loadingContent, setLoadingContent] = useState(false)

  // Tracks which content item is currently being edited (null = not editing)
  const [editingId, setEditingId] = useState<string | null>(null)

  // -------------------------------------------------------
  // On load: check admin access, then fetch subjects
  // -------------------------------------------------------
  useEffect(() => {
    async function init() {
      const admin = await isCurrentUserAdmin()
      setIsAdmin(admin)
      setCheckingAccess(false)

      if (!admin) return // don't bother fetching data if not admin

      const { data } = await supabase
        .from('subjects')
        .select('id, name')
        .order('sort_order', { ascending: true })

      if (data) setSubjects(data)
    }
    init()
  }, [])

  // -------------------------------------------------------
  // When a subject is selected, fetch its topics
  // -------------------------------------------------------
  useEffect(() => {
    async function loadTopics() {
      if (!selectedSubjectId) {
        setTopics([])
        return
      }
      const { data } = await supabase
        .from('topics')
        .select('id, title, subject_id')
        .eq('subject_id', selectedSubjectId)
        .order('sort_order', { ascending: true })

      if (data) setTopics(data)
    }
    loadTopics()
  }, [selectedSubjectId])
  // -------------------------------------------------------
  // Fetch all content when switching to the Manage tab
  // We join with topics and subjects so we can show
  // "Mathematics > Algebra > Quadratic Equations" style breadcrumbs
  // -------------------------------------------------------
  useEffect(() => {
    if (activeTab === 'manage') {
      loadAllContent()
    }
  }, [activeTab])

  async function loadAllContent() {
    setLoadingContent(true)
    const { data, error } = await supabase
      .from('content')
      .select(`
        id,
        title,
        content_type,
        difficulty,
        exam_type,
        exam_year,
        marks,
        body,
        is_published,
        topic_id,
        topics (
          id,
          title,
          subject_id,
          subjects (
            id,
            name
          )
        )
      `)
      .order('created_at', { ascending: false }) // newest first

    if (error) {
      console.error('Error loading content:', error)
    } else if (data) {
      setAllContent(data)
    }
    setLoadingContent(false)
  }

  // -------------------------------------------------------
  // Delete a content item
  // -------------------------------------------------------
  async function handleDelete(id: string, title: string) {
    // Always confirm before deleting — this is permanent
    const confirmed = window.confirm(`Delete "${title}"? This cannot be undone.`)
    if (!confirmed) return

    const { error } = await supabase.from('content').delete().eq('id', id)

    if (error) {
      alert('Error deleting content: ' + error.message)
      return
    }

    // Remove it from the local list immediately so the UI updates instantly
    setAllContent(prev => prev.filter(item => item.id !== id))
  }

  // -------------------------------------------------------
  // Load a content item into the form for editing
  // -------------------------------------------------------
  function handleStartEdit(item: any) {
    setEditingId(item.id)
    setSelectedSubjectId(item.topics?.subject_id || '')
    setSelectedTopicId(item.topic_id || '')
    setContentType(item.content_type)
    setTitle(item.title)
    setBody(item.body)
    setExamType(item.exam_type || '')
    setExamYear(item.exam_year ? String(item.exam_year) : '')
    setMarks(item.marks ? String(item.marks) : '')
    setDifficulty(item.difficulty)
    setIsPublished(item.is_published)
    setActiveTab('add') // switch to the form tab to show the editor
  }

  // -------------------------------------------------------
  // Save the content to Supabase
  // -------------------------------------------------------
  async function handleSave() {
    if (!selectedTopicId || !title || !body) {
      alert('Please fill in Topic, Title, and Content before saving.')
      return
    }

    setSaving(true)
    setSuccessMessage('')

    // Build the data object once — used for both insert and update
    const contentData = {
      topic_id: selectedTopicId,
      content_type: contentType,
      title,
      body,
      difficulty,
      exam_type: examType || null,
      exam_year: examYear ? parseInt(examYear) : null,
      marks: marks ? parseInt(marks) : null,
      is_published: isPublished,
      is_verified: true,
    }

    let error = null

    if (editingId) {
      // We're editing an existing item — UPDATE instead of INSERT
      const { error: updateError } = await supabase
        .from('content')
        .update(contentData)
        .eq('id', editingId)
      error = updateError
    } else {
      // Creating a brand new content item
      const { error: insertError } = await supabase
        .from('content')
        .insert(contentData)
      error = insertError
    }

    setSaving(false)

    if (error) {
      alert('Error saving content: ' + error.message)
      return
    }

    setSuccessMessage(editingId ? '✅ Content updated successfully!' : '✅ Content saved successfully!')

    // Reset form for next entry
    setTitle('')
    setBody('')
    setExamYear('')
    setMarks('')
    setEditingId(null) // exit edit mode

    // Refresh the manage list in the background so it's up to date
    // when the user switches back to that tab
    loadAllContent()
  }

  // -------------------------------------------------------
  // Cancel editing and reset the form
  // -------------------------------------------------------
  function handleCancelEdit() {
    setEditingId(null)
    setTitle('')
    setBody('')
    setExamYear('')
    setMarks('')
    setSuccessMessage('')
  }
  // -------------------------------------------------------
  // RENDER: Access control states
  // -------------------------------------------------------
  if (checkingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <p className="text-gray-700 font-medium">🚫 Access Denied</p>
        <p className="text-gray-400 text-sm">You don't have permission to view this page.</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-indigo-600 text-sm underline mt-2"
        >
          Back to Dashboard
        </button>
      </div>
    )
  }

  // -------------------------------------------------------
  // RENDER: The actual admin form
  // -------------------------------------------------------
 return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">

        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
              <BookOpen className="text-indigo-600" size={18} />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900">Content Manager</h1>
              <p className="text-xs text-gray-400">Admin only</p>
            </div>
          </div>
        </header>

        {/* Tab switcher: Add New vs Manage Content */}
        <div className="bg-white border-b border-gray-100 px-8">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('add')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200 ${
                activeTab === 'add'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <PlusCircle size={16} />
              {editingId ? 'Edit Content' : 'Add New'}
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200 ${
                activeTab === 'manage'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <List size={16} />
              Manage Content
              {allContent.length > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === 'manage' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {allContent.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ============ TAB: ADD / EDIT FORM ============ */}
        {activeTab === 'add' && (
          <div className="px-8 py-8 max-w-2xl">

            {successMessage && (
              <div className="bg-green-50 text-green-700 text-sm font-medium px-4 py-3 rounded-xl mb-6">
                {successMessage}
              </div>
            )}

            {editingId && (
              <div className="bg-amber-50 text-amber-700 text-sm font-medium px-4 py-3 rounded-xl mb-6 flex items-center justify-between">
                <span>✏️ Editing existing content</span>
                <button onClick={handleCancelEdit} className="flex items-center gap-1 text-amber-700 hover:text-amber-900">
                  <X size={14} /> Cancel
                </button>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-5">

              {/* Subject dropdown */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Subject</label>
                <select
                  value={selectedSubjectId}
                  onChange={e => setSelectedSubjectId(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-indigo-400"
                >
                  <option value="">Select a subject...</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Topic dropdown */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Topic</label>
                <select
                  value={selectedTopicId}
                  onChange={e => setSelectedTopicId(e.target.value)}
                  disabled={!selectedSubjectId}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-indigo-400 disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value="">Select a topic...</option>
                  {topics.map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>

              {/* Content type */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Content Type</label>
                <select
                  value={contentType}
                  onChange={e => setContentType(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-indigo-400"
                >
                  <option value="LESSON">Lesson</option>
                  <option value="REVISION_QUESTION">Revision Question</option>
                  <option value="PAST_QUESTION">Past Question</option>
                  <option value="SOLUTION">Solution</option>
                  <option value="SUMMARY">Summary</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Solving Quadratic Equations by Factorization"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-indigo-400"
                />
              </div>

              {/* Body content */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Content (Markdown supported)</label>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  rows={10}
                  placeholder="Write the lesson, question, or solution here..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-indigo-400 resize-none"
                />
              </div>

              {/* Row: Exam type + Exam year + Marks */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Exam Type</label>
                  <select
                    value={examType}
                    onChange={e => setExamType(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-indigo-400"
                  >
                    <option value="">N/A</option>
                    <option value="GCE_O_LEVEL">GCE O Level</option>
                    <option value="GCE_A_LEVEL">GCE A Level</option>
                    <option value="ENGINEERING_ENTRANCE">Engineering Entrance</option>
                    <option value="MEDICINE_ENTRANCE">Medicine Entrance</option>
                    <option value="TEACHERS_TRAINING">Teachers Training</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Exam Year</label>
                  <input
                    type="number"
                    value={examYear}
                    onChange={e => setExamYear(e.target.value)}
                    placeholder="2023"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-indigo-400"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Marks</label>
                  <input
                    type="number"
                    value={marks}
                    onChange={e => setMarks(e.target.value)}
                    placeholder="10"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-indigo-400"
                >
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>

              {/* Publish toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={e => setIsPublished(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600"
                />
                <span className="text-sm text-gray-700">Publish immediately (visible to students)</span>
              </label>

              {/* Save button */}
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 rounded-xl transition-colors duration-200 mt-2"
              >
                <Save size={18} />
                {saving ? 'Saving...' : editingId ? 'Update Content' : 'Save Content'}
              </button>

            </div>
          </div>
        )}

        {/* ============ TAB: MANAGE CONTENT LIST ============ */}
        {activeTab === 'manage' && (
          <div className="px-8 py-8 max-w-3xl">

            {loadingContent ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : allContent.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                  <BookOpen className="text-gray-400" size={24} />
                </div>
                <p className="text-gray-500 font-medium mb-1">No content yet</p>
                <p className="text-gray-400 text-sm">Switch to "Add New" to create your first lesson or question.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {allContent.map(item => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      {/* Breadcrumb: Subject > Topic */}
                      <p className="text-xs text-gray-400 mb-1">
                        {item.topics?.subjects?.name || 'Unknown subject'} → {item.topics?.title || 'Unknown topic'}
                      </p>
                      <h3 className="font-bold text-gray-900 text-sm truncate">{item.title}</h3>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                          {item.content_type.replace('_', ' ')}
                        </span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          item.is_published ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {item.is_published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                    </div>

                    {/* Edit / Delete actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleStartEdit(item)}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors duration-200"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.title)}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  )
}