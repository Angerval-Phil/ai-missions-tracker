import { useState } from 'react'
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Plus, X } from 'lucide-react'
import { getIconComponent } from '../lib/missions'
import { useApp } from '../context/AppContext'

export default function MissionCard({ mission }) {
  const { progress, toggleGoal, addGoal, removeGoal } = useApp()
  const [expanded, setExpanded] = useState(false)
  const [newGoal, setNewGoal] = useState('')

  const missionProgress = progress[mission.id] || { goals: [], status: 'not_started' }
  const completedGoals = missionProgress.goals?.filter(g => g.completed).length || 0
  const totalGoals = missionProgress.goals?.length || 0
  const percentage = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0

  const IconComponent = getIconComponent(mission.icon)

  const getStatusColor = () => {
    if (missionProgress.status === 'completed') return 'bg-green-100 border-green-300'
    if (missionProgress.status === 'in_progress') return 'bg-amber-50 border-amber-200'
    return 'bg-white border-cream-dark'
  }

  const handleAddGoal = (e) => {
    e.preventDefault()
    if (newGoal.trim()) {
      addGoal(mission.id, newGoal.trim())
      setNewGoal('')
    }
  }

  return (
    <div className={`rounded-2xl border-2 shadow-sm transition-all duration-300 hover:shadow-md ${getStatusColor()}`}>
      <div
        className="p-6 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-4">
          <div className="p-3 bg-cream rounded-xl">
            <IconComponent className="w-6 h-6 text-teal" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-teal">Week {mission.week}</span>
              {missionProgress.status === 'completed' && (
                <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
                  Complete
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-brown font-[family-name:var(--font-display)]">
              {mission.title}
            </h3>
            <p className="text-sm text-brown-light mt-1">{mission.description}</p>

            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-brown-light">{completedGoals} of {totalGoals} goals</span>
                <span className="font-medium text-teal">{percentage}%</span>
              </div>
              <div className="h-2 bg-cream rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          </div>

          <button className="p-2 hover:bg-cream rounded-lg transition-colors">
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-brown-light" />
            ) : (
              <ChevronDown className="w-5 h-5 text-brown-light" />
            )}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-6 pb-6 border-t border-cream-dark">
          <div className="pt-4 space-y-2">
            <h4 className="text-sm font-semibold text-brown mb-3">Goals</h4>
            {missionProgress.goals?.map(goal => (
              <div
                key={goal.id}
                className="flex items-center gap-2 group"
              >
                <button
                  onClick={() => toggleGoal(mission.id, goal.id)}
                  className="flex-1 flex items-center gap-3 p-3 rounded-lg hover:bg-cream transition-colors text-left"
                >
                  {goal.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-brown-light flex-shrink-0" />
                  )}
                  <span className={`text-sm ${goal.completed ? 'text-brown-light line-through' : 'text-brown'}`}>
                    {goal.text}
                  </span>
                </button>
                <button
                  onClick={() => removeGoal(mission.id, goal.id)}
                  className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-100 rounded-lg transition-all"
                  title="Remove goal"
                >
                  <X className="w-4 h-4 text-red-500" />
                </button>
              </div>
            ))}

            <form onSubmit={handleAddGoal} className="flex gap-2 mt-4">
              <input
                type="text"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                placeholder="Add a custom goal..."
                className="flex-1 px-4 py-2 rounded-lg border border-cream-dark bg-white text-brown text-sm placeholder:text-brown-light focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
              />
              <button
                type="submit"
                className="p-2 bg-teal text-white rounded-lg hover:bg-teal-dark transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </form>
          </div>

        </div>
      )}
    </div>
  )
}
