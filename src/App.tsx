import {
  Activity,
  ArrowLeft,
  BarChart3,
  CalendarRange,
  Dumbbell,
  Plus,
  Target,
  Trash2,
} from 'lucide-react'
import { type Dispatch, type FormEvent, type ReactNode, type SetStateAction, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import {
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  parseISO,
  startOfMonth,
  startOfWeek,
  subDays,
} from 'date-fns'
import { uk } from 'date-fns/locale'

type Step = {
  id: string
  label: string
  completed: boolean
}

type WorkoutTask = {
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

type AppState = {
  tasks: WorkoutTask[]
}

type TaskFormState = {
  title: string
  category: string
  description: string
  intensity: WorkoutTask['intensity']
  date: string
  repsPerSet: string
  setCount: string
  notes: string
}

type TaskActions = {
  deleteTask: (taskId: string) => void
  scheduleTaskForNextDay: (taskId: string) => void
}

const STORAGE_KEY = 'my-fitness-state-v2'
const CATEGORY_COLORS = ['#59d69f', '#8b7bff', '#ff8f5a', '#4dd0e1', '#ffd166']
const CATEGORIES = ['Сила', 'Витривалість', 'Відновлення', 'Гнучкість', 'Мозкова активність']

const initialFormState = (): TaskFormState => ({
  title: '',
  category: 'Сила',
  description: '',
  intensity: 'Середня',
  date: format(new Date(), 'yyyy-MM-dd'),
  repsPerSet: '50',
  setCount: '3',
  notes: '',
})

const initialState: AppState = {
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
      scheduledFor: format(subDays(new Date(), 1), 'yyyy-MM-dd'),
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

function loadState(): AppState {
  if (typeof window === 'undefined') return initialState

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState
    const parsed = JSON.parse(raw) as AppState
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

function inferReps(label = '') {
  const match = label.match(/(\d+)/)
  return match ? Number(match[1]) : 10
}

function progress(task: WorkoutTask): number {
  if (task.steps.length === 0) return 0
  const done = task.steps.filter((step) => step.completed).length
  return Math.round((done / task.steps.length) * 100)
}

function isTaskCompleted(task: WorkoutTask): boolean {
  return task.steps.length > 0 && task.steps.every((step) => step.completed)
}

function eachDay(start: Date, end: Date): Date[] {
  const days: Date[] = []
  let current = start
  while (current.getTime() <= end.getTime()) {
    days.push(current)
    current = addDays(current, 1)
  }
  return days
}

function App() {
  const [state, setState] = useState<AppState>(() => loadState())
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [showDiscardPrompt, setShowDiscardPrompt] = useState(false)
  const [form, setForm] = useState<TaskFormState>(() => initialFormState())
  const [taskView, setTaskView] = useState<'today' | 'tomorrow'>('today')

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  // Derive defaults once so hasUnsavedChanges never silently drifts from initialFormState
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

  // Memoize date-derived values — these were recreated on every render including keystrokes
  const today = useMemo(() => new Date(), [])
  const tomorrow = useMemo(() => addDays(today, 1), [today])
  const todayTasks = useMemo(
    () => tasksSorted.filter((task) => isSameDay(parseISO(task.scheduledFor), today)),
    [tasksSorted, today],
  )
  const tomorrowTasks = useMemo(
    () => tasksSorted.filter((task) => isSameDay(parseISO(task.scheduledFor), tomorrow)),
    [tasksSorted, tomorrow],
  )
  const weekRange = useMemo(
    () => eachDay(startOfWeek(today, { weekStartsOn: 1 }), endOfWeek(today, { weekStartsOn: 1 })),
    [today],
  )
  const monthRange = useMemo(
    () => eachDay(startOfMonth(today), endOfMonth(today)),
    [today],
  )

  const weeklySeries = weekRange.map((date) => {
    const dayTasks = state.tasks.filter((task) => isSameDay(parseISO(task.scheduledFor), date))
    const value = dayTasks.length
      ? Math.round(dayTasks.reduce((sum, task) => sum + progress(task), 0) / dayTasks.length)
      : 0
    return {
      day: format(date, 'EEEEE', { locale: uk }),
      value,
    }
  })

  const monthlyCompleted = monthRange.filter((date) => {
    const dayTasks = state.tasks.filter((task) => isSameDay(parseISO(task.scheduledFor), date))
    return dayTasks.length > 0 && dayTasks.every((task) => isTaskCompleted(task))
  }).length

  const stats = {
    totalTasks: state.tasks.length,
    completedTasks: state.tasks.filter((task) => isTaskCompleted(task)).length,
    activeToday: todayTasks.length,
    averageProgress:
      state.tasks.length > 0
        ? Math.round(state.tasks.reduce((sum, task) => sum + progress(task), 0) / state.tasks.length)
        : 0,
  }

  const categoryData = CATEGORIES.map((category) => {
    const count = state.tasks.filter((task) => task.category === category).length
    return { name: category, value: count || 0 }
  })

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
      // Derive color from category so it matches PieChart Cell colors
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

  const actionHandlers = { deleteTask, scheduleTaskForNextDay }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <DashboardPage
            stats={stats}
            todayTasks={todayTasks}
            tomorrowTasks={tomorrowTasks}
            taskView={taskView}
            setTaskView={setTaskView}
            weeklySeries={weeklySeries}
            monthlyCompleted={monthlyCompleted}
            monthRange={monthRange}
            categoryData={categoryData}
            isCreateOpen={isCreateOpen}
            showDiscardPrompt={showDiscardPrompt}
            form={form}
            setForm={setForm}
            setIsCreateOpen={setIsCreateOpen}
            requestCloseModal={requestCloseModal}
            setShowDiscardPrompt={setShowDiscardPrompt}
            resetForm={resetForm}
            createTask={createTask}
            actionHandlers={actionHandlers}
          />
        }
      />
      <Route
        path="/task/:taskId"
        element={<TaskPage tasks={tasksSorted} toggleStep={toggleStep} actionHandlers={actionHandlers} />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function DashboardPage({
  stats,
  todayTasks,
  tomorrowTasks,
  taskView,
  setTaskView,
  weeklySeries,
  monthlyCompleted,
  monthRange,
  categoryData,
  isCreateOpen,
  showDiscardPrompt,
  form,
  setForm,
  setIsCreateOpen,
  requestCloseModal,
  setShowDiscardPrompt,
  resetForm,
  createTask,
  actionHandlers,
}: {
  stats: { totalTasks: number; completedTasks: number; activeToday: number; averageProgress: number }
  todayTasks: WorkoutTask[]
  tomorrowTasks: WorkoutTask[]
  taskView: 'today' | 'tomorrow'
  setTaskView: Dispatch<SetStateAction<'today' | 'tomorrow'>>
  weeklySeries: { day: string; value: number }[]
  monthlyCompleted: number
  monthRange: Date[]
  categoryData: { name: string; value: number }[]
  isCreateOpen: boolean
  showDiscardPrompt: boolean
  form: TaskFormState
  setForm: Dispatch<SetStateAction<TaskFormState>>
  setIsCreateOpen: Dispatch<SetStateAction<boolean>>
  requestCloseModal: () => void
  setShowDiscardPrompt: Dispatch<SetStateAction<boolean>>
  resetForm: () => void
  createTask: (event: FormEvent<HTMLFormElement>) => void
  actionHandlers: TaskActions
}) {
  const visibleTasks = taskView === 'today' ? todayTasks : tomorrowTasks

  return (
    <div className="min-h-screen overflow-x-hidden bg-transparent text-white">
      <main id="main-content" className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8 lg:py-8">
        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="glass-panel rounded-[32px] p-4 sm:p-5">
            <div className="flex min-h-[78vh] flex-col gap-4">
              <div className="flex items-center justify-between gap-3 px-1">
                <TaskViewSwitch taskView={taskView} onViewChange={setTaskView} />
                <div className="text-sm text-white/45">{visibleTasks.length} шт.</div>
              </div>

              <div className="grid gap-3">
                {visibleTasks.length > 0 ? (
                  // tasksSorted is already sorted by date; sort here by progress (incomplete first)
                  [...visibleTasks]
                    .sort((a, b) => progress(a) - progress(b))
                    .map((task) => (
                      <TaskRow key={task.id} task={task} actionHandlers={actionHandlers} />
                    ))
                ) : (
                  <div className="flex min-h-[220px] items-center justify-center rounded-[26px] border border-dashed border-white/10 bg-black/14 px-5 py-8 text-center text-sm text-white/58">
                    {taskView === 'today'
                      ? 'На сьогодні задач немає. Додай нову нижче.'
                      : 'На завтра задач поки немає. Можеш запланувати виконану задачу.'}
                  </div>
                )}
              </div>

              <button
                type="button"
                aria-label="Створити нову задачу"
                onClick={() => {
                  setIsCreateOpen(true)
                  setShowDiscardPrompt(false)
                }}
                className="mt-auto inline-flex min-h-[58px] items-center justify-center gap-2 rounded-[26px] bg-[var(--color-accent)] px-5 py-3 font-semibold text-[#07110c] transition-colors hover:bg-[#74e4b1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
              >
                <Plus className="size-4" aria-hidden="true" />
                Додати нову задачу
              </button>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="glass-panel rounded-[32px] p-4 sm:p-5">
              <div className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-white/52">Завтрашні задачі</div>
              <div className="grid gap-3">
                {tomorrowTasks.length > 0 ? (
                  [...tomorrowTasks]
                    .sort((a, b) => progress(a) - progress(b))
                    .map((task) => <TaskRow key={`tomorrow-${task.id}`} task={task} actionHandlers={actionHandlers} compact />)
                ) : (
                  <div className="rounded-[24px] border border-dashed border-white/10 bg-black/14 px-4 py-6 text-sm text-white/55">
                    Завтрашніх задач поки немає.
                  </div>
                )}
              </div>
            </div>

            <div className="glass-panel rounded-[28px] p-5 sm:p-6">
              <div className="mb-4 flex items-center gap-3">
                <BarChart3 className="size-5 text-[var(--color-accent)]" aria-hidden="true" />
                <div>
                  <h2 className="text-xl font-semibold">Аналітика</h2>
                  <p className="mt-1 text-sm text-white/60">Щотижневі та щомісячні звіти по стабільності навантаження.</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <MetricPanel title="Завершені дні за місяць" value={`${monthlyCompleted}/${monthRange.length}`} caption="Повністю закриті дні" icon={CalendarRange} />
                <MetricPanel title="Середня динаміка" value={`${stats.averageProgress}%`} caption="Середній відсоток виконання" icon={Activity} />
              </div>
              <div className="mt-6 h-64 rounded-[24px] border border-white/8 bg-black/12 p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklySeries} margin={{ top: 12, right: 8, bottom: 0, left: -28 }}>
                    <XAxis dataKey="day" stroke="rgba(255,255,255,0.35)" tickLine={false} axisLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.35)" tickLine={false} axisLine={false} width={36} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 16,
                        border: '1px solid rgba(255,255,255,0.08)',
                        background: 'rgba(9, 13, 18, 0.95)',
                        color: '#fff',
                      }}
                    />
                    <Line type="monotone" dataKey="value" stroke="#59d69f" strokeWidth={3} dot={{ r: 4, fill: '#59d69f' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-panel rounded-[28px] p-5 sm:p-6">
              <div className="mb-4 flex items-center gap-3">
                <Dumbbell className="size-5 text-[var(--color-accent-3)]" aria-hidden="true" />
                <div>
                  <h2 className="text-xl font-semibold">Розподіл активностей</h2>
                  <p className="mt-1 text-sm text-white/60">Дивись, де саме накопичується навантаження.</p>
                </div>
              </div>
              <div className="flex flex-col gap-6 xl:flex-row xl:items-center">
                <div className="h-56 w-full xl:w-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData} dataKey="value" innerRadius={55} outerRadius={78} paddingAngle={4} stroke="transparent">
                        {categoryData.map((entry, index) => (
                          <Cell key={entry.name} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: 16,
                          border: '1px solid rgba(255,255,255,0.08)',
                          background: 'rgba(9, 13, 18, 0.95)',
                          color: '#fff',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid flex-1 gap-3">
                  {categoryData.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/4 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="size-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }} />
                        <span className="text-sm text-white/78">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium text-white/92">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {isCreateOpen ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-3 sm:items-center" aria-live="polite">
            <div className="glass-panel relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[30px] p-5 sm:p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold">Нова спортивна задача</h2>
                  <p className="mt-1 text-sm text-white/60">Задай вправу, кількість повторень в одному підході та кількість підходів.</p>
                </div>
                <button
                  type="button"
                  aria-label="Закрити модальне вікно"
                  onClick={requestCloseModal}
                  className="rounded-full border border-white/10 px-3 py-1.5 text-sm text-white/80 transition-colors hover:bg-white/7 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
                >
                  Закрити
                </button>
              </div>
              <form className="grid gap-4" onSubmit={createTask}>
                <FormField label="Назва" htmlFor="title">
                  <input
                    id="title"
                    name="title"
                    type="text"
                    autoComplete="off"
                    value={form.title}
                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                    placeholder="Наприклад, Віджимання…"
                    className="w-full rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-white outline-hidden transition-colors placeholder:text-white/28 focus-visible:border-[var(--color-accent)]"
                  />
                </FormField>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Повторень за підхід" htmlFor="repsPerSet">
                    <input
                      id="repsPerSet"
                      name="repsPerSet"
                      type="number"
                      inputMode="numeric"
                      autoComplete="off"
                      min="1"
                      value={form.repsPerSet}
                      onChange={(event) => setForm((current) => ({ ...current, repsPerSet: event.target.value }))}
                      placeholder="50…"
                      className="w-full rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-white outline-hidden transition-colors placeholder:text-white/28 focus-visible:border-[var(--color-accent)]"
                    />
                  </FormField>
                  <FormField label="Кількість підходів" htmlFor="setCount">
                    <input
                      id="setCount"
                      name="setCount"
                      type="number"
                      inputMode="numeric"
                      autoComplete="off"
                      min="1"
                      value={form.setCount}
                      onChange={(event) => setForm((current) => ({ ...current, setCount: event.target.value }))}
                      placeholder="3…"
                      className="w-full rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-white outline-hidden transition-colors placeholder:text-white/28 focus-visible:border-[var(--color-accent)]"
                    />
                  </FormField>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField label="Категорія" htmlFor="category">
                    <select
                      id="category"
                      name="category"
                      autoComplete="off"
                      value={form.category}
                      onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                      className="w-full rounded-2xl border border-white/10 bg-[#0f151d] px-4 py-3 text-white outline-hidden transition-colors focus-visible:border-[var(--color-accent)]"
                    >
                      <option>Сила</option>
                      <option>Витривалість</option>
                      <option>Відновлення</option>
                      <option>Гнучкість</option>
                      <option>Мозкова активність</option>
                    </select>
                  </FormField>
                  <FormField label="Інтенсивність" htmlFor="intensity">
                    <select
                      id="intensity"
                      name="intensity"
                      autoComplete="off"
                      value={form.intensity}
                      onChange={(event) => setForm((current) => ({ ...current, intensity: event.target.value as WorkoutTask['intensity'] }))}
                      className="w-full rounded-2xl border border-white/10 bg-[#0f151d] px-4 py-3 text-white outline-hidden transition-colors focus-visible:border-[var(--color-accent)]"
                    >
                      <option>Низька</option>
                      <option>Середня</option>
                      <option>Висока</option>
                    </select>
                  </FormField>
                  <FormField label="Дата" htmlFor="date">
                    <input
                      id="date"
                      name="date"
                      type="date"
                      autoComplete="off"
                      value={form.date}
                      onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                      className="w-full rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-white outline-hidden transition-colors focus-visible:border-[var(--color-accent)]"
                    />
                  </FormField>
                </div>
                <FormField label="Опис" htmlFor="description">
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    autoComplete="off"
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    placeholder="Коротко опиши мету тренування…"
                    className="w-full rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-white outline-hidden transition-colors placeholder:text-white/28 focus-visible:border-[var(--color-accent)]"
                  />
                </FormField>
                <FormField label="Нотатки" htmlFor="notes">
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    autoComplete="off"
                    value={form.notes}
                    onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                    placeholder="Що важливо памʼятати під час виконання…"
                    className="w-full rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-white outline-hidden transition-colors placeholder:text-white/28 focus-visible:border-[var(--color-accent)]"
                  />
                </FormField>
                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={requestCloseModal}
                    className="rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-white/82 transition-colors hover:bg-white/7 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
                  >
                    Скасувати
                  </button>
                  <button
                    type="submit"
                    className="rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-[#07110c] transition-colors hover:bg-[#74e4b1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
                  >
                    Зберегти задачу
                  </button>
                </div>
              </form>

              {showDiscardPrompt ? (
                <div className="absolute inset-0 flex items-center justify-center rounded-[30px] bg-[#090c11]/88 p-5">
                  <div className="w-full max-w-md rounded-[24px] border border-white/10 bg-[#0f151d] p-5">
                    <h3 className="text-lg font-semibold">Закрити без збереження?</h3>
                    <p className="mt-2 text-sm leading-6 text-white/65">У формі є незбережені зміни. Підтвердь дію або продовж редагування.</p>
                    <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        onClick={() => setShowDiscardPrompt(false)}
                        className="rounded-full border border-white/10 px-4 py-2.5 text-sm font-medium text-white/82 transition-colors hover:bg-white/7 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
                      >
                        Продовжити
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowDiscardPrompt(false)
                          setIsCreateOpen(false)
                          resetForm()
                        }}
                        className="rounded-full bg-[var(--color-accent-3)] px-4 py-2.5 text-sm font-semibold text-[#140903] transition-colors hover:bg-[#ffa678] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent-3)]"
                      >
                        Закрити без збереження
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  )
}

function TaskRow({
  task,
  actionHandlers,
  compact = false,
}: {
  task: WorkoutTask
  actionHandlers: TaskActions
  compact?: boolean
}) {
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

function TaskViewSwitch({
  taskView,
  onViewChange,
}: {
  taskView: 'today' | 'tomorrow'
  // Plain callback — no React internals leaking into child props
  onViewChange: (view: 'today' | 'tomorrow') => void
}) {
  return (
    <div className="relative inline-grid grid-cols-2 rounded-full border border-white/10 bg-black/18 p-1">
      <div
        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-[var(--color-accent)] transition-transform duration-200 ${
          taskView === 'today' ? 'translate-x-0' : 'translate-x-[calc(100%+4px)]'
        }`}
        aria-hidden="true"
      />
      <button
        type="button"
        onClick={() => onViewChange('today')}
        className={`relative z-10 rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] ${
          taskView === 'today' ? 'text-[#07110c]' : 'text-white/72'
        }`}
      >
        Сьогодні
      </button>
      <button
        type="button"
        onClick={() => onViewChange('tomorrow')}
        className={`relative z-10 rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] ${
          taskView === 'tomorrow' ? 'text-[#07110c]' : 'text-white/72'
        }`}
      >
        Завтра
      </button>
    </div>
  )
}

function TaskPage({
  tasks,
  toggleStep,
  actionHandlers,
}: {
  tasks: WorkoutTask[]
  toggleStep: (taskId: string, stepId: string) => void
  actionHandlers: TaskActions
}) {
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

function MetricPanel({ title, value, caption, icon: Icon }: { title: string; value: string; caption: string; icon: typeof Target }) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-black/12 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-white/58">{title}</div>
        <Icon className="size-4 text-[var(--color-accent)]" aria-hidden="true" />
      </div>
      <div className="mt-3 text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-sm text-white/50">{caption}</div>
    </div>
  )
}

function InfoCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
      <div className="text-sm text-white/55">{label}</div>
      <div className="mt-2 text-lg font-semibold" style={accent ? { color: accent } : undefined}>{value}</div>
    </div>
  )
}

function CompletedTaskActions({
  task,
  deleteTask,
  scheduleTaskForNextDay,
  compact = false,
  floating = false,
}: {
  task: WorkoutTask
  deleteTask: (taskId: string) => void
  scheduleTaskForNextDay: (taskId: string) => void
  compact?: boolean
  floating?: boolean
}) {
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

function ProgressRing({ value, color }: { value: number; color: string }) {
  const radius = 24
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true">
      <circle cx="28" cy="28" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
      <circle
        cx="28"
        cy="28"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 28 28)"
      />
      <text x="28" y="32" textAnchor="middle" fontSize="12" fill="white" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {value}%
      </text>
    </svg>
  )
}

function FormField({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-white/72">
        {label}
      </label>
      {children}
    </div>
  )
}

export default App
