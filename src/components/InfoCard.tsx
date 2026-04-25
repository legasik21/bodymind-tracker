interface InfoCardProps {
  label: string
  value: string
  accent?: string
}

export default function InfoCard({ label, value, accent }: InfoCardProps) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
      <div className="text-sm text-white/55">{label}</div>
      <div className="mt-2 text-lg font-semibold" style={accent ? { color: accent } : undefined}>{value}</div>
    </div>
  )
}