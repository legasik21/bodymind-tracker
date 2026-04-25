import { Trash2 } from 'lucide-react'
import { type WorkoutTask, type TaskActions } from '../types/workout'

interface CompletedTaskActionsProps {
  task: WorkoutTask
  deleteTask: (taskId: string) => void
  scheduleTaskForNextDay: (taskId: string) => void
  compact?: boolean
  floating?: boolean
}

export default function CompletedTaskActions({
  task,
  deleteTask,
  scheduleTaskForNextDay,
  compact = false,
  floating = false,
}: CompletedTaskActionsProps) {
  if (floating) {
    return (
      <>
        <button
          type="button"
          aria-label="Видалити задачу"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            deleteTask(task.id)
          }}
          className="absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-full border border-[#ff8f5a]/35 bg-[#ff8f5a]/10 text-sm transition-colors hover:bg-[#ff8f5a]/18 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff8f5a]"
        >
          ❌
        </button>
        <button
          type="button"
          aria-label="Запланувати задачу на завтра"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            scheduleTaskForNextDay(task.id)
          }}
          className="absolute bottom-3 right-3 inline-flex min-h-[34px] items-center justify-center rounded-full bg-[var(--color-accent)] px-3 py-1.5 text-[11px] font-semibold text-[#07110c] transition-colors hover:bg-[#74e4b1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
        >
          На завтра
        </button>
      </>
    )
  }

  return (
    <div className={`flex ${compact ? 'flex-col' : 'flex-col sm:flex-row'} gap-2`}>
      <button
        type="button"
        onClick={() => scheduleTaskForNextDay(task.id)}
        className="inline-flex items-center justify-center rounded-full bg-[var(--color-accent)] px-3 py-2 text-xs font-semibold text-[#07110c] transition-colors hover:bg-[#74e4b1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
      >
        На завтра
      </button>
      <button
        type="button"
        onClick={() => deleteTask(task.id)}
        className="inline-flex items-center justify-center gap-1 rounded-full border border-[#ff8f5a]/35 bg-[#ff8f5a]/10 px-3 py-2 text-xs font-semibold text-[#ffb08a] transition-colors hover:bg-[#ff8f5a]/18 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff8f5a]"
      >
        <Trash2 className="size-3.5" aria-hidden="true" />
        Видалити
      </button>
    </div>
  )
}