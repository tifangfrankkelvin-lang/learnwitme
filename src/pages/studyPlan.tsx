// src/pages/studyPlan.tsx
// Lets students build a simple weekly study schedule.
// Stored as JSON in the study_plans table's plan_data column —
// flexible enough to evolve without database migrations later.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, CheckCircle2, Circle, Calendar } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'

// Shape of a single study task within the plan
type StudyTask = {
  id: string
  day: string        // e.g. "Monday"
  subject: string    // e.g. "Mathematics"
  note: string        // e.g. "Review quadratic equations"
  done: boolean
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const SUBJECT_OPTIONS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Further Mathematics', 'Computer Science']

export default function StudyPlan() {
  const navigate = useNavigate()
  const [userId, setUserId] = useState<string | null>(null)
  const [planId, setPlanId] = useState<string | null>(null)
  const [tasks, setTasks] = useState<StudyTask[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // New task form fields
  const [newDay, setNewDay] = useState('Monday')
  const [newSubject, setNewSubject] = useState('Mathematics')
  const [newNote, setNewNote] = useState('')

  useEffect(() => {
    async function loadPlan() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        navigate('/')
        return
      }
      setUserId(session.user.id)

      // Look for an existing active study plan
      const { data } = await supabase
        .from('study_plans')
        .select('id, plan_data')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle()

      if (data) {
        setPlanId(data.id)
        // plan_data.tasks holds our array of study tasks
        setTasks(data.plan_data?.tasks || [])
      }

      setLoading(false)
    }

    loadPlan()
  }, [navigate])

  // -------------------------------------------------------
  // Save the current tasks array back to Supabase.
  // Creates a new plan row if none exists yet, otherwise updates it.
  // -------------------------------------------------------
  async function savePlan(updatedTasks: StudyTask[]) {
    if (!userId) return
    setSaving(true)

    if (planId) {
      await supabase
        .from('study_plans')
        .update({ plan_data: { tasks: updatedTasks } })
        .eq('id', planId)
    } else {
      const { data } = await supabase
        .from('study_plans')
        .insert({
          user_id: userId,
          title: 'My Weekly Study Plan',
          plan_data: { tasks: updatedTasks },
          is_ai_generated: false,
          is_active: true,
        })
        .select('id')
        .single()

      if (data) setPlanId(data.id)
    }

    setSaving(false)
  }

  // -------------------------------------------------------
  // Add a new task to the plan
  // -------------------------------------------------------
  async function handleAddTask() {
    if (!newNote.trim()) {
      alert('Please add a short note about what to study.')
      return
    }

    const newTask: StudyTask = {
      id: Date.now().toString(),
      day: newDay,
      subject: newSubject,
      note: newNote.trim(),
      done: false,
    }

    const updatedTasks = [...tasks, newTask]
    setTasks(updatedTasks)
    setNewNote('')
    await savePlan(updatedTasks)
  }

  // -------------------------------------------------------
  // Toggle a task's done status
  // -------------------------------------------------------
  async function toggleTaskDone(taskId: string) {
    const updatedTasks = tasks.map(t =>
      t.id === taskId ? { ...t, done: !t.done } : t
    )
    setTasks(updatedTasks)
    await savePlan(updatedTasks)
  }

  // -------------------------------------------------------
  // Remove a task from the plan
  // -------------------------------------------------------
  async function removeTask(taskId: string) {
    const updatedTasks = tasks.filter(t => t.id !== taskId)
    setTasks(updatedTasks)
    await savePlan(updatedTasks)
  }

  // Group tasks by day for a clean weekly view
  const tasksByDay = DAYS.map(day => ({
    day,
    tasks: tasks.filter(t => t.day === day),
  }))

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
              <Calendar className="text-indigo-600" size={18} />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900">My Study Plan</h1>
              <p className="text-xs text-gray-400">{tasks.filter(t => t.done).length} / {tasks.length} tasks done</p>
            </div>
          </div>
        </header>

        <div className="px-8 py-8 max-w-2xl">

          {/* Add task form */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
            <h2 className="text-sm font-bold text-gray-700 mb-3">Add a study task</h2>
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={newDay}
                  onChange={e => setNewDay(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-indigo-400"
                >
                  {DAYS.map(day => <option key={day} value={day}>{day}</option>)}
                </select>
                <select
                  value={newSubject}
                  onChange={e => setNewSubject(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-indigo-400"
                >
                  {SUBJECT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  placeholder="e.g. Review quadratic equations"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-indigo-400"
                />
                <button
                  onClick={handleAddTask}
                  disabled={saving}
                  className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors duration-200"
                >
                  <Plus size={16} /> Add
                </button>
              </div>
            </div>
          </div>

          {/* Weekly schedule */}
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <Calendar className="text-gray-400" size={24} />
              </div>
              <p className="text-gray-500 font-medium mb-1">No study tasks yet</p>
              <p className="text-gray-400 text-sm">Add your first task above to build your weekly plan.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {tasksByDay.map(({ day, tasks: dayTasks }) => (
                dayTasks.length > 0 && (
                  <div key={day}>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">{day}</h3>
                    <div className="flex flex-col gap-2">
                      {dayTasks.map(task => (
                        <div
                          key={task.id}
                          className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-3"
                        >
                          <button onClick={() => toggleTaskDone(task.id)} className="flex-shrink-0">
                            {task.done ? (
                              <CheckCircle2 className="text-green-500" size={20} />
                            ) : (
                              <Circle className="text-gray-300" size={20} />
                            )}
                          </button>
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${task.done ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                              {task.note}
                            </p>
                            <p className="text-xs text-gray-400">{task.subject}</p>
                          </div>
                          <button
                            onClick={() => removeTask(task.id)}
                            className="text-gray-300 hover:text-red-500 transition-colors duration-200 flex-shrink-0"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  )
}