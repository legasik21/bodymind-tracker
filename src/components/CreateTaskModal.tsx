import { useEffect } from 'react'
import { type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { type WorkoutTask, type TaskFormState, type TaskActions } from '../types/workout'
import FormField from './FormField'

interface CreateTaskModalProps {
  isCreateOpen: boolean
  showDiscardPrompt: boolean
  form: TaskFormState
  setForm: React.Dispatch<React.SetStateAction<TaskFormState>>
  setIsCreateOpen: React.Dispatch<React.SetStateAction<boolean>>
  requestCloseModal: () => void
  setShowDiscardPrompt: React.Dispatch<React.SetStateAction<boolean>>
  resetForm: () => void
  createTask: (event: FormEvent<HTMLFormElement>) => void
  hasUnsavedChanges: boolean
}

export default function CreateTaskModal({
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
}: CreateTaskModalProps) {
  if (!isCreateOpen) return null

  return (
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
  )
}