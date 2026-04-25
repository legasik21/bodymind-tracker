import { addDays, format } from 'date-fns'
import type { AppState, WorkoutTask } from '../types/workout'
import { STORAGE_KEY } from '../constants/categories'

export function initialFormState() {
  return {
    title: '',
    category: 'Сила',
    description: '',
    intensity: 'Середня' as const,
    date: format(new Date(), 'yyyy-MM-dd'),
    repsPerSet: '50',
    setCount: '3',
    notes: '',
  }
}

export const initialState: AppState = {
  tasks: [
    {
      id: 'pushups-power',
      title: 'Віджимання',
      category: 'Сила',
      description: 'Силовий блок на груди, плечі та стабілізацію корпусу.',
      intensity: 'Висока',
      color: '#59d69f',
      scheduledFor: format(new Date(), 'yyyy-MM-dd'),
      notes: 'Тримай рівний темп та не провалюй таз.',
      repsPerSet: 50,
      setCount: 3,
      steps: [
        { id: 'set-1', label: 'Підхід 1 · 50 повторень', completed: true },
        { id: 'set-2', label: 'Підхід 2 · 50 повторень', completed: false },
        { id: 'set-3', label: 'Підхід 3 · 50 повторень', completed: false },
      ],
    },
    {
      id: 'squats-power',
      title: 'Присідання',
      category: 'Сила',
      description: 'Навантаження на ноги та вибухову силу.',
      intensity: 'Середня',
      color: '#8b7bff',
      scheduledFor: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
      notes: 'Слідкуй за колінами та амплітудою.',
      repsPerSet: 25,
      setCount: 4,
      steps: [
        { id: 'set-1', label: 'Підхід 1 · 25 повторень', completed: false },
        { id: 'set-2', label: 'Підхід 2 · 25 повторень', completed: false },
        { id: 'set-3', label: 'Підхід 3 · 25 повторень', completed: false },
        { id: 'set-4', label: 'Підхід 4 · 25 повторень', completed: false },
      ],
    },
    {
      id: 'plank-core',
      title: 'Планка',
      category: 'Відновлення',
      description: 'Кор + контроль дихання для стабільності.',
      intensity: 'Низька',
      color: '#ff8f5a',
      scheduledFor: format(addDays(new Date(), -1), 'yyyy-MM-dd'),
      notes: 'Рівна спина, без провисання у попереку.',
      repsPerSet: 60,
      setCount: 3,
      steps: [
        { id: 'set-1', label: 'Підхід 1 · 60 сек', completed: true },
        { id: 'set-2', label: 'Підхід 2 · 60 сек', completed: true },
        { id: 'set-3', label: 'Підхід 3 · 60 сек', completed: true },
      ],
    },
  ],
}

export function isAppState(value: unknown): value is AppState {
  return (
    typeof value === 'object' &&
    value !== null &&
    'tasks' in value &&
    Array.isArray((value as { tasks: unknown }).tasks)
  )
}

export function loadState(): AppState {
  if (typeof window === 'undefined') return initialState

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState
    const parsed: unknown = JSON.parse(raw)
    if (!isAppState(parsed)) return initialState
    return {
      tasks: parsed.tasks.map((task) => ({
        ...task,
        repsPerSet: task.repsPerSet ?? inferReps(task.steps[0]?.label),
        setCount: task.setCount ?? task.steps.length,
      })),
    }
  } catch {
    return initialState
  }
}

export function inferReps(label = ''): number {
  const match = label.match(/(\d+)/)
  return match ? Number(match[1]) : 10
}