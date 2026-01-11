import express from 'express'
import cors from 'cors'
import Anthropic from '@anthropic-ai/sdk'
import 'dotenv/config'

const app = express()
app.use(cors())
app.use(express.json())

console.log('Claude API Key configured:', !!process.env.CLAUDE_API_KEY)

const anthropic = process.env.CLAUDE_API_KEY
  ? new Anthropic({ apiKey: process.env.CLAUDE_API_KEY })
  : null

app.post('/api/chat', async (req, res) => {
  if (!anthropic) {
    return res.status(503).json({
      error: 'Claude API not configured',
      response: "I'm not connected yet! Add your CLAUDE_API_KEY to the .env file to enable AI coaching. In the meantime, keep tracking your progress manually - no excuses!"
    })
  }

  try {
    const { message, history, progressContext, systemPrompt } = req.body

    const messages = [
      ...history.map(m => ({
        role: m.role,
        content: m.content
      })),
      {
        role: 'user',
        content: `Current progress state:\n${progressContext}\n\nUser message: ${message}`
      }
    ]

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages
    })

    const assistantMessage = response.content[0].text

    res.json({
      response: assistantMessage,
      actions: parseActions(assistantMessage, message)
    })
  } catch (error) {
    console.error('Claude API error:', error)
    res.status(500).json({
      error: 'Failed to get AI response',
      response: "Something went wrong on my end. But hey, that's not an excuse for you to stop working! Log your progress manually and try again later."
    })
  }
})

// NLP Extraction endpoint - extracts structured data from unstructured text
app.post('/api/extract', async (req, res) => {
  const { message, extractionPrompt } = req.body

  if (!anthropic) {
    // Return fallback extraction when API not configured
    return res.json({
      extracted: fallbackExtraction(message),
      method: 'fallback'
    })
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `${extractionPrompt}\n\nUser message to analyze:\n"${message}"`
      }]
    })

    const text = response.content[0].text
    const jsonMatch = text.match(/\{[\s\S]*\}/)

    if (jsonMatch) {
      res.json({
        extracted: JSON.parse(jsonMatch[0]),
        method: 'ai'
      })
    } else {
      res.json({
        extracted: fallbackExtraction(message),
        method: 'fallback'
      })
    }
  } catch (error) {
    console.error('Extraction error:', error)
    res.json({
      extracted: fallbackExtraction(message),
      method: 'fallback',
      error: error.message
    })
  }
})

// Fallback extraction using regex patterns
function fallbackExtraction(text) {
  const lower = text.toLowerCase()

  let missionId = null
  const weekMatch = lower.match(/week\s*(\d+)/i)
  if (weekMatch) {
    missionId = parseInt(weekMatch[1])
    if (missionId < 1 || missionId > 10) missionId = null
  }

  const missionKeywords = {
    1: ['resolution', 'tracker', 'goal tracking'],
    2: ['model mapping', 'compare models'],
    3: ['research', 'deep research'],
    4: ['data analyst', 'data analysis'],
    5: ['visual', 'vision', 'image'],
    6: ['pipeline'],
    7: ['distribution'],
    8: ['productivity'],
    9: ['context', 'prompt engineering'],
    10: ['build app', 'ai app']
  }

  if (!missionId) {
    for (const [id, keywords] of Object.entries(missionKeywords)) {
      if (keywords.some(kw => lower.includes(kw))) {
        missionId = parseInt(id)
        break
      }
    }
  }

  const completedTasks = []
  const completedMatch = text.match(/(?:finished|completed|done with|built|created)\s+([^.,]+)/gi)
  if (completedMatch) {
    completedMatch.forEach(m => {
      completedTasks.push(m.replace(/^(finished|completed|done with|built|created)\s+/i, '').trim())
    })
  }

  const inProgressTasks = []
  const progressMatch = text.match(/(?:working on|started|currently)\s+([^.,]+)/gi)
  if (progressMatch) {
    progressMatch.forEach(m => {
      inProgressTasks.push(m.replace(/^(working on|started|currently)\s+/i, '').trim())
    })
  }

  const blockers = []
  const blockerMatch = text.match(/(?:stuck on|struggling with|can't|having trouble)\s+([^.,]+)/gi)
  if (blockerMatch) {
    blockerMatch.forEach(m => {
      blockers.push(m.replace(/^(stuck on|struggling with|can't|having trouble)\s+/i, '').trim())
    })
  }

  const positiveWords = ['great', 'awesome', 'excited', 'good', 'excellent', 'amazing']
  const negativeWords = ['stuck', 'frustrated', 'confused', 'hard', 'struggling']
  const posCount = positiveWords.filter(w => lower.includes(w)).length
  const negCount = negativeWords.filter(w => lower.includes(w)).length

  let sentiment = 'neutral'
  if (posCount > negCount) sentiment = 'positive'
  else if (negCount > posCount) sentiment = negCount > 1 ? 'frustrated' : 'negative'

  return {
    missionId,
    missionConfidence: missionId ? 'medium' : 'low',
    completedTasks,
    inProgressTasks,
    blockers,
    sentiment,
    suggestedActions: [],
    rawSummary: text.slice(0, 100) + (text.length > 100 ? '...' : '')
  }
}

app.post('/api/summary', async (req, res) => {
  if (!anthropic) {
    return res.status(503).json({ error: 'Claude API not configured' })
  }

  try {
    const { progress, recentActivity } = req.body

    const prompt = `Based on this progress data, generate a weekly summary report.

Progress by week:
${JSON.stringify(progress, null, 2)}

Recent chat activity:
${recentActivity?.slice(-10).map(m => `${m.role}: ${m.content}`).join('\n') || 'No recent activity'}

Generate a JSON response with:
- overview: 1-2 sentence summary of overall progress
- strengths: what they're doing well
- challenges: areas needing attention
- nextSteps: array of 3 specific action items

Be direct and challenging in your assessment. Don't sugarcoat if they're behind.`

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    })

    const text = response.content[0].text
    const jsonMatch = text.match(/\{[\s\S]*\}/)

    if (jsonMatch) {
      res.json(JSON.parse(jsonMatch[0]))
    } else {
      res.json({
        overview: text.slice(0, 200),
        strengths: 'Keep tracking your progress consistently.',
        challenges: 'Stay focused on your weekly goals.',
        nextSteps: ['Review your current mission', 'Set specific daily targets', 'Log progress daily']
      })
    }
  } catch (error) {
    console.error('Summary error:', error)
    res.status(500).json({ error: 'Failed to generate summary' })
  }
})

function parseActions(aiResponse, userMessage) {
  const actions = []
  const lowerMessage = userMessage.toLowerCase()

  const weekMatches = lowerMessage.match(/week\s*(\d+)/gi)
  if (weekMatches) {
    const weekNum = parseInt(weekMatches[0].replace(/\D/g, ''))
    if (weekNum >= 1 && weekNum <= 10) {
      actions.push({
        type: 'log',
        missionId: weekNum,
        text: userMessage
      })
    }
  }

  const completionPhrases = ['finished', 'completed', 'done with', 'wrapped up']
  if (completionPhrases.some(phrase => lowerMessage.includes(phrase))) {
    actions.push({ type: 'check_completion' })
  }

  return actions
}

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`)
  if (!anthropic) {
    console.log('Warning: CLAUDE_API_KEY not set. AI features will be limited.')
  }
})
