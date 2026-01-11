# Supabase Setup Guide

Follow these steps to set up Supabase for your AI Missions Tracker.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/log in
2. Click "New Project"
3. Fill in:
   - **Name**: `ai-missions-tracker`
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose the closest to you
4. Click "Create new project" and wait for setup (~2 minutes)

## 2. Get Your API Keys

1. In your project dashboard, go to **Settings** (gear icon) → **API**
2. Copy these values:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

3. Create a `.env` file in your project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
CLAUDE_API_KEY=your-anthropic-api-key
```

## 3. Create Database Tables

Go to **SQL Editor** in Supabase and run this SQL:

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Progress table for tracking mission progress
create table progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  mission_id integer not null,
  status text default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  goals jsonb default '[]'::jsonb,
  logs jsonb default '[]'::jsonb,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id, mission_id)
);

-- Chat history table
create table chat_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamp with time zone default now()
);

-- Email reminders preferences
create table reminder_preferences (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade unique,
  enabled boolean default true,
  frequency text default 'daily' check (frequency in ('daily', 'weekly')),
  time_preference time default '09:00:00',
  timezone text default 'UTC',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table progress enable row level security;
alter table chat_history enable row level security;
alter table reminder_preferences enable row level security;

-- RLS Policies: Users can only access their own data
create policy "Users can view own progress"
  on progress for select
  using (auth.uid() = user_id);

create policy "Users can insert own progress"
  on progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update own progress"
  on progress for update
  using (auth.uid() = user_id);

create policy "Users can view own chat history"
  on chat_history for select
  using (auth.uid() = user_id);

create policy "Users can insert own chat history"
  on chat_history for insert
  with check (auth.uid() = user_id);

create policy "Users can manage own reminder preferences"
  on reminder_preferences for all
  using (auth.uid() = user_id);

-- Create indexes for better performance
create index idx_progress_user_id on progress(user_id);
create index idx_chat_history_user_id on chat_history(user_id);
create index idx_chat_history_created_at on chat_history(created_at);
```

## 4. Enable Authentication (Optional)

If you want user accounts:

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. (Optional) Enable Google, GitHub, etc.

For testing, you can use the app without auth - it will use localStorage.

## 5. Set Up Email Reminders (Optional)

For automated email reminders, you'll need to set up a Supabase Edge Function:

1. Install Supabase CLI: `npm install -g supabase`
2. Initialize: `supabase init`
3. Create function: `supabase functions new send-reminders`
4. Deploy and set up a cron trigger

Example edge function for reminders is in `/supabase/functions/send-reminders/`.

## 6. Get Claude API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up or log in
3. Go to **API Keys**
4. Click "Create Key"
5. Copy the key to your `.env` file as `CLAUDE_API_KEY`

## Running the App

```bash
# Start both frontend and backend
npm run dev:all

# Or run separately:
npm run dev      # Frontend on http://localhost:5173
npm run server   # Backend on http://localhost:3001
```

## Troubleshooting

### "Demo Mode" showing
- Check that `.env` file exists with correct Supabase credentials
- Restart both servers after adding credentials

### AI Coach not responding
- Verify `CLAUDE_API_KEY` is set correctly
- Check server console for errors
- Ensure the API server is running (`npm run server`)

### Data not persisting
- Without Supabase: Data saves to localStorage (browser only)
- With Supabase: Check RLS policies and that you're signed in
