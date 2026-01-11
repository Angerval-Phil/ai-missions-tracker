import { useState } from 'react'
import { FileText, Loader2, Calendar, TrendingUp, AlertTriangle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { missions } from '../lib/missions'

export default function WeeklySummary() {
  const { progress, chatHistory } = useApp()
  const [summary, setSummary] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const generateSummary = async () => {
    setIsGenerating(true)

    const progressContext = missions.map(m => {
      const p = progress[m.id] || { goals: [], logs: [] }
      const completedGoals = p.goals?.filter(g => g.completed).length || 0
      const totalGoals = p.goals?.length || 0
      const percentage = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0

      return {
        week: m.week,
        title: m.title,
        percentage,
        completedGoals,
        totalGoals,
        status: p.status,
        recentLogs: p.logs?.slice(-3) || []
      }
    })

    try {
      const response = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          progress: progressContext,
          recentActivity: chatHistory.slice(-20)
        })
      })

      if (response.ok) {
        const data = await response.json()
        setSummary(data)
      } else {
        setSummary(generateLocalSummary(progressContext))
      }
    } catch (error) {
      console.error('Summary generation error:', error)
      setSummary(generateLocalSummary(progressContext))
    }

    setIsGenerating(false)
  }

  const generateLocalSummary = (progressContext) => {
    const totalProgress = progressContext.reduce((sum, m) => sum + m.percentage, 0)
    const avgProgress = Math.round(totalProgress / progressContext.length)
    const completed = progressContext.filter(m => m.status === 'completed').length
    const inProgress = progressContext.filter(m => m.status === 'in_progress').length

    const behindSchedule = progressContext.filter((m, idx) => {
      const expectedProgress = ((idx + 1) / 10) * 100
      return m.percentage < expectedProgress - 20
    })

    return {
      overview: `You're ${avgProgress}% through your AI Missions journey with ${completed} missions completed and ${inProgress} in progress.`,
      strengths: completed > 0
        ? `Strong momentum on completed missions. Keep building on this foundation.`
        : `You've started tracking your progress - that's the first step!`,
      challenges: behindSchedule.length > 0
        ? `Weeks ${behindSchedule.map(m => m.week).join(', ')} are behind schedule. Time to catch up!`
        : `No major blockers identified. Keep pushing forward.`,
      nextSteps: [
        inProgress > 0 ? `Focus on completing Week ${progressContext.find(m => m.status === 'in_progress')?.week || 1}` : 'Start your first mission!',
        'Log daily progress to build accountability',
        'Challenge yourself with stretch goals'
      ]
    }
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-cream-dark shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-teal" />
          <h3 className="font-semibold text-brown font-[family-name:var(--font-display)]">
            Weekly Summary
          </h3>
        </div>
        <button
          onClick={generateSummary}
          disabled={isGenerating}
          className="px-4 py-2 bg-teal text-white text-sm rounded-lg hover:bg-teal-dark transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>Generate Report</>
          )}
        </button>
      </div>

      {summary ? (
        <div className="space-y-4">
          <div className="p-4 bg-cream rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-teal" />
              <span className="text-sm font-medium text-brown">Overview</span>
            </div>
            <p className="text-sm text-brown-light">{summary.overview}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-xl border border-green-100">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Strengths</span>
              </div>
              <p className="text-sm text-green-700">{summary.strengths}</p>
            </div>

            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">Challenges</span>
              </div>
              <p className="text-sm text-amber-700">{summary.challenges}</p>
            </div>
          </div>

          <div className="p-4 bg-teal/5 rounded-xl border border-teal/20">
            <span className="text-sm font-medium text-teal">Next Steps</span>
            <ul className="mt-2 space-y-1">
              {summary.nextSteps?.map((step, idx) => (
                <li key={idx} className="text-sm text-brown-light flex items-start gap-2">
                  <span className="text-teal">•</span>
                  {step}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-brown-light mx-auto mb-3 opacity-30" />
          <p className="text-sm text-brown-light">
            Generate a summary to get AI-powered insights on your progress
          </p>
        </div>
      )}
    </div>
  )
}
