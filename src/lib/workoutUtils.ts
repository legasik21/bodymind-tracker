import { addDays } from 'date-fns'
import type { WorkoutTask } from '../types/workout'

export function progress(task: WorkoutTask): number {
  if (task.steps.length === 0) return 0
  const done = task.steps.filter((step) => step.completed).length
  return Math.round((done / task.steps.length) * 100)
}

export function isTaskCompleted(task: WorkoutTask): boolean {
  return task.steps.length > 0 && task.steps.every((step) => step.completed)
}

export function eachDay(start: Date, end: Date): Date[] {
  const days: Date[] = []
  let current = start
  while (current.getTime() <= end.getTime()) {
    days.push(current)
    current = addDays(current, 1)
  }
  return days
}