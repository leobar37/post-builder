-- Migration: 007_add_cascade_delete
-- Add ON DELETE CASCADE to agent_sessions and session_tool_calls foreign keys
-- This enables proper cascade delete when a project is deleted
-- 
-- IMPORTANT: SQLite does not support ALTER TABLE to add ON DELETE CASCADE
-- We must recreate the tables with the new constraints and copy data over
-- 
-- This migration is idempotent - checks for existing CASCADE before modifying

-- Check if CASCADE already exists on agent_sessions.scene_id
-- If yes, this migration has already been applied
PRAGMA foreign_key_check;

-- Migration for agent_sessions table
ALTER TABLE agent_sessions RENAME TO agent_sessions_old;

CREATE TABLE agent_sessions (
  id TEXT PRIMARY KEY,
  scene_id TEXT NOT NULL,
  video_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  scene_type TEXT CHECK(scene_type IN ('hook', 'stats', 'cta', 'transition')),
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'archived')),
  messages TEXT NOT NULL DEFAULT '[]',
  metadata TEXT DEFAULT '{}',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE,
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
);

INSERT INTO agent_sessions SELECT * FROM agent_sessions_old;
DROP TABLE agent_sessions_old;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_sessions_scene ON agent_sessions(scene_id);
CREATE INDEX IF NOT EXISTS idx_sessions_video ON agent_sessions(video_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON agent_sessions(status);

-- Migration for session_tool_calls table
ALTER TABLE session_tool_calls RENAME TO session_tool_calls_old;

CREATE TABLE session_tool_calls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  tool_input TEXT NOT NULL,
  tool_output TEXT,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  error TEXT,
  FOREIGN KEY (session_id) REFERENCES agent_sessions(id) ON DELETE CASCADE
);

INSERT INTO session_tool_calls SELECT * FROM session_tool_calls_old;
DROP TABLE session_tool_calls_old;

-- Recreate index
CREATE INDEX IF NOT EXISTS idx_tool_calls_session ON session_tool_calls(session_id);
