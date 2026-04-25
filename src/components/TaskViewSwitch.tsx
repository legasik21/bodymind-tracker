interface TaskViewSwitchProps {
  taskView: 'today' | 'tomorrow'
  onViewChange: (view: 'today' | 'tomorrow') => void
}

export default function TaskViewSwitch({ taskView, onViewChange }: TaskViewSwitchProps) {
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