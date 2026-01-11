import { Target, Leaf, FlaskConical, BarChart3, Eye, RefreshCw, Send, Zap, Brain, Rocket } from 'lucide-react'

export const missions = [
  {
    id: 1,
    week: 1,
    title: 'Resolution Tracker',
    description: 'Build a system to set, monitor, and achieve your goals throughout the year.',
    icon: 'Target',
    color: 'teal',
    suggestedGoals: [
      'Design the goal tracking system architecture',
      'Implement natural language processing for updates',
      'Create progress visualization dashboard',
      'Add intelligent feedback system'
    ],
    resources: [
      { type: 'link', title: 'Claude API Documentation', url: 'https://docs.anthropic.com/en/docs' },
      { type: 'link', title: 'React State Management Guide', url: 'https://react.dev/learn/managing-state' },
      { type: 'tip', content: 'Start with a simple data structure for goals before adding NLP complexity' },
      { type: 'tip', content: 'Use localStorage for quick prototyping before integrating a database' }
    ],
    challengeTips: [
      'Break down NLP processing into extraction, matching, and state update steps',
      'Test fuzzy matching with various phrasings of the same goal',
      'Consider using progress percentages to motivate users'
    ]
  },
  {
    id: 2,
    week: 2,
    title: 'Model Mapping',
    description: 'Learn to map and compare different AI models and their capabilities.',
    icon: 'Leaf',
    color: 'teal',
    suggestedGoals: [
      'Research major AI model families',
      'Create comparison framework',
      'Document strengths and weaknesses',
      'Build model selection guide'
    ],
    resources: [
      { type: 'link', title: 'Anthropic Model Overview', url: 'https://docs.anthropic.com/en/docs/about-claude/models' },
      { type: 'link', title: 'OpenAI Models Documentation', url: 'https://platform.openai.com/docs/models' },
      { type: 'tip', content: 'Focus on practical use cases rather than just benchmarks' },
      { type: 'tip', content: 'Consider cost, speed, and quality trade-offs for each model' }
    ],
    challengeTips: [
      'Create a decision matrix based on task type, budget, and latency requirements',
      'Test the same prompt across multiple models to compare outputs',
      'Document real-world performance, not just advertised capabilities'
    ]
  },
  {
    id: 3,
    week: 3,
    title: 'Deep Research',
    description: 'Master deep research techniques using AI tools.',
    icon: 'FlaskConical',
    color: 'teal',
    suggestedGoals: [
      'Learn advanced prompting for research',
      'Practice synthesizing multiple sources',
      'Create research workflow templates',
      'Complete a full research project'
    ],
    resources: [
      { type: 'link', title: 'Prompting Guide', url: 'https://www.promptingguide.ai/' },
      { type: 'link', title: 'Perplexity AI for Research', url: 'https://www.perplexity.ai/' },
      { type: 'tip', content: 'Use chain-of-thought prompting for complex research questions' },
      { type: 'tip', content: 'Always verify AI-generated facts with primary sources' }
    ],
    challengeTips: [
      'Break research into phases: explore, gather, synthesize, validate',
      'Create a template for consistent research documentation',
      'Use multiple AI tools to cross-reference findings'
    ]
  },
  {
    id: 4,
    week: 4,
    title: 'Data Analyst',
    description: 'Develop data analysis skills with AI assistance.',
    icon: 'BarChart3',
    color: 'teal',
    suggestedGoals: [
      'Learn data cleaning with AI',
      'Practice statistical analysis',
      'Create data visualizations',
      'Build an analysis pipeline'
    ],
    resources: [
      { type: 'link', title: 'Python Pandas Documentation', url: 'https://pandas.pydata.org/docs/' },
      { type: 'link', title: 'Chart.js for Visualizations', url: 'https://www.chartjs.org/docs/latest/' },
      { type: 'tip', content: 'Let AI help write data transformation code, but always validate the output' },
      { type: 'tip', content: 'Start with exploratory data analysis before diving into complex statistics' }
    ],
    challengeTips: [
      'Use AI to explain statistical concepts you encounter',
      'Create reusable code snippets for common data operations',
      'Always visualize data distributions before analysis'
    ]
  },
  {
    id: 5,
    week: 5,
    title: 'Visual Reasoning',
    description: 'Explore AI capabilities in visual understanding and reasoning.',
    icon: 'Eye',
    color: 'teal',
    suggestedGoals: [
      'Understand vision model capabilities',
      'Practice image analysis tasks',
      'Combine visual and text reasoning',
      'Build a visual reasoning project'
    ],
    resources: [
      { type: 'link', title: 'Claude Vision Capabilities', url: 'https://docs.anthropic.com/en/docs/build-with-claude/vision' },
      { type: 'link', title: 'OpenAI Vision Guide', url: 'https://platform.openai.com/docs/guides/vision' },
      { type: 'tip', content: 'Vision models work best with clear, well-lit images' },
      { type: 'tip', content: 'Combine image analysis with text prompts for richer understanding' }
    ],
    challengeTips: [
      'Test vision models on diverse image types: charts, diagrams, photos, screenshots',
      'Use specific questions to guide image analysis',
      'Consider multi-modal workflows combining vision and text'
    ]
  },
  {
    id: 6,
    week: 6,
    title: 'Information Pipelines',
    description: 'Build automated information processing pipelines.',
    icon: 'RefreshCw',
    color: 'teal',
    suggestedGoals: [
      'Design pipeline architecture',
      'Implement data ingestion',
      'Add transformation layers',
      'Create output formatting'
    ],
    resources: [
      { type: 'link', title: 'Zapier for No-Code Automation', url: 'https://zapier.com/learn' },
      { type: 'link', title: 'n8n Workflow Automation', url: 'https://docs.n8n.io/' },
      { type: 'tip', content: 'Start with a simple linear pipeline before adding complexity' },
      { type: 'tip', content: 'Add error handling and logging at each pipeline stage' }
    ],
    challengeTips: [
      'Map out data flow before writing any code',
      'Test each pipeline stage independently',
      'Consider idempotency for reliable re-runs'
    ]
  },
  {
    id: 7,
    week: 7,
    title: 'Automation: Distribution',
    description: 'Automate content distribution across platforms.',
    icon: 'Send',
    color: 'teal',
    suggestedGoals: [
      'Map distribution channels',
      'Create automation workflows',
      'Implement scheduling system',
      'Add analytics tracking'
    ],
    resources: [
      { type: 'link', title: 'Buffer for Social Scheduling', url: 'https://buffer.com/resources' },
      { type: 'link', title: 'Make.com (Integromat)', url: 'https://www.make.com/en/help' },
      { type: 'tip', content: 'Tailor content format for each platform rather than one-size-fits-all' },
      { type: 'tip', content: 'Track engagement metrics to optimize posting times' }
    ],
    challengeTips: [
      'Create content templates for consistent branding across platforms',
      'Use AI to repurpose content for different audiences',
      'Build in approval workflows for quality control'
    ]
  },
  {
    id: 8,
    week: 8,
    title: 'Automation: Productivity',
    description: 'Boost productivity through AI automation.',
    icon: 'Zap',
    color: 'teal',
    suggestedGoals: [
      'Identify automation opportunities',
      'Build productivity tools',
      'Integrate with existing workflow',
      'Measure time savings'
    ],
    resources: [
      { type: 'link', title: 'Raycast for Mac Productivity', url: 'https://www.raycast.com/' },
      { type: 'link', title: 'AutoHotkey for Windows', url: 'https://www.autohotkey.com/docs/' },
      { type: 'tip', content: 'Automate repetitive tasks you do more than 3 times per week' },
      { type: 'tip', content: 'Track time spent before and after automation to measure ROI' }
    ],
    challengeTips: [
      'Keep a log of repetitive tasks for one week to identify candidates',
      'Start with simple automations and gradually add complexity',
      'Document your automations for future reference'
    ]
  },
  {
    id: 9,
    week: 9,
    title: 'Context Engineering',
    description: 'Master the art of providing context to AI systems.',
    icon: 'Brain',
    color: 'teal',
    suggestedGoals: [
      'Learn context window optimization',
      'Practice prompt engineering',
      'Build context management system',
      'Create reusable context templates'
    ],
    resources: [
      { type: 'link', title: 'Anthropic Prompt Engineering Guide', url: 'https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering' },
      { type: 'link', title: 'OpenAI Prompt Engineering', url: 'https://platform.openai.com/docs/guides/prompt-engineering' },
      { type: 'tip', content: 'Put the most important context at the beginning and end of prompts' },
      { type: 'tip', content: 'Use system prompts to establish consistent behavior' }
    ],
    challengeTips: [
      'Experiment with different context orderings to see impact on output',
      'Create a library of tested, effective prompts',
      'Use XML tags or clear delimiters to structure context'
    ]
  },
  {
    id: 10,
    week: 10,
    title: 'Build an AI App',
    description: 'Culminate your learning by building a complete AI application.',
    icon: 'Rocket',
    color: 'teal',
    suggestedGoals: [
      'Define app concept and scope',
      'Design system architecture',
      'Implement core features',
      'Deploy and share your app'
    ],
    resources: [
      { type: 'link', title: 'Vercel Deployment Guide', url: 'https://vercel.com/docs' },
      { type: 'link', title: 'Supabase Quick Start', url: 'https://supabase.com/docs/guides/getting-started' },
      { type: 'tip', content: 'Start with an MVP - you can always add features later' },
      { type: 'tip', content: 'Use AI to help debug and explain error messages' }
    ],
    challengeTips: [
      'Scope ruthlessly - pick one core feature to nail first',
      'Get user feedback early and often',
      'Deploy early so you can iterate based on real usage'
    ]
  }
]

export const getIconComponent = (iconName) => {
  const icons = {
    Target,
    Leaf,
    FlaskConical,
    BarChart3,
    Eye,
    RefreshCw,
    Send,
    Zap,
    Brain,
    Rocket
  }
  return icons[iconName] || Target
}
