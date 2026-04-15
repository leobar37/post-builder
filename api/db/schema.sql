-- Instagram Reels Generation System - Database Schema
-- SQLite database for tracking videos, scenes, and projects

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  context_id TEXT NOT NULL UNIQUE,
  config TEXT,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Videos table
CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT CHECK(status IN ('draft', 'generating_idea', 'idea_ready', 'generating_clips', 'clips_ready', 'composing', 'completed', 'failed')) DEFAULT 'draft',
  prompt TEXT,
  -- Legacy fields (deprecated - use agent_sessions table instead)
  opencode_session_id TEXT,
  opencode_status TEXT,
  idea_title TEXT,
  idea_description TEXT,
  idea_json TEXT,
  context TEXT,
  output_path TEXT,
  output_url TEXT,
  total_scenes INTEGER DEFAULT 0,
  completed_scenes INTEGER DEFAULT 0,
  progress INTEGER DEFAULT 0,
  -- Active scene tracking for agent workflow
  active_scene_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME
);

-- Scenes table
CREATE TABLE IF NOT EXISTS scenes (
  id TEXT PRIMARY KEY,
  video_id TEXT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL,
  description TEXT,
  duration INTEGER DEFAULT 6,
  -- Scene type for multi-agent system
  scene_type TEXT CHECK(scene_type IN ('hook', 'stats', 'cta', 'transition')),
  minimax_task_id TEXT,
  minimax_status TEXT,
  minimax_prompt TEXT,
  context TEXT,
  clip_path TEXT,
  clip_url TEXT,
  file_id TEXT,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  -- Code editing fields (OpenCode integration)
  code_edit_status TEXT CHECK(code_edit_status IN ('idle', 'editing', 'completed', 'failed')) DEFAULT 'idle',
  code_edit_job_id TEXT,
  code_path TEXT,
  -- Agent session reference for multi-agent system
  agent_session_id TEXT REFERENCES agent_sessions(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  generated_at DATETIME
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id TEXT REFERENCES videos(id) ON DELETE CASCADE,
  session_id TEXT,
  type TEXT NOT NULL,
  source TEXT NOT NULL,
  data TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_project ON videos(project_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
CREATE INDEX IF NOT EXISTS idx_videos_session ON videos(opencode_session_id);
CREATE INDEX IF NOT EXISTS idx_videos_active_scene ON videos(active_scene_id);
CREATE INDEX IF NOT EXISTS idx_scenes_video ON scenes(video_id);
CREATE INDEX IF NOT EXISTS idx_scenes_sequence ON scenes(video_id, sequence);
CREATE INDEX IF NOT EXISTS idx_scenes_minimax ON scenes(minimax_task_id);
CREATE INDEX IF NOT EXISTS idx_scenes_status ON scenes(minimax_status);
CREATE INDEX IF NOT EXISTS idx_scenes_scene_type ON scenes(scene_type);
CREATE INDEX IF NOT EXISTS idx_scenes_agent_session ON scenes(agent_session_id);
CREATE INDEX IF NOT EXISTS idx_events_video ON events(video_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id, created_at DESC);

-- Sessions table for agent conversations
CREATE TABLE IF NOT EXISTS agent_sessions (
  id TEXT PRIMARY KEY,
  scene_id TEXT NOT NULL,
  video_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  scene_type TEXT CHECK(scene_type IN ('hook', 'stats', 'cta', 'transition')),
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'archived')),
  messages TEXT NOT NULL DEFAULT '[]', -- JSON array of CoreMessage
  metadata TEXT DEFAULT '{}', -- JSON object
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE,
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_sessions_scene ON agent_sessions(scene_id);
CREATE INDEX IF NOT EXISTS idx_sessions_video ON agent_sessions(video_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON agent_sessions(status);

-- Tool invocations log (for debugging/auditing)
CREATE TABLE IF NOT EXISTS session_tool_calls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  tool_input TEXT NOT NULL, -- JSON
  tool_output TEXT, -- JSON
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  error TEXT,
  FOREIGN KEY (session_id) REFERENCES agent_sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tool_calls_session ON session_tool_calls(session_id);

-- Insert sample data for testing (optional)
-- Uncomment for initial testing
/*
INSERT INTO videos (id, post_id, title, status, total_scenes) VALUES
  ('test123', 1, 'Test Video', 'draft', 3);

INSERT INTO scenes (id, video_id, sequence, name, composition_path, duration, status) VALUES
  ('scene1', 'test123', 1, 'Intro', 'compositions/Scene01.tsx', 3, 'pending'),
  ('scene2', 'test123', 2, 'Main', 'compositions/Scene02.tsx', 4, 'pending'),
  ('scene3', 'test123', 3, 'Outro', 'compositions/Scene03.tsx', 3, 'pending');
*/
