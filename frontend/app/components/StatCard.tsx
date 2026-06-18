interface StatCardProps {
  title: string
  value: string | number
  icon: string
  color: string
}

export default function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <div className={`bg-slate-800 border border-slate-700 rounded-2xl p-6`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-3xl">{icon}</span>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${color}`}>
          {title}
        </span>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  )
}