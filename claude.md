# AI Missions Tracker - Project Documentation

## Overview

A React-based progress tracking application for a 10-week AI Missions challenge. Users can track goals across 10 weekly missions, interact with an AI coach via chat, and visualize their progress.

## Tech Stack

- **Frontend**: React + Vite
- **Styling**: Tailwind CSS with custom color palette (cream, brown, teal)
- **Backend/Database**: Supabase (authentication + PostgreSQL)
- **AI Integration**: Claude API for NLP extraction and coaching responses
- **Icons**: Lucide React

## Key Features Built

### 1. Mission Tracking System
- 10 weekly missions with suggested goals
- Goal completion tracking with checkboxes
- Progress visualization with percentage bars
- Custom goal creation and removal
- Mission status: not_started → in_progress → completed

### 2. AI Coach Chat Interface
- Floating chat popup (accessible from any page)
- Natural language progress logging
- AI-powered coaching responses
- NLP extraction to automatically mark goals complete

### 3. NLP Goal Extraction
The system extracts structured data from user messages:
- Detects which mission/week the user is discussing
- Identifies completed tasks and matches them to existing goals
- Tracks in-progress tasks and blockers
- Analyzes sentiment (positive/neutral/negative/frustrated)

### 4. State Management
- React Context (`AppContext`) for global state
- `useRef` pattern for async-safe state access
- Local storage persistence for demo mode
- Supabase sync for authenticated users

## Architecture

```
src/
├── components/
│   ├── ChatInterface.jsx    # Main chat UI
│   ├── ChatPopup.jsx        # Floating chat button + popup
│   ├── Header.jsx           # Navigation header
│   ├── MissionCard.jsx      # Individual mission display
│   ├── ProgressChart.jsx    # Visual progress charts
│   ├── StatsOverview.jsx    # Dashboard statistics
│   └── WeeklySummary.jsx    # Weekly progress summary
├── context/
│   └── AppContext.jsx       # Global state management
├── lib/
│   ├── missions.js          # Mission definitions (10 weeks)
│   ├── nlpExtractor.js      # NLP extraction logic
│   └── supabase.js          # Supabase client
├── pages/
│   └── Dashboard.jsx        # Main dashboard page
└── App.jsx                  # Root component
```

## Critical Implementation Details

### Async State Management (AppContext.jsx)
We use a `useRef` pattern to avoid stale closure issues:

```javascript
const progressRef = useRef(progress)
useEffect(() => {
  progressRef.current = progress
}, [progress])

// All async functions use progressRef.current instead of progress
const completeGoalByText = async (missionId, taskText) => {
  const currentGoals = progressRef.current[missionId]?.goals || []
  // ...
}
```

### Goal Completion (markGoalComplete vs toggleGoal)
- `toggleGoal`: Flips completion state (true ↔ false) - used for manual clicks
- `markGoalComplete`: Only sets to true, never false - used by NLP extraction

### Fuzzy Text Matching (completeGoalByText)
Multiple strategies to match user input to goals:
1. Exact match
2. Contains match
3. Topic keyword overlap
4. Word overlap scoring (>40% threshold)

Also expands abbreviations: NLP → natural language processing, ML → machine learning, etc.

### NLP Extraction Prompt
The extraction prompt in `nlpExtractor.js` includes all 40 goal texts (4 per mission × 10 missions) so Claude can return exact matches.

## Supabase Schema

### Tables Required:
```sql
-- Progress tracking per mission
CREATE TABLE progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  mission_id INTEGER,
  status TEXT,
  goals JSONB,
  logs JSONB,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(user_id, mission_id)
);

-- Chat history
CREATE TABLE chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  role TEXT,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## API Endpoints (Serverless Functions)

### POST /api/extract
Extracts structured progress data from user messages using Claude.

Request:
```json
{
  "message": "I finished the NLP part for week 1",
  "extractionPrompt": "..."
}
```

Response:
```json
{
  "extracted": {
    "missionId": 1,
    "missionConfidence": "high",
    "completedTasks": ["Implement natural language processing for updates"],
    "inProgressTasks": [],
    "blockers": [],
    "sentiment": "positive"
  },
  "method": "claude"
}
```

### POST /api/chat
Gets AI coaching response with context.

Request:
```json
{
  "message": "I'm stuck on the dashboard",
  "history": [...],
  "progressContext": "...",
  "systemPrompt": "...",
  "extraction": {...}
}
```

## Bugs Fixed

### Goal Rollback Issue
**Problem**: Goals marked complete via chat would immediately roll back.

**Root Causes**:
1. Using `toggleGoal` (which flips state) instead of a dedicated `markGoalComplete`
2. Stale state in async operations due to React closure behavior
3. Supabase 409 Conflict errors from racing updates

**Solution**:
1. Created `markGoalComplete` function that only sets `completed: true`
2. Added `useRef` to track latest progress state
3. Used functional updates in `setProgress`
4. Added `onConflict: 'user_id,mission_id'` to Supabase upsert

### NLP Extraction Mismatch
**Problem**: Claude returned verbose text like "NLP component in Resolution Tracker" instead of exact goal text.

**Solution**: Updated `EXTRACTION_PROMPT` to include all 40 goal texts with explicit instructions to return exact matches.

## Environment Variables

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# Claude API
CLAUDE_API_KEY=your_claude_api_key
```

## Running the Project

```bash
npm install
npm run dev
```

The app runs at http://localhost:5173

## Demo Mode

If Supabase is not configured, the app runs in demo mode:
- Progress saved to localStorage
- No authentication required
- Chat still works if Claude API is configured
