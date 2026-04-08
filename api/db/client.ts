import Database from 'better-sqlite3';
import { join } from 'path';
import { readFileSync } from 'fs';

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    const dbPath = join(process.cwd(), 'data', 'reels.db');
    db = new Database(dbPath);

    db.pragma('journal_mode = WAL');

    initializeSchema();
  }

  return db;
}

function initializeSchema() {
  if (!db) return;

  const schemaPath = join(__dirname, 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');

  db.exec(schema);
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

export interface Video {
  id: string;
  post_id: number;
  title: string;
  status: 'draft' | 'rendering' | 'completed' | 'failed';
  total_scenes: number;
  created_at: string;
  completed_at: string | null;
}

export interface Scene {
  id: string;
  video_id: string;
  sequence: number;
  name: string;
  composition_path: string | null;
  duration: number | null;
  status: 'pending' | 'rendering' | 'completed' | 'failed';
  elements: Record<string, unknown> | null;
  output_path: string | null;
  error_message: string | null;
  created_at: string;
}

export const VideoQueries = {
  create: (video: Omit<Video, 'created_at' | 'completed_at'>) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO videos (id, post_id, title, status, total_scenes)
      VALUES (?, ?, ?, ?, ?)
    `);
    return stmt.run(video.id, video.post_id, video.title, video.status, video.total_scenes);
  },

  getById: (id: string): Video | undefined => {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM videos WHERE id = ?');
    return stmt.get(id) as Video | undefined;
  },

  getAll: (status?: string): Video[] => {
    const db = getDatabase();
    if (status) {
      const stmt = db.prepare('SELECT * FROM videos WHERE status = ? ORDER BY created_at DESC');
      return stmt.all(status) as Video[];
    }
    const stmt = db.prepare('SELECT * FROM videos ORDER BY created_at DESC');
    return stmt.all() as Video[];
  },

  updateStatus: (id: string, status: Video['status']) => {
    const db = getDatabase();
    const stmt = db.prepare('UPDATE videos SET status = ? WHERE id = ?');
    return stmt.run(status, id);
  },

  complete: (id: string) => {
    const db = getDatabase();
    const stmt = db.prepare(
      'UPDATE videos SET status = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?',
    );
    return stmt.run('completed', id);
  },
};

export const SceneQueries = {
  create: (scene: Omit<Scene, 'created_at'>) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO scenes (id, video_id, sequence, name, composition_path, duration, status, elements, output_path)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      scene.id,
      scene.video_id,
      scene.sequence,
      scene.name,
      scene.composition_path,
      scene.duration,
      scene.status,
      scene.elements ? JSON.stringify(scene.elements) : null,
      scene.output_path,
    );
  },

  getByVideoId: (videoId: string): Scene[] => {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM scenes WHERE video_id = ? ORDER BY sequence');
    const scenes = stmt.all(videoId) as Scene[];
    return scenes.map((scene) => ({
      ...scene,
      elements: scene.elements ? JSON.parse(scene.elements as unknown as string) : null,
    }));
  },

  getById: (id: string): Scene | undefined => {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM scenes WHERE id = ?');
    const scene = stmt.get(id) as Scene | undefined;
    if (scene && scene.elements) {
      scene.elements = JSON.parse(scene.elements as unknown as string);
    }
    return scene;
  },

  updateStatus: (
    id: string,
    status: Scene['status'],
    outputPath?: string,
    errorMessage?: string,
  ) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE scenes 
      SET status = ?, output_path = ?, error_message = ?
      WHERE id = ?
    `);
    return stmt.run(status, outputPath || null, errorMessage || null, id);
  },

  getCompletedCount: (videoId: string): number => {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT COUNT(*) as count FROM scenes 
      WHERE video_id = ? AND status = 'completed'
    `);
    const result = stmt.get(videoId) as { count: number };
    return result.count;
  },
};
