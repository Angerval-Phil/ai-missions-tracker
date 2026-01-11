import Anthropic from '@anthropic-ai/sdk'

const anthropic = process.env.CLAUDE_API_KEY
  ? new Anthropic({ apiKey: process.env.CLAUDE_API_KEY })
  : null

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!anthropic) {
    return res.status(503).json({
      error: 'Claude API not configured',
      response: "I'm not connected yet! Add your CLAUDE_API_KEY to the environment variables to enable AI coaching. In the meantime, keep tracking your progress manually - no excuses!"
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
}

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
