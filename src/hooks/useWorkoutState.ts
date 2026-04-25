import { useState, useMemo, useEffect, type FormEvent } from 'react'
import { format, addDays, parseISO } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { type AppState, type TaskFormState, type WorkoutTask, type TaskActions } from '../types/workout'
import { CATEGORIES, CATEGORY_COLORS } from '../constants/categories'
import { loadState, initialFormState } from '../lib/storage'
import { isTaskCompleted, progress } from '../lib/workoutUtils'

export function useWorkoutState() {
  const [state, setState] = useState<AppState>(() => loadState())
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [showDiscardPrompt, setShowDiscardPrompt] = useState(false)
  const [form, setForm] = useState<TaskFormState>(() => initialFormState())
  const [taskView, setTaskView] = useState<'today' | 'tomorrow'>('today')

  useEffect(() => {
    window.localStorage.setItem('my-fitness-state-v2', JSON.stringify(state))
  }, [state])

  const defaultForm = useMemo(() => initialFormState(), [])
  const hasUnsavedChanges =
    form.title.trim().length > 0 ||
    form.description.trim().length > 0 ||
    form.notes.trim().length > 0 ||
    form.date !== defaultForm.date ||
    form.category !== defaultForm.category ||
    form.intensity !== defaultForm.intensity ||
    form.repsPerSet !== defaultForm.repsPerSet ||
    form.setCount !== defaultForm.setCount

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isCreateOpen || !hasUnsavedChanges) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [hasUnsavedChanges, isCreateOpen])

  const tasksSorted = useMemo(
    () => [...state.tasks].sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor)),
    [state.tasks],
  )

  function resetForm() {
    setForm(initialFormState())
  }

  function requestCloseModal() {
    if (hasUnsavedChanges) {
      setShowDiscardPrompt(true)
      return
    }
    setIsCreateOpen(false)
  }

  function toggleStep(taskId: string, stepId: string) {
    setState((current) => ({
      tasks: current.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              steps: task.steps.map((step) =>
                step.id === stepId ? { ...step, completed: !step.completed } : step,
              ),
            }
          : task,
      ),
    }))
  }

  function deleteTask(taskId: string) {
    setState((current) => ({
      tasks: current.tasks.filter((task) => task.id !== taskId),
    }))
  }

  function scheduleTaskForNextDay(taskId: string) {
    setState((current) => {
      const source = current.tasks.find((task) => task.id === taskId)
      if (!source) return current

      const nextDate = format(addDays(parseISO(source.scheduledFor), 1), 'yyyy-MM-dd')
      const duplicateExists = current.tasks.some(
        (task) =>
          task.id !== source.id &&
          task.title === source.title &&
          task.category === source.category &&
          task.scheduledFor === nextDate,
      )

      if (duplicateExists) {
        return { tasks: current.tasks.filter((task) => task.id !== taskId) }
      }

      const unit = source.category === 'Відновлення' ? 'сек' : 'повторень'
      const cloned: WorkoutTask = {
        ...source,
        id: crypto.randomUUID(),
        scheduledFor: nextDate,
        description:
          source.description || `${source.title} · ${source.setCount} підходи по ${source.repsPerSet} ${unit}.`,
        steps: Array.from({ length: source.setCount }, (_, index) => ({
          id: `step-${index + 1}`,
          label: `Підхід ${index + 1} · ${source.repsPerSet} ${unit}`,
          completed: false,
        })),
      }

      return { tasks: [cloned, ...current.tasks.filter((task) => task.id !== taskId)] }
    })
    setTaskView('tomorrow')
  }

  function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const reps = Number(form.repsPerSet)
    const sets = Number(form.setCount)

    if (!form.title.trim() || Number.isNaN(reps) || Number.isNaN(sets) || reps < 1 || sets < 1) return

    const unit = form.category === 'Відновлення' ? 'сек' : 'повторень'
    const newTask: WorkoutTask = {
      id: crypto.randomUUID(),
      title: form.title.trim(),
      category: form.category,
      description:
        form.description.trim() || `${form.title.trim()} · ${sets} підходи по ${reps} ${unit}.`,
      intensity: form.intensity,
      color: CATEGORY_COLORS[CATEGORIES.indexOf(form.category) % CATEGORY_COLORS.length] ?? CATEGORY_COLORS[0]!,
      scheduledFor: form.date,
      notes: form.notes.trim(),
      repsPerSet: reps,
      setCount: sets,
      steps: Array.from({ length: sets }, (_, index) => ({
        id: `step-${index + 1}`,
        label: `Підхід ${index + 1} · ${reps} ${unit}`,
        completed: false,
      })),
    }

    setState((current) => ({ tasks: [newTask, ...current.tasks] }))
    setIsCreateOpen(false)
    setShowDiscardPrompt(false)
    resetForm()
  }

  const actionHandlers: TaskActions = { deleteTask, scheduleTaskForNextDay }

  return {
    state,
    tasksSorted,
    isCreateOpen,
    showDiscardPrompt,
    form,
    setForm,
    setIsCreateOpen,
    requestCloseModal,
    setShowDiscardPrompt,
    resetForm,
    taskView,
    setTaskView,
    toggleStep,
    deleteTask,
    scheduleTaskForNextDay,
    createTask,
    actionHandlers,
    hasUnsavedChanges,
  }
}

export function useTaskStats(state: AppState) {
  return useMemo(() => {
    const tasksSorted = [...state.tasks].sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor))
    const today = new Date()
    const tomorrow = addDays(today, 1)
    const { isSameDay, parseISO } = require('date-fns') as typeof import('date-fns')
    const todayTasks = tasksSorted.filter((task) => isSameDay(parseISO(task.scheduledFor), today))
    const tomorrowTasks = tasksSorted.filter((task) => isSameDay(parseISO(task.scheduledFor), tomorrow))
    return { tasksSorted, todayTasks, tomorrowTasks }
  }, [state.tasks])
}