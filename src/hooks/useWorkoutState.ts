import { useState, useMemo, useEffect } from 'react'
import { format, addDays, parseISO } from 'date-fns'
import { type AppState, type WorkoutTask, type TaskActions } from '../types/workout'
import { loadState } from '../lib/storage'
import { isTaskCompleted, progress } from '../lib/workoutUtils'

export function useWorkoutState() {
  const [state, setState] = useState<AppState>(() => loadState())
  const [taskView, setTaskView] = useState<'today' | 'tomorrow'>('today')

  useEffect(() => {
    window.localStorage.setItem('my-fitness-state-v2', JSON.stringify(state))
  }, [state])

  const tasksSorted = useMemo(
    () => [...state.tasks].sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor)),
    [state.tasks],
  )

  function addTask(task: WorkoutTask) {
    setState((current) => ({ tasks: [task, ...current.tasks] }))
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
  }
}