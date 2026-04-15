import { getDatabase } from "../client.js";
import type { Event, EventType, EventSource } from "../../types/index.js";

export class EventRepository {
  create(data: {
    video_id?: string;
    session_id?: string;
    type: EventType;
    source: EventSource;
    data?: Record<string, unknown>;
  }): Event {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO events (video_id, session_id, type, source, data)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      data.video_id || null,
      data.session_id || null,
      data.type,
      data.source,
      data.data ? JSON.stringify(data.data) : null,
    );
    return this.getById(result.lastInsertRowid as number)!;
  }

  getById(id: number): Event | undefined {
    const db = getDatabase();
    const stmt = db.prepare("SELECT * FROM events WHERE id = ?");
    const row = stmt.get(id) as Record<string, unknown> | undefined;
    if (!row) return undefined;
    return this.parseEvent(row);
  }

  getByVideoId(videoId: string, limit = 100): Event[] {
    const db = getDatabase();
    const stmt = db.prepare(
      "SELECT * FROM events WHERE video_id = ? ORDER BY created_at DESC LIMIT ?",
    );
    return (stmt.all(videoId, limit) as Record<string, unknown>[]).map(
      this.parseEvent,
    );
  }

  getBySessionId(sessionId: string, limit = 100): Event[] {
    const db = getDatabase();
    const stmt = db.prepare(
      "SELECT * FROM events WHERE session_id = ? ORDER BY created_at DESC LIMIT ?",
    );
    return (stmt.all(sessionId, limit) as Record<string, unknown>[]).map(
      this.parseEvent,
    );
  }

  private parseEvent(row: Record<string, unknown>): Event {
    return {
      ...row,
      data: row.data ? JSON.parse(row.data as unknown as string) : null,
    } as Event;
  }
}

// Singleton
let instance: EventRepository | null = null;
export function getEventRepository(): EventRepository {
  if (!instance) instance = new EventRepository();
  return instance;
}
