import Anthropic from '@anthropic-ai/sdk'

const anthropic = process.env.CLAUDE_API_KEY
  ? new Anthropic({ apiKey: process.env.CLAUDE_API_KEY })
  : null

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

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
}
