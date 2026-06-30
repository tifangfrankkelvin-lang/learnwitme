// src/lib/notifications.ts
// Generates in-app notifications based on the student's
// current data — exam countdown, pending study tasks, etc.
// v1: generated on-the-fly from existing data, no DB table needed.

import { supabase } from './supabase'

export type Notification = {
  id: string
  type: 'exam_countdown' | 'study_reminder' | 'content_added'
  title: string
  message: string
  emoji: string
  urgent: boolean // true = shown in red/orange
}

export async function generateNotifications(userId: string): Promise<Notification[]> {
  const notifications: Notification[] = []

  // -------------------------------------------------------
  // 1. EXAM COUNTDOWN
  // -------------------------------------------------------
  const { data: enrollments } = await supabase
    .from('user_enrollments')
    .select('exam_type, target_year')
    .eq('user_id', userId)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  if (enrollments) {
    const examDate = new Date(`${enrollments.target_year}-06-01`)
    const today = new Date()
    const daysLeft = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysLeft > 0 && daysLeft <= 30) {
      notifications.push({
        id: 'exam-30',
        type: 'exam_countdown',
        title: 'Exam coming up!',
        message: `Only ${daysLeft} days until your exam. Keep pushing! 💪`,
        emoji: '📅',
        urgent: daysLeft <= 7,
      })
    } else if (daysLeft > 30 && daysLeft <= 60) {
      notifications.push({
        id: 'exam-60',
        type: 'exam_countdown',
        title: '2 months to go',
        message: `${daysLeft} days until your exam — a great time to pick up the pace.`,
        emoji: '📅',
        urgent: false,
      })
    } else if (daysLeft > 60 && daysLeft <= 90) {
      notifications.push({
        id: 'exam-90',
        type: 'exam_countdown',
        title: '3 months to go',
        message: `${daysLeft} days until your exam. Stay consistent!`,
        emoji: '📅',
        urgent: false,
      })
    }
  }

  // -------------------------------------------------------
  // 2. STUDY PLAN REMINDERS
  // Get today's day name and check for pending tasks
  // -------------------------------------------------------
  const { data: plan } = await supabase
    .from('study_plans')
    .select('plan_data')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle()

  if (plan?.plan_data?.tasks) {
    const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' })
    const todayTasks = plan.plan_data.tasks.filter(
      (t: any) => t.day === todayName && !t.done
    )

    if (todayTasks.length > 0) {
      notifications.push({
        id: 'study-today',
        type: 'study_reminder',
        title: `${todayTasks.length} task${todayTasks.length > 1 ? 's' : ''} for today`,
        message: `You have pending study tasks for ${todayName}. Don't fall behind!`,
        emoji: '📝',
        urgent: false,
      })
    }
  }

  // -------------------------------------------------------
  // 3. PROGRESS NUDGE
  // If student has zero progress, nudge them to start
  // -------------------------------------------------------
  const { count: progressCount } = await supabase
    .from('user_progress')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (progressCount === 0) {
    notifications.push({
      id: 'get-started',
      type: 'content_added',
      title: 'Ready to start learning?',
      message: 'You haven\'t viewed any lessons yet. Pick a subject and dive in!',
      emoji: '🚀',
      urgent: false,
    })
  }

  return notifications
}