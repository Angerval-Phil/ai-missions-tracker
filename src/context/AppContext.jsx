import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { missions } from '../lib/missions'

const AppContext = createContext()

const defaultProgress = missions.reduce((acc, mission) => {
  acc[mission.id] = {
    missionId: mission.id,
    status: 'not_started',
    goals: mission.suggestedGoals.map((goal, idx) => ({
      id: `${mission.id}-${idx}`,
      text: goal,
      completed: false
    })),
    logs: [],
    completedAt: null
  }
  return acc
}, {})

export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [progress, setProgress] = useState(defaultProgress)
  const [chatHistory, setChatHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(!isSupabaseConfigured())

  // Use ref to always have latest progress for async operations
  const progressRef = useRef(progress)
  useEffect(() => {
    progressRef.current = progress
  }, [progress])

  useEffect(() => {
    if (isSupabaseConfigured()) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          loadUserProgress(session.user.id)
        } else {
          loadLocalProgress()
        }
        setLoading(false)
      })

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          loadUserProgress(session.user.id)
        }
      })

      return () => subscription.unsubscribe()
    } else {
      loadLocalProgress()
      setLoading(false)
    }
  }, [])

  const loadLocalProgress = () => {
    const saved = localStorage.getItem('ai-missions-progress')
    const savedChat = localStorage.getItem('ai-missions-chat')
    if (saved) {
      setProgress(JSON.parse(saved))
    }
    if (savedChat) {
      setChatHistory(JSON.parse(savedChat))
    }
  }

  const saveLocalProgress = (newProgress) => {
    localStorage.setItem('ai-missions-progress', JSON.stringify(newProgress))
  }

  const saveLocalChat = (newChat) => {
    localStorage.setItem('ai-missions-chat', JSON.stringify(newChat))
  }

  const loadUserProgress = async (userId) => {
    if (!isSupabaseConfigured()) return

    const { data, error } = await supabase
      .from('progress')
      .select('*')
      .eq('user_id', userId)

    if (data && data.length > 0) {
      const progressMap = {}
      data.forEach(item => {
        progressMap[item.mission_id] = {
          missionId: item.mission_id,
          status: item.status,
          goals: item.goals,
          logs: item.logs,
          completedAt: item.completed_at
        }
      })
      setProgress({ ...defaultProgress, ...progressMap })
    }

    const { data: chatData } = await supabase
      .from('chat_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (chatData) {
      setChatHistory(chatData.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.created_at
      })))
    }
  }

  const updateProgress = async (missionId, updates) => {
    // Use functional update to get latest state
    let newProgressData = null

    setProgress(currentProgress => {
      const newProgress = {
        ...currentProgress,
        [missionId]: {
          ...currentProgress[missionId],
          ...updates
        }
      }
      newProgressData = newProgress
      progressRef.current = newProgress
      saveLocalProgress(newProgress)
      return newProgress
    })

    // Wait a tick for state to settle
    await new Promise(resolve => setTimeout(resolve, 10))

    if (user && isSupabaseConfigured() && newProgressData) {
      try {
        const missionData = newProgressData[missionId]
        await supabase.from('progress').upsert(
          {
            user_id: user.id,
            mission_id: missionId,
            status: missionData.status,
            goals: missionData.goals,
            logs: missionData.logs,
            completed_at: missionData.completedAt,
            updated_at: new Date().toISOString()
          },
          {
            onConflict: 'user_id,mission_id',
            ignoreDuplicates: false
          }
        )
      } catch (error) {
        console.error('Supabase upsert error:', error)
        // Local state is already updated, so the UI stays correct
      }
    }
  }

  const addChatMessage = async (message) => {
    const newMessage = {
      ...message,
      timestamp: new Date().toISOString()
    }
    const newHistory = [...chatHistory, newMessage]
    setChatHistory(newHistory)
    saveLocalChat(newHistory)

    if (user && isSupabaseConfigured()) {
      await supabase.from('chat_history').insert({
        user_id: user.id,
        role: message.role,
        content: message.content
      })
    }
  }

  const addLogEntry = async (missionId, entry) => {
    const currentLogs = progressRef.current[missionId]?.logs || []
    const newLog = {
      id: Date.now(),
      text: entry,
      timestamp: new Date().toISOString()
    }
    await updateProgress(missionId, {
      logs: [...currentLogs, newLog]
    })
  }

  const toggleGoal = async (missionId, goalId) => {
    const currentProgress = progressRef.current[missionId]
    const currentGoals = currentProgress?.goals || []
    const updatedGoals = currentGoals.map(goal =>
      goal.id === goalId ? { ...goal, completed: !goal.completed } : goal
    )

    const allCompleted = updatedGoals.every(g => g.completed)
    const anyCompleted = updatedGoals.some(g => g.completed)

    let newStatus = currentProgress?.status || 'not_started'
    if (allCompleted) {
      newStatus = 'completed'
    } else if (anyCompleted) {
      newStatus = 'in_progress'
    }

    await updateProgress(missionId, {
      goals: updatedGoals,
      status: newStatus,
      completedAt: allCompleted ? new Date().toISOString() : null
    })
  }

  // Mark a specific goal as complete (not toggle - only sets to true)
  const markGoalComplete = async (missionId, goalId) => {
    // Use ref to get latest progress
    const currentProgress = progressRef.current[missionId]
    const currentGoals = currentProgress?.goals || []
    const goal = currentGoals.find(g => g.id === goalId)

    // Only update if goal exists and isn't already completed
    if (!goal || goal.completed) {
      console.log('Goal already completed or not found, skipping')
      return
    }

    const updatedGoals = currentGoals.map(g =>
      g.id === goalId ? { ...g, completed: true } : g
    )

    const allCompleted = updatedGoals.every(g => g.completed)

    let newStatus = 'in_progress'
    if (allCompleted) {
      newStatus = 'completed'
    }

    console.log('markGoalComplete: updating goal', goalId, 'to completed')
    await updateProgress(missionId, {
      goals: updatedGoals,
      status: newStatus,
      completedAt: allCompleted ? new Date().toISOString() : null
    })
  }

  const addGoal = async (missionId, goalText) => {
    const currentGoals = progressRef.current[missionId]?.goals || []
    // Check if goal already exists (case-insensitive fuzzy match)
    const existingGoal = currentGoals.find(g =>
      g.text.toLowerCase().includes(goalText.toLowerCase()) ||
      goalText.toLowerCase().includes(g.text.toLowerCase())
    )
    if (existingGoal) {
      return existingGoal // Don't add duplicate
    }
    const newGoal = {
      id: `${missionId}-${Date.now()}`,
      text: goalText,
      completed: false
    }
    await updateProgress(missionId, {
      goals: [...currentGoals, newGoal]
    })
    return newGoal
  }

  const removeGoal = async (missionId, goalId) => {
    const currentGoals = progressRef.current[missionId]?.goals || []
    const updatedGoals = currentGoals.filter(goal => goal.id !== goalId)
    await updateProgress(missionId, {
      goals: updatedGoals
    })
  }

  // Find and mark a goal as complete by matching text
  const completeGoalByText = async (missionId, taskText) => {
    const currentGoals = progressRef.current[missionId]?.goals || []
    const lowerTask = taskText.toLowerCase().trim()

    // Expand abbreviations for better matching
    const expandAbbreviations = (str) => {
      return str
        .replace(/\bnlp\b/gi, 'natural language processing')
        .replace(/\bml\b/gi, 'machine learning')
        .replace(/\bai\b/gi, 'artificial intelligence')
        .replace(/\bui\b/gi, 'user interface')
        .replace(/\bux\b/gi, 'user experience')
        .replace(/\bapi\b/gi, 'application programming interface')
    }

    // Normalize text for comparison (remove extra spaces, punctuation)
    const normalize = (str) => str.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim()
    const expandedTask = expandAbbreviations(lowerTask)
    const normalizedTask = normalize(expandedTask)
    const taskWords = normalizedTask.split(' ').filter(w => w.length > 2)

    console.log('completeGoalByText called with:', { missionId, taskText, normalizedTask, taskWords })
    console.log('Available goals:', currentGoals.map(g => ({ id: g.id, text: g.text, completed: g.completed })))

    // Find matching goal with multiple strategies
    let matchingGoal = null
    let bestScore = 0

    for (const goal of currentGoals) {
      if (goal.completed) continue

      const lowerGoal = goal.text.toLowerCase()
      const expandedGoal = expandAbbreviations(lowerGoal)
      const normalizedGoal = normalize(expandedGoal)
      const goalWords = normalizedGoal.split(' ').filter(w => w.length > 2)

      console.log('Comparing task to goal:', { normalizedTask, normalizedGoal })

      // Strategy 1: Exact or near-exact match
      if (lowerGoal === lowerTask || normalizedGoal === normalizedTask) {
        console.log('Strategy 1 match (exact)')
        matchingGoal = goal
        break
      }

      // Strategy 2: One contains the other
      if (lowerGoal.includes(lowerTask) || lowerTask.includes(lowerGoal) ||
          normalizedGoal.includes(normalizedTask) || normalizedTask.includes(normalizedGoal)) {
        console.log('Strategy 2 match (contains)')
        matchingGoal = goal
        break
      }

      // Strategy 3: Check if key topic words match (e.g., "nlp" matches "natural language processing")
      const topicMatches = ['natural language', 'processing', 'visualization', 'dashboard', 'feedback', 'architecture', 'design', 'tracking', 'progress']
      const taskTopics = topicMatches.filter(t => normalizedTask.includes(t) || lowerTask.includes(t))
      const goalTopics = topicMatches.filter(t => normalizedGoal.includes(t) || lowerGoal.includes(t))
      const topicOverlap = taskTopics.filter(t => goalTopics.includes(t))

      if (topicOverlap.length > 0) {
        console.log('Strategy 3 match (topic overlap):', topicOverlap)
        matchingGoal = goal
        break
      }

      // Strategy 4: Word overlap score (count matching words)
      const matchingWords = taskWords.filter(word =>
        goalWords.includes(word) ||
        goalWords.some(gw => gw.includes(word) || word.includes(gw))
      )
      const score = matchingWords.length / Math.max(taskWords.length, goalWords.length)
      console.log('Word overlap:', { matchingWords, score })

      // If more than 40% of words match, consider it a match
      if (score > 0.4 && score > bestScore) {
        bestScore = score
        matchingGoal = goal
      }
    }

    if (matchingGoal) {
      console.log('Found matching goal, marking complete:', matchingGoal)
      await markGoalComplete(missionId, matchingGoal.id)
      return matchingGoal
    }
    console.log('No matching goal found')
    return null
  }

  const getOverallStats = () => {
    const missionValues = Object.values(progress)
    const totalMissions = missionValues.length
    const completedMissions = missionValues.filter(p => p.status === 'completed').length
    const inProgressMissions = missionValues.filter(p => p.status === 'in_progress').length

    const totalGoals = missionValues.reduce((sum, p) => sum + (p.goals?.length || 0), 0)
    const completedGoals = missionValues.reduce((sum, p) =>
      sum + (p.goals?.filter(g => g.completed).length || 0), 0)

    const totalLogs = missionValues.reduce((sum, p) => sum + (p.logs?.length || 0), 0)

    return {
      totalMissions,
      completedMissions,
      inProgressMissions,
      totalGoals,
      completedGoals,
      totalLogs,
      completionPercentage: totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0
    }
  }

  return (
    <AppContext.Provider value={{
      user,
      progress,
      chatHistory,
      loading,
      isDemo,
      updateProgress,
      addChatMessage,
      addLogEntry,
      toggleGoal,
      markGoalComplete,
      addGoal,
      removeGoal,
      completeGoalByText,
      getOverallStats
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}
