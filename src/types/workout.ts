export type Step = {
  id: string
  label: string
  completed: boolean
}

export type WorkoutTask = {
  id: string
  title: string
  category: string
  description: string
  intensity: 'Низька' | 'Середня' | 'Висока'
  color: string
  scheduledFor: string
  steps: Step[]
  notes: string
  repsPerSet: number
  setCount: number
}

export type AppState = {
  tasks: WorkoutTask[]
}

export type TaskFormState = {
  title: string
  category: string
  description: string
  intensity: WorkoutTask['intensity']
  date: string
  repsPerSet: string
  setCount: string
  notes: string
}

export type TaskActions = {
  deleteTask: (taskId: string) => void
  scheduleTaskForNextDay: (taskId: string) => void
}