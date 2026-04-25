import { useState, useMemo, type FormEvent } from 'react'
import { format } from 'date-fns'
import { type TaskFormState, type WorkoutTask } from '../types/workout'
import { CATEGORIES, CATEGORY_COLORS } from '../constants/categories'
import { initialFormState } from '../lib/storage'

export function useCreateTaskModal(onTaskCreate?: (task: WorkoutTask) => void) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [showDiscardPrompt, setShowDiscardPrompt] = useState(false)
  const [form, setForm] = useState<TaskFormState>(() => initialFormState())

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
      color: CATEGORY_COLORS[CATEGORIES.indexOf(form.category) % CATEGORY_COLORS.length] ?? CATEGORY_COLORS[0]!,
      scheduledFor: form.date,
      notes: form.notes.trim(),
      repsPerSet: reps,
      setCount: sets,
      steps: Array.from({ length: sets }, (_, index) => ({
        id: `step-${crypto.randomUUID()}`,
        label: `Підхід ${index + 1} · ${reps} ${unit}`,
        completed: false,
      })),
    }

    onTaskCreate?.(newTask)
    setIsCreateOpen(false)
    setShowDiscardPrompt(false)
    resetForm()
  }

  return {
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
  }
}