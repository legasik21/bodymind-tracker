import { useState, useEffect, useMemo } from 'react'
import { startOfDay, startOfWeek, isSameDay } from 'date-fns'
import { supabase } from '../lib/supabase'

// Analytics data ready — connect to analytics UI component when needed
export type CompletionType = 'deleted' | 'moved_to_tomorrow'

export interface CompletedTask {
  id: number
  title: string
  category: string
  description: string | null
  intensity: string
  color: string | null
  app_date: string
  notes: string | null
  reps_per_set: number
  set_count: number
  steps: unknown[]
  completion_type: CompletionType
  original_task_id: number | null
  created_at: string
}

export interface AnalyticsData {
  totalCompleted: number
  completedToday: number
  completedThisWeek: number
  byType: {
    deleted: number
    moved_to_tomorrow: number
  }
}

function buildAnalytics(completed: CompletedTask[], today: Date): AnalyticsData {
  const todayStr = today.toISOString().split('T')[0]
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })

  return {
    totalCompleted: completed.length,
    completedToday: completed.filter((t) => t.app_date === todayStr).length,
    completedThisWeek: completed.filter((t) => {
      const d = new Date(t.app_date)
      return d >= weekStart && isSameDay(d, today)
    }).length,
    byType: {
      deleted: completed.filter((t) => t.completion_type === 'deleted').length,
      moved_to_tomorrow: completed.filter((t) => t.completion_type === 'moved_to_tomorrow').length,
    },
  }
}

export function useAnalytics() {
  const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('completed_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to load completed tasks:', error)
        setIsLoading(false)
        return
      }

      setCompletedTasks((data as CompletedTask[]) || [])
      setIsLoading(false)
    }

    load()
  }, [])

  const analytics = useMemo(() => buildAnalytics(completedTasks, new Date()), [completedTasks])

  return { analytics, completedTasks, isLoading }
}