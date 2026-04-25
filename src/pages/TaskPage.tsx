import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { format, parseISO, isSameDay } from 'date-fns'
import { uk } from 'date-fns/locale'
import { type WorkoutTask, type TaskActions } from '../types/workout'
import { progress, isTaskCompleted } from '../lib/workoutUtils'
import ProgressRing from '../components/ProgressRing'
import CompletedTaskActions from '../components/CompletedTaskActions'
import InfoCard from '../components/InfoCard'

interface TaskPageProps {
  tasks: WorkoutTask[]
  toggleStep: (taskId: string, stepId: string) => void
  actionHandlers: TaskActions
}

export default function TaskPage({ tasks, toggleStep, actionHandlers }: TaskPageProps) {
  const { taskId } = useParams()
  const navigate = useNavigate()
  const task = tasks.find((item) => item.id === taskId)
  const isFutureTask = task ? parseISO(task.scheduledFor) > new Date() && !isSameDay(parseISO(task.scheduledFor), new Date()) : false

  if (!task) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-transparent text-white">
      <main id="main-content" className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8 lg:py-8">
        <section className="glass-panel rounded-[32px] p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-4 py-2 text-sm text-white/82 transition-colors hover:bg-white/7 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                Назад до списку
              </button>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/48">
                  <span>{task.category}</span>
                  <span>•</span>
                  <span>{format(parseISO(task.scheduledFor), 'EEEE, d MMMM', { locale: uk })}</span>
                </div>
                <h1 className="text-balance text-4xl font-semibold tracking-tight">{task.title}</h1>
                <p className="max-w-2xl text-sm leading-7 text-white/68">{task.description}</p>
              </div>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-black/12 px-5 py-4">
              <div className="text-xs uppercase tracking-[0.18em] text-white/45">Поточний стан</div>
              <div className="mt-3 text-4xl font-semibold">{progress(task)}%</div>
              <div className="mt-2 text-sm text-white/58">{task.steps.filter((step) => step.completed).length} з {task.steps.length} підходів виконано</div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="glass-panel rounded-[28px] p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold">Підходи</h2>
                <p className="mt-1 text-sm text-white/60">Відмічай кожен завершений підхід окремо, і прогрес оновиться автоматично.</p>
              </div>
              {isTaskCompleted(task) ? (
                <CompletedTaskActions task={task} {...actionHandlers} />
              ) : (
                <ProgressRing value={progress(task)} color={task.color} />
              )}
            </div>
            <div className="space-y-3">
              {task.steps.map((step) => (
                <label
                  key={step.id}
                  className="flex cursor-pointer items-center gap-4 rounded-2xl border border-white/8 bg-white/4 px-4 py-4 transition-colors hover:bg-white/7 focus-within:border-[var(--color-accent)]"
                >
                  <input
                    type="checkbox"
                    name={step.id}
                    aria-label={step.label}
                    checked={step.completed}
                    disabled={isFutureTask}
                    onChange={() => toggleStep(task.id, step.id)}
                    className="size-5 rounded border-white/20 bg-transparent accent-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-45"
                  />
                  <div className="min-w-0 flex-1">
                    <p className={`break-words text-sm font-medium ${step.completed ? 'text-white/45 line-through' : 'text-white/86'}`}>
                      {step.label}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="glass-panel rounded-[28px] p-5 sm:p-6">
              <h2 className="text-lg font-semibold">Параметри вправи</h2>
              <div className="mt-4 grid gap-3">
                <InfoCard label="Повторень за підхід" value={`${task.repsPerSet}`} />
                <InfoCard label="Кількість підходів" value={`${task.setCount}`} />
                <InfoCard label="Інтенсивність" value={task.intensity} accent={task.color} />
              </div>
            </div>
            <div className="glass-panel rounded-[28px] p-5 sm:p-6">
              <h2 className="text-lg font-semibold">Нотатки</h2>
              <p className="mt-3 break-words text-sm leading-6 text-white/68">
                {task.notes || 'Нотаток поки немає…'}
              </p>
            </div>
          </aside>
        </section>
      </main>
    </div>
  )
}