import { useMemo } from 'react'
import {
  Activity,
  BarChart3,
  CalendarRange,
  Dumbbell,
  Plus,
} from 'lucide-react'
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
import { addDays, format, isSameDay, parseISO, startOfMonth, startOfWeek, endOfMonth, endOfWeek } from 'date-fns'
import { uk } from 'date-fns/locale'
import { type WorkoutTask, type TaskActions, type Dispatch, type SetStateAction } from '../types/workout'
import { CATEGORIES, CATEGORY_COLORS } from '../constants/categories'
import { progress, isTaskCompleted, eachDay } from '../lib/workoutUtils'
import { useCreateTaskModal } from '../hooks/useCreateTaskModal'
import TaskRow from '../components/TaskRow'
import TaskViewSwitch from '../components/TaskViewSwitch'
import MetricPanel from '../components/MetricPanel'
import CreateTaskModal from '../components/CreateTaskModal'

interface DashboardPageProps {
  stats: { totalTasks: number; completedTasks: number; activeToday: number; averageProgress: number }
  todayTasks: WorkoutTask[]
  tomorrowTasks: WorkoutTask[]
  taskView: 'today' | 'tomorrow'
  setTaskView: Dispatch<SetStateAction<'today' | 'tomorrow'>>
  weeklySeries: { day: string; value: number }[]
  monthlyCompleted: number
  monthRange: Date[]
  categoryData: { name: string; value: number }[]
  actionHandlers: TaskActions
  isLoading: boolean
  onTaskCreate: (task: WorkoutTask) => void
}

export default function DashboardPage({
  stats,
  todayTasks,
  tomorrowTasks,
  taskView,
  setTaskView,
  weeklySeries,
  monthlyCompleted,
  monthRange,
  categoryData,
  actionHandlers,
  isLoading,
  onTaskCreate,
}: DashboardPageProps) {
  const {
    isCreateOpen,
    showDiscardPrompt,
    form,
    setForm,
    setIsCreateOpen,
    requestCloseModal,
    setShowDiscardPrompt,
    resetForm,
    createTask,
    hasUnsavedChanges,
  } = useCreateTaskModal({ taskView, onTaskCreate })

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
                  [...visibleTasks]
                    .sort((a, b) => progress(a) - progress(b))
                    .map((task) => (
                      <TaskRow key={task.id} task={task} actionHandlers={actionHandlers} />
                    ))
                ) : isLoading ? (
                  <div className="flex min-h-[220px] items-center justify-center rounded-[26px] border border-dashed border-white/10 bg-black/14 px-5 py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
                  </div>
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

        <CreateTaskModal
          isCreateOpen={isCreateOpen}
          showDiscardPrompt={showDiscardPrompt}
          form={form}
          setForm={setForm}
          setIsCreateOpen={setIsCreateOpen}
          requestCloseModal={requestCloseModal}
          setShowDiscardPrompt={setShowDiscardPrompt}
          resetForm={resetForm}
          createTask={createTask}
          hasUnsavedChanges={hasUnsavedChanges}
        />
      </main>
    </div>
  )
}