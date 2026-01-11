import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, Sparkles, FileText } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { missions } from '../lib/missions'
import { extractProgressData, EXTRACTION_PROMPT } from '../lib/nlpExtractor'

const BASE_COACH_PERSONALITY = `You are a supportive AI accountability coach helping the user track progress on a 10-week AI Missions challenge.

Your coaching style:
- Be encouraging and constructive - celebrate wins genuinely
- Ask clarifying questions to understand their progress
- Offer helpful suggestions, not criticism
- Keep responses concise and friendly (2-4 sentences max)
- If they mention blockers, offer practical advice
- Acknowledge effort and progress, even small steps
- Be conversational and warm, like a supportive friend
- When relevant, share helpful resources and tips specific to their current mission

When users log progress:
1. Acknowledge what they've accomplished
2. Ask one follow-up question if helpful
3. Suggest a reasonable next step
4. If appropriate, recommend a relevant resource or tip

Keep it brief and positive. You're here to help, not lecture.`

// Build dynamic system prompt with mission-specific context
const buildCoachPrompt = (currentMission, allMissions) => {
  let prompt = BASE_COACH_PERSONALITY + '\n\n'

  // Add all missions overview
  prompt += 'The 10-week missions are:\n'
  prompt += allMissions.map(m => `Week ${m.week}: ${m.title} - ${m.description}`).join('\n')
  prompt += '\n\n'

  // Add current mission context with resources
  if (currentMission) {
    prompt += `=== CURRENT MISSION CONTEXT ===\n`
    prompt += `The user is currently working on Week ${currentMission.week}: ${currentMission.title}\n`
    prompt += `Description: ${currentMission.description}\n\n`

    prompt += `Goals for this mission:\n`
    currentMission.suggestedGoals.forEach((goal, i) => {
      prompt += `${i + 1}. ${goal}\n`
    })
    prompt += '\n'

    // Add resources
    if (currentMission.resources?.length > 0) {
      prompt += `Helpful resources you can recommend:\n`
      currentMission.resources.forEach(r => {
        if (r.type === 'link') {
          prompt += `- ${r.title}: ${r.url}\n`
        } else if (r.type === 'tip') {
          prompt += `- Tip: ${r.content}\n`
        }
      })
      prompt += '\n'
    }

    // Add challenge tips
    if (currentMission.challengeTips?.length > 0) {
      prompt += `Challenge tips to share when relevant:\n`
      currentMission.challengeTips.forEach(tip => {
        prompt += `- ${tip}\n`
      })
      prompt += '\n'
    }

    prompt += `When responding, naturally weave in relevant resources or tips if they would help the user. Don't dump all resources at once - share them contextually based on what the user is working on or struggling with.\n`
  }

  return prompt
}

// Detect which mission the user is likely working on
const detectCurrentMission = (extractionMissionId, progress, allMissions) => {
  // Priority 1: Use NLP extraction result if available
  if (extractionMissionId) {
    return allMissions.find(m => m.id === extractionMissionId)
  }

  // Priority 2: Find the most recently active mission (in_progress)
  const inProgressMission = allMissions.find(m => progress[m.id]?.status === 'in_progress')
  if (inProgressMission) {
    return inProgressMission
  }

  // Priority 3: Find first incomplete mission
  const incompleteMission = allMissions.find(m => progress[m.id]?.status !== 'completed')
  if (incompleteMission) {
    return incompleteMission
  }

  // Fallback: First mission
  return allMissions[0]
}

export default function ChatInterface({ isPopup = false }) {
  const { chatHistory, addChatMessage, progress, addLogEntry, toggleGoal, addGoal, updateProgress, completeGoalByText } = useApp()
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [lastExtraction, setLastExtraction] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatHistory])

  const getProgressContext = () => {
    return missions.map(m => {
      const p = progress[m.id] || { goals: [], logs: [] }
      const completedGoals = p.goals?.filter(g => g.completed).map(g => g.text) || []
      const pendingGoals = p.goals?.filter(g => !g.completed).map(g => g.text) || []
      const recentLogs = p.logs?.slice(-3).map(l => l.text) || []

      return `Week ${m.week} (${m.title}): Status: ${p.status}, Completed: [${completedGoals.join(', ')}], Pending: [${pendingGoals.join(', ')}], Recent logs: [${recentLogs.join(' | ')}]`
    }).join('\n')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setIsLoading(true)

    await addChatMessage({ role: 'user', content: userMessage })

    try {
      // Step 1: Extract structured data from the message using NLP
      const extractResponse = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          extractionPrompt: EXTRACTION_PROMPT
        })
      })

      let extraction = null
      if (extractResponse.ok) {
        const extractData = await extractResponse.json()
        extraction = extractData.extracted
        setLastExtraction({ ...extraction, method: extractData.method })

        // Step 2: Auto-apply extracted data to progress tracking
        if (extraction.missionId) {
          // Log the update to the mission
          await addLogEntry(extraction.missionId, userMessage)

          // For completed tasks: try to match existing goals first, then mark complete
          for (const task of extraction.completedTasks || []) {
            // First try to find and complete an existing matching goal
            const matched = await completeGoalByText(extraction.missionId, task)
            // If no match found, don't add as new goal (it was already done)
            if (!matched) {
              console.log(`No matching goal found for completed task: ${task}`)
            }
          }

          // For in-progress tasks: add as goals if they don't exist
          for (const task of extraction.inProgressTasks || []) {
            await addGoal(extraction.missionId, task)
          }

          // For new goals: add them to the mission
          for (const goal of extraction.newGoals || []) {
            await addGoal(extraction.missionId, goal)
            console.log(`Added new goal: ${goal}`)
          }

          // Update mission status based on extraction
          if (extraction.completedTasks?.length > 0 || extraction.inProgressTasks?.length > 0 || extraction.newGoals?.length > 0) {
            const currentStatus = progress[extraction.missionId]?.status
            if (currentStatus === 'not_started') {
              await updateProgress(extraction.missionId, { status: 'in_progress' })
            }
          }
        }
      }

      // Step 3: Detect current mission and build contextual prompt
      const currentMission = detectCurrentMission(extraction?.missionId, progress, missions)
      const contextualPrompt = buildCoachPrompt(currentMission, missions)

      // Step 4: Get AI coaching response with mission-specific context
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: chatHistory.slice(-10),
          progressContext: getProgressContext(),
          systemPrompt: contextualPrompt,
          extraction: extraction
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()

      await addChatMessage({ role: 'assistant', content: data.response })

      if (data.actions) {
        for (const action of data.actions) {
          if (action.type === 'log' && action.missionId) {
            await addLogEntry(action.missionId, action.text)
          }
          if (action.type === 'complete_goal' && action.missionId && action.goalId) {
            await toggleGoal(action.missionId, action.goalId)
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error)
      await addChatMessage({
        role: 'assistant',
        content: "I'm having trouble connecting right now. Make sure your Claude API is configured, or try again in a moment. In the meantime, don't use this as an excuse to slack off - go mark some goals complete manually!"
      })
    }

    setIsLoading(false)
    inputRef.current?.focus()
  }

  const suggestedPrompts = [
    "What should I focus on this week?",
    "I just finished working on my project",
    "I'm feeling stuck and unmotivated",
    "Give me a progress summary"
  ]

  return (
    <div className={`bg-white flex flex-col ${isPopup ? 'h-full' : 'rounded-2xl border-2 border-cream-dark shadow-sm h-[500px]'}`}>
      {!isPopup && (
        <div className="p-4 border-b border-cream-dark">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal/10 rounded-lg">
              <Bot className="w-5 h-5 text-teal" />
            </div>
            <div>
              <h3 className="font-semibold text-brown font-[family-name:var(--font-display)]">
                AI Coach
              </h3>
              <p className="text-xs text-brown-light">Log progress & get challenged</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.length === 0 && (
          <div className="text-center py-8">
            <Sparkles className="w-12 h-12 text-teal mx-auto mb-4 opacity-50" />
            <p className="text-brown-light mb-4">
              Start a conversation to log your progress and get personalized coaching.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestedPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(prompt)}
                  className="px-3 py-1.5 text-sm bg-cream hover:bg-cream-dark text-brown rounded-full transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {chatHistory.map((message, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`p-2 rounded-lg h-fit ${
              message.role === 'user' ? 'bg-teal/10' : 'bg-cream'
            }`}>
              {message.role === 'user' ? (
                <User className="w-4 h-4 text-teal" />
              ) : (
                <Bot className="w-4 h-4 text-brown" />
              )}
            </div>
            <div className={`max-w-[80%] p-3 rounded-2xl ${
              message.role === 'user'
                ? 'bg-teal text-white rounded-tr-sm'
                : 'bg-cream text-brown rounded-tl-sm'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p className={`text-xs mt-1 ${
                message.role === 'user' ? 'text-white/70' : 'text-brown-light'
              }`}>
                {message.timestamp && new Date(message.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="p-2 rounded-lg bg-cream h-fit">
              <Bot className="w-4 h-4 text-brown" />
            </div>
            <div className="bg-cream p-3 rounded-2xl rounded-tl-sm">
              <Loader2 className="w-5 h-5 text-teal animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* NLP Extraction Debug Panel */}
      {lastExtraction && (
        <div className="px-4 py-2 border-t border-cream-dark bg-cream/50">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-teal" />
            <span className="text-xs font-medium text-brown">NLP Extraction ({lastExtraction.method})</span>
          </div>
          <div className="text-xs text-brown-light space-y-1">
            {lastExtraction.missionId && (
              <p><span className="font-medium">Mission:</span> Week {lastExtraction.missionId} ({lastExtraction.missionConfidence} confidence)</p>
            )}
            {lastExtraction.completedTasks?.length > 0 && (
              <p><span className="font-medium text-green-600">Completed:</span> {lastExtraction.completedTasks.join(', ')}</p>
            )}
            {lastExtraction.inProgressTasks?.length > 0 && (
              <p><span className="font-medium text-amber-600">In Progress:</span> {lastExtraction.inProgressTasks.join(', ')}</p>
            )}
            {lastExtraction.newGoals?.length > 0 && (
              <p><span className="font-medium text-blue-600">New Goals Added:</span> {lastExtraction.newGoals.join(', ')}</p>
            )}
            {lastExtraction.blockers?.length > 0 && (
              <p><span className="font-medium text-red-600">Blockers:</span> {lastExtraction.blockers.join(', ')}</p>
            )}
            <p><span className="font-medium">Sentiment:</span> {lastExtraction.sentiment}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-4 border-t border-cream-dark">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Log your progress or ask for guidance..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-xl border border-cream-dark bg-cream text-brown placeholder:text-brown-light focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-3 bg-teal text-white rounded-xl hover:bg-teal-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  )
}
