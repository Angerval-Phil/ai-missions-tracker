import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useApp } from '../context/AppContext'
import { missions } from '../lib/missions'

export default function ProgressChart() {
  const { progress } = useApp()

  const chartData = missions.map(mission => {
    const missionProgress = progress[mission.id] || { goals: [] }
    const completedGoals = missionProgress.goals?.filter(g => g.completed).length || 0
    const totalGoals = missionProgress.goals?.length || 0
    const percentage = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0

    return {
      name: `W${mission.week}`,
      fullName: mission.title,
      progress: percentage,
      goals: `${completedGoals}/${totalGoals}`
    }
  })

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-cream-dark">
          <p className="font-semibold text-brown">{data.fullName}</p>
          <p className="text-sm text-teal">{data.progress}% complete</p>
          <p className="text-xs text-brown-light">{data.goals} goals</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white rounded-2xl p-6 border-2 border-cream-dark shadow-sm mb-8">
      <h3 className="text-lg font-semibold text-brown mb-4 font-[family-name:var(--font-display)]">
        Weekly Progress Overview
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2a9d8f" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#2a9d8f" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#8b7355', fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#8b7355', fontSize: 12 }}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="progress"
              stroke="#2a9d8f"
              strokeWidth={3}
              fill="url(#progressGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
