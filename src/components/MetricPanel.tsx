import { type Target } from 'lucide-react'

interface MetricPanelProps {
  title: string
  value: string
  caption: string
  icon: typeof Target
}

export default function MetricPanel({ title, value, caption, icon: Icon }: MetricPanelProps) {
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