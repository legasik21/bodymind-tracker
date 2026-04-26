import { useMemo } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { addDays, format, isSameDay, parseISO, startOfMonth, startOfWeek, endOfMonth, endOfWeek } from 'date-fns'
import { uk } from 'date-fns/locale'
import { useWorkoutState } from './hooks/useWorkoutState'
import { CATEGORIES } from './constants/categories'
import { progress, isTaskCompleted, eachDay } from './lib/workoutUtils'
import DashboardPage from './pages/DashboardPage'
import TaskPage from './pages/TaskPage'

export default function App() {
  const { state, tasksSorted, taskView, setTaskView, toggleStep, addTask, actionHandlers, isLoading } = useWorkoutState()

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
            actionHandlers={actionHandlers}
            isLoading={isLoading}
            onTaskCreate={addTask}
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