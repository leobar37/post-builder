-- Instagram Reels Generation System - Database Schema
-- SQLite database for tracking videos and scenes

-- Videos table
CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  post_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  status TEXT CHECK(status IN ('draft', 'rendering', 'completed', 'failed')) DEFAULT 'draft',
  total_scenes INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME
);

-- Scenes table
CREATE TABLE IF NOT EXISTS scenes (
  id TEXT PRIMARY KEY,
  video_id TEXT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL,
  name TEXT NOT NULL,
  composition_path TEXT,
  duration INTEGER,
  status TEXT CHECK(status IN ('pending', 'rendering', 'completed', 'failed')) DEFAULT 'pending',
  elements TEXT, -- JSON stored as TEXT
  output_path TEXT,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_scenes_video ON scenes(video_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
CREATE INDEX IF NOT EXISTS idx_scenes_status ON scenes(status);

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
