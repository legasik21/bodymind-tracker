import { Link } from 'react-router-dom'
import { type WorkoutTask, type TaskActions } from '../types/workout'
import { isTaskCompleted, progress } from '../lib/workoutUtils'
import ProgressRing from './ProgressRing'
import CompletedTaskActions from './CompletedTaskActions'

interface TaskRowProps {
  task: WorkoutTask
  actionHandlers: TaskActions
  compact?: boolean
}

export default function TaskRow({ task, actionHandlers, compact = false }: TaskRowProps) {
  const completed = isTaskCompleted(task)

  return (
    <div className="relative">
      <Link
        to={`/task/${task.id}`}
        className={`flex ${compact ? 'min-h-[86px]' : 'min-h-[98px]'} items-start rounded-[26px] border border-white/10 bg-black/16 px-4 py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] hover:bg-white/6 transition-colors ${completed ? 'pr-32 pb-12' : ''}`}
      >
        <div className="min-w-0 flex-1">
          <h2 className={`${compact ? 'text-base' : 'text-lg'} truncate pr-8 font-semibold`}>{task.title}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2 break-words text-sm text-white/58">
            <span>{task.setCount} підходи</span>
            <span>•</span>
            <span>{task.repsPerSet} {task.category === 'Відновлення' ? 'сек' : 'повторень'}</span>
            <span>•</span>
            <span>{task.steps.filter((step) => step.completed).length}/{task.steps.length}</span>
          </div>
        </div>
      </Link>

      {completed ? (
        <CompletedTaskActions task={task} {...actionHandlers} compact floating />
      ) : (
        <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
          <ProgressRing value={progress(task)} color={task.color} />
        </div>
      )}
    </div>
  )
}