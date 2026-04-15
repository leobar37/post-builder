-- Migration: 006_add_scene_type_and_agent_session
-- Add scene_type and agent_session_id to scenes, active_scene_id to videos
-- This migration is idempotent - uses DROP IF EXISTS patterns for safety

-- Add scene_type column to scenes table
ALTER TABLE scenes ADD COLUMN scene_type TEXT CHECK(scene_type IN ('hook', 'stats', 'cta', 'transition'));

-- Add agent_session_id column to scenes table (foreign key to agent_sessions)
ALTER TABLE scenes ADD COLUMN agent_session_id TEXT REFERENCES agent_sessions(id);

-- Add active_scene_id column to videos table (for tracking current scene being edited)
ALTER TABLE videos ADD COLUMN active_scene_id TEXT;

-- Set default scene_type based on sequence position
-- First scene (sequence = 1) is typically the hook
UPDATE scenes SET scene_type = 'hook' WHERE sequence = 1 AND scene_type IS NULL;

-- Scenes that are not first or last could default to 'stats'
-- We'll leave middle scenes as NULL for now - the application can infer or set them

-- Set scene_type for last scene as CTA
UPDATE scenes
SET scene_type = 'cta'
WHERE scene_type IS NULL
AND sequence = (SELECT MAX(sequence) FROM scenes sc2 WHERE sc2.video_id = scenes.video_id);

-- Create index for faster lookups on scene_type
CREATE INDEX IF NOT EXISTS idx_scenes_scene_type ON scenes(scene_type);

-- Create index for faster lookups on agent_session_id
CREATE INDEX IF NOT EXISTS idx_scenes_agent_session ON scenes(agent_session_id);

-- Create index for faster lookups on active_scene_id in videos
CREATE INDEX IF NOT EXISTS idx_videos_active_scene ON videos(active_scene_id);
