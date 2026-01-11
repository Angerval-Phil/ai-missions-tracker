// NLP Module for extracting structured goal/progress data from unstructured text

const EXTRACTION_PROMPT = `You are an NLP extraction system. Analyze the user's message and extract structured progress data.

The user is tracking progress on a 10-week AI Missions challenge with these specific goals:

Week 1 - Resolution Tracker goals:
- "Design the goal tracking system architecture"
- "Implement natural language processing for updates"
- "Create progress visualization dashboard"
- "Add intelligent feedback system"

Week 2 - Model Mapping goals:
- "Research major AI model families"
- "Create comparison framework"
- "Document strengths and weaknesses"
- "Build model selection guide"

Week 3 - Deep Research goals:
- "Learn advanced prompting for research"
- "Practice synthesizing multiple sources"
- "Create research workflow templates"
- "Complete a full research project"

Week 4 - Data Analyst goals:
- "Learn data cleaning with AI"
- "Practice statistical analysis"
- "Create data visualizations"
- "Build an analysis pipeline"

Week 5 - Visual Reasoning goals:
- "Understand vision model capabilities"
- "Practice image analysis tasks"
- "Combine visual and text reasoning"
- "Build a visual reasoning project"

Week 6 - Information Pipelines goals:
- "Design pipeline architecture"
- "Implement data ingestion"
- "Add transformation layers"
- "Create output formatting"

Week 7 - Distribution goals:
- "Map distribution channels"
- "Create automation workflows"
- "Implement scheduling system"
- "Add analytics tracking"

Week 8 - Productivity goals:
- "Identify automation opportunities"
- "Build productivity tools"
- "Integrate with existing workflow"
- "Measure time savings"

Week 9 - Context Engineering goals:
- "Learn context window optimization"
- "Practice prompt engineering"
- "Build context management system"
- "Create reusable context templates"

Week 10 - Build AI App goals:
- "Define app concept and scope"
- "Design system architecture"
- "Implement core features"
- "Deploy and share your app"

IMPORTANT RULES:
1. When the user mentions COMPLETING a task, match it to the EXACT goal text from above.
   Examples:
   - "finished the NLP part" -> completedTasks: ["Implement natural language processing for updates"]
   - "done with NLP" -> completedTasks: ["Implement natural language processing for updates"]
   - "completed the dashboard" -> completedTasks: ["Create progress visualization dashboard"]

2. When the user wants to ADD a new goal or task, extract the new goal text.
   Examples:
   - "add a goal for vision models" -> newGoals: ["Investigate vision models"]
   - "I want to add testing to week 1" -> newGoals: ["Add testing"]
   - "can you add a 5th goal about video prompting" -> newGoals: ["Explore video prompting"]

3. When the user mentions working on something, add to inProgressTasks.
   - Use EXACT goal text if it matches an existing goal
   - Otherwise, add the new task description

Extract:
1. missionId: Which week (1-10) based on keywords/context
2. completedTasks: Array of EXACT goal texts from above that match what they completed
3. inProgressTasks: Array of EXACT goal texts they're working on (existing goals only)
4. newGoals: Array of NEW goals the user wants to add (not in the list above)
5. blockers: Any challenges mentioned
6. sentiment: positive/neutral/negative/frustrated

Respond ONLY with valid JSON:
{
  "missionId": number or null,
  "missionConfidence": "high" | "medium" | "low",
  "completedTasks": ["exact goal text from list above"],
  "inProgressTasks": ["exact goal text from list above"],
  "newGoals": ["new goal text to add"],
  "blockers": ["blocker description"],
  "sentiment": "positive" | "neutral" | "negative" | "frustrated",
  "suggestedActions": [],
  "rawSummary": "Brief summary"
}`

export async function extractProgressData(userMessage, apiEndpoint = '/api/extract') {
  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMessage,
        extractionPrompt: EXTRACTION_PROMPT
      })
    })

    if (!response.ok) {
      throw new Error('Extraction failed')
    }

    const data = await response.json()
    return {
      success: true,
      data: data.extracted,
      raw: userMessage
    }
  } catch (error) {
    console.error('NLP extraction error:', error)
    return {
      success: false,
      error: error.message,
      data: fallbackExtraction(userMessage),
      raw: userMessage
    }
  }
}

// Fallback local extraction when API is unavailable
function fallbackExtraction(text) {
  const lower = text.toLowerCase()

  // Detect mission/week
  let missionId = null
  const weekMatch = lower.match(/week\s*(\d+)/i)
  if (weekMatch) {
    missionId = parseInt(weekMatch[1])
    if (missionId < 1 || missionId > 10) missionId = null
  }

  // Keyword-based mission detection
  const missionKeywords = {
    1: ['resolution', 'tracker', 'goal tracking', 'goals'],
    2: ['model mapping', 'compare models', 'ai models'],
    3: ['research', 'deep research'],
    4: ['data analyst', 'data analysis', 'analyze data'],
    5: ['visual', 'vision', 'image'],
    6: ['pipeline', 'information pipeline'],
    7: ['distribution', 'automate distribution'],
    8: ['productivity', 'automate productivity'],
    9: ['context', 'context engineering', 'prompt'],
    10: ['build app', 'ai app', 'application']
  }

  if (!missionId) {
    for (const [id, keywords] of Object.entries(missionKeywords)) {
      if (keywords.some(kw => lower.includes(kw))) {
        missionId = parseInt(id)
        break
      }
    }
  }

  // Detect completed tasks
  const completedPatterns = [
    /(?:finished|completed|done with|wrapped up|built|created|implemented)\s+(.+?)(?:\.|,|$)/gi,
    /(?:i|we)\s+(?:finished|completed|did|made)\s+(.+?)(?:\.|,|$)/gi
  ]

  const completedTasks = []
  for (const pattern of completedPatterns) {
    let match
    while ((match = pattern.exec(text)) !== null) {
      completedTasks.push(match[1].trim())
    }
  }

  // Detect in-progress tasks
  const inProgressPatterns = [
    /(?:working on|started|beginning|currently)\s+(.+?)(?:\.|,|$)/gi,
    /(?:still|halfway through|in the middle of)\s+(.+?)(?:\.|,|$)/gi
  ]

  const inProgressTasks = []
  for (const pattern of inProgressPatterns) {
    let match
    while ((match = pattern.exec(text)) !== null) {
      inProgressTasks.push(match[1].trim())
    }
  }

  // Detect blockers
  const blockerPatterns = [
    /(?:stuck on|blocked by|struggling with|can't figure out|having trouble with)\s+(.+?)(?:\.|,|$)/gi,
    /(?:issue|problem|challenge|difficulty)\s+(?:with|is)\s+(.+?)(?:\.|,|$)/gi
  ]

  const blockers = []
  for (const pattern of blockerPatterns) {
    let match
    while ((match = pattern.exec(text)) !== null) {
      blockers.push(match[1].trim())
    }
  }

  // Detect sentiment
  const positiveWords = ['great', 'awesome', 'excited', 'happy', 'good', 'excellent', 'amazing', 'love']
  const negativeWords = ['stuck', 'frustrated', 'confused', 'hard', 'difficult', 'struggling', 'hate', 'annoying']

  const positiveCount = positiveWords.filter(w => lower.includes(w)).length
  const negativeCount = negativeWords.filter(w => lower.includes(w)).length

  let sentiment = 'neutral'
  if (positiveCount > negativeCount) sentiment = 'positive'
  else if (negativeCount > positiveCount) sentiment = negativeCount > 1 ? 'frustrated' : 'negative'

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

export { fallbackExtraction, EXTRACTION_PROMPT }
