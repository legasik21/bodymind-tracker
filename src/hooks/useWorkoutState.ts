import { useState, useMemo, useEffect } from 'react'
import { format, addDays, parseISO } from 'date-fns'
import { supabase } from '../lib/supabase'
import { type AppState, type WorkoutTask, type TaskActions } from '../types/workout'
import { loadState } from '../lib/storage'
import { isTaskCompleted, progress } from '../lib/workoutUtils'

// All new features: store data in Supabase, link to user_id via auth.uid()
export function useWorkoutState() {
  const [state, setState] = useState<AppState>(() => loadState())
  const [taskView, setTaskView] = useState<'today' | 'tomorrow'>('today')
  const [isLoading, setIsLoading] = useState(false)

  // Persist to localStorage as fallback
  useEffect(() => {
    window.localStorage.setItem('my-fitness-state-v2', JSON.stringify(state))
  }, [state])

  // Load tasks from Supabase on mount
  useEffect(() => {
    async function loadFromSupabase() {
      setIsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsLoading(false)
        return
      }

      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_for', { ascending: true })

      const { data: scheduledData, error: scheduledError } = await supabase
        .from('scheduled_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('app_date', { ascending: true })

      const allTasks: typeof tasks = [...(tasksData || []), ...(scheduledData || [])]

      if (tasksError || scheduledError) {
        console.error('Failed to load tasks from Supabase:', tasksError || scheduledError)
        setIsLoading(false)
        return
      }

      if (allTasks.length > 0) {
        const mapped: WorkoutTask[] = allTasks.map((t) => ({
          id: String(t.id),
          title: t.title,
          category: t.category,
          description: t.description || '',
          intensity: t.intensity as WorkoutTask['intensity'],
          color: t.color || '#59d69f',
          scheduledFor: 'scheduled_for' in t ? t.scheduled_for : t.app_date,
          notes: t.notes || '',
          repsPerSet: t.reps_per_set,
          setCount: t.set_count,
          steps: t.steps || [],
        }))
        setState({ tasks: mapped })
      }
      setIsLoading(false)
    }

    loadFromSupabase()
  }, [])

  const tasksSorted = useMemo(
    () => [...state.tasks].sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor)),
    [state.tasks],
  )

  async function addTask(task: WorkoutTask) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd')
    const isScheduled = task.scheduledFor >= tomorrow

    const payload = {
      user_id: user.id,
      title: task.title,
      category: task.category,
      description: task.description,
      intensity: task.intensity,
      color: task.color,
      notes: task.notes,
      reps_per_set: task.repsPerSet,
      set_count: task.setCount,
      steps: task.steps,
    }

    const table = isScheduled ? 'scheduled_tasks' : 'tasks'
    const dateField = isScheduled ? 'app_date' : 'scheduled_for'

    const { data, error } = await supabase
      .from(table)
      .insert({ ...payload, [dateField]: task.scheduledFor })
      .select()
      .single()

    if (error) {
      console.error(`Failed to save task to ${table}:`, error)
      return
    }

    const inserted: WorkoutTask = { ...task, id: String(data.id) }
    setState((current) => ({ tasks: [inserted, ...current.tasks] }))
  }

  async function toggleStep(taskId: string, stepId: string) {
    setState((current) => {
      const updated = current.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              steps: task.steps.map((step) =>
                step.id === stepId ? { ...step, completed: !step.completed } : step,
              ),
            }
          : task,
      )
      return { tasks: updated }
    })

    const task = state.tasks.find((t) => t.id === taskId)
    if (!task) return
    const updatedSteps = task.steps.map((step) =>
      step.id === stepId ? { ...step, completed: !step.completed } : step,
    )

    await supabase
      .from('tasks')
      .update({ steps: updatedSteps })
      .eq('id', Number(taskId))
  }

  async function deleteTask(taskId: string) {
    const task = state.tasks.find((t) => t.id === taskId)
    if (!task) return

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      // Record to completed_tasks before deleting
      await supabase.from('completed_tasks').insert({
        user_id: user.id,
        title: task.title,
        category: task.category,
        description: task.description,
        intensity: task.intensity,
        color: task.color,
        app_date: task.scheduledFor,
        notes: task.notes,
        reps_per_set: task.repsPerSet,
        set_count: task.setCount,
        steps: task.steps,
        completion_type: 'deleted',
        original_task_id: Number(taskId),
      })
    }

    setState((current) => ({
      tasks: current.tasks.filter((t) => t.id !== taskId),
    }))

    await supabase
      .from('tasks')
      .delete()
      .eq('id', Number(taskId))
  }

  async function scheduleTaskForNextDay(taskId: string) {
    const source = state.tasks.find((task) => task.id === taskId)
    if (!source) return

    const nextDate = format(addDays(parseISO(source.scheduledFor), 1), 'yyyy-MM-dd')
    const duplicateExists = state.tasks.some(
      (task) =>
        task.id !== source.id &&
        task.title === source.title &&
        task.category === source.category &&
        task.scheduledFor === nextDate,
    )

    if (duplicateExists) {
      await deleteTask(taskId)
      setTaskView('tomorrow')
      return
    }

    const unit = source.category === 'Відновлення' ? 'сек' : 'повторень'
    const cloned: WorkoutTask = {
      ...source,
      id: crypto.randomUUID(),
      scheduledFor: nextDate,
      description:
        source.description || `${source.title} · ${source.setCount} підходи по ${source.repsPerSet} ${unit}.`,
      steps: Array.from({ length: source.setCount }, (_, index) => ({
        id: `step-${crypto.randomUUID()}`,
        label: `Підхід ${index + 1} · ${source.repsPerSet} ${unit}`,
        completed: false,
      })),
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data, error } = await supabase
        .from('scheduled_tasks')
        .insert({
          user_id: user.id,
          title: cloned.title,
          category: cloned.category,
          description: cloned.description,
          intensity: cloned.intensity,
          color: cloned.color,
          app_date: cloned.scheduledFor,
          notes: cloned.notes,
          reps_per_set: cloned.repsPerSet,
          set_count: cloned.setCount,
          steps: cloned.steps,
        })
        .select()
        .single()

      if (!error && data) {
        cloned.id = String(data.id)

        // Record to completed_tasks before deleting from tasks
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase.from('completed_tasks').insert({
            user_id: user.id,
            title: source.title,
            category: source.category,
            description: source.description,
            intensity: source.intensity,
            color: source.color,
            app_date: source.scheduledFor,
            notes: source.notes,
            reps_per_set: source.repsPerSet,
            set_count: source.setCount,
            steps: source.steps,
            completion_type: 'moved_to_tomorrow',
            original_task_id: Number(taskId),
          })
        }

        // Insert succeeded — now delete the original from tasks table
        await supabase
          .from('tasks')
          .delete()
          .eq('id', Number(taskId))
      }
    }

    setState((current) => ({
      tasks: current.tasks.filter((task) => task.id !== taskId),
    }))
    setTaskView('tomorrow')
  }

  const actionHandlers: TaskActions = { deleteTask, scheduleTaskForNextDay }

  return {
    state,
    tasksSorted,
    taskView,
    setTaskView,
    toggleStep,
    addTask,
    deleteTask,
    scheduleTaskForNextDay,
    actionHandlers,
    isLoading,
  }
}