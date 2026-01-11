import { useState } from 'react'
import { LayoutGrid, BarChart2 } from 'lucide-react'
import { missions } from '../lib/missions'
import MissionCard from '../components/MissionCard'
import StatsOverview from '../components/StatsOverview'
import ProgressChart from '../components/ProgressChart'
import WeeklySummary from '../components/WeeklySummary'
import ChatPopup from '../components/ChatPopup'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('missions')

  const tabs = [
    { id: 'missions', label: 'Missions', icon: LayoutGrid },
    { id: 'insights', label: 'Insights', icon: BarChart2 }
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <StatsOverview />

      <div className="flex gap-2 mb-6 bg-cream-dark/50 p-1 rounded-xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-teal shadow-sm'
                : 'text-brown-light hover:text-brown'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'missions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {missions.map(mission => (
            <MissionCard key={mission.id} mission={mission} />
          ))}
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="space-y-6">
          <ProgressChart />
          <WeeklySummary />

          <div className="bg-white rounded-2xl border-2 border-cream-dark shadow-sm p-6">
            <h3 className="font-semibold text-brown mb-4 font-[family-name:var(--font-display)]">
              Mission Breakdown
            </h3>
            <div className="space-y-3">
              {missions.map(mission => {
                return (
                  <div key={mission.id} className="flex items-center gap-4">
                    <span className="text-sm text-brown-light w-20">Week {mission.week}</span>
                    <span className="text-sm font-medium text-brown flex-1">{mission.title}</span>
                    <div className="w-32 h-2 bg-cream rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal rounded-full transition-all"
                        id={`progress-bar-${mission.id}`}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <ChatPopup />
    </div>
  )
}
