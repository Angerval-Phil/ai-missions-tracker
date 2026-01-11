import Anthropic from '@anthropic-ai/sdk'

const anthropic = process.env.CLAUDE_API_KEY
  ? new Anthropic({ apiKey: process.env.CLAUDE_API_KEY })
  : null

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { message, extractionPrompt } = req.body

  if (!anthropic) {
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
}

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
