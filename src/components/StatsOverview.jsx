import { Target, CheckCircle2, Clock, BookOpen } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function StatsOverview() {
  const { getOverallStats } = useApp()
  const stats = getOverallStats()

  const statCards = [
    {
      label: 'Overall Progress',
      value: `${stats.completionPercentage}%`,
      icon: Target,
      color: 'text-teal',
      bgColor: 'bg-teal/10'
    },
    {
      label: 'Missions Completed',
      value: `${stats.completedMissions}/${stats.totalMissions}`,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      label: 'In Progress',
      value: stats.inProgressMissions,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100'
    },
    {
      label: 'Updates Logged',
      value: stats.totalLogs,
      icon: BookOpen,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {statCards.map((stat, idx) => (
        <div key={idx} className="bg-white rounded-2xl p-4 border-2 border-cream-dark shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${stat.bgColor}`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-brown font-[family-name:var(--font-display)]">
                {stat.value}
              </p>
              <p className="text-xs text-brown-light">{stat.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
