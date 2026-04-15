import { nanoid } from "nanoid";
import { getDatabase } from "../client.js";
import type { Scene, SceneStatus } from "../../types/index.js";

export class SceneRepository {
  create(data: {
    id?: string;
    video_id: string;
    sequence: number;
    description?: string;
    duration?: number;
    minimax_prompt?: string;
    context?: Record<string, unknown>;
  }): Scene {
    const db = getDatabase();
    const id = data.id || nanoid();
    const stmt = db.prepare(`
      INSERT INTO scenes (id, video_id, sequence, description, duration, minimax_prompt, context, minimax_status, retry_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 0)
    `);
    stmt.run(
      id,
      data.video_id,
      data.sequence,
      data.description || null,
      data.duration || 6,
      data.minimax_prompt || null,
      data.context ? JSON.stringify(data.context) : null,
    );
    return this.getById(id)!;
  }

  getById(id: string): Scene | undefined {
    const db = getDatabase();
    const stmt = db.prepare("SELECT * FROM scenes WHERE id = ?");
    const row = stmt.get(id) as Record<string, unknown> | undefined;
    if (!row) return undefined;
    return this.parseScene(row);
  }

  getByVideoId(videoId: string): Scene[] {
    const db = getDatabase();
    const stmt = db.prepare(
      "SELECT * FROM scenes WHERE video_id = ? ORDER BY sequence",
    );
    return (stmt.all(videoId) as Record<string, unknown>[]).map(this.parseScene);
  }

  update(id: string, data: Partial<Scene>): Scene {
    const db = getDatabase();
    const fields: string[] = [];
    const values: unknown[] = [];

    const allowed = [
      "description",
      "duration",
      "scene_type",
      "minimax_task_id",
      "minimax_status",
      "minimax_prompt",
      "context",
      "clip_path",
      "clip_url",
      "file_id",
      "error_message",
      "retry_count",
      "code_edit_status",
      "code_edit_job_id",
      "code_path",
      "agent_session_id",
    ] as const;

    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(
          typeof data[key] === "object" ? JSON.stringify(data[key]) : data[key],
        );
      }
    }
    fields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);

    const stmt = db.prepare(
      `UPDATE scenes SET ${fields.join(", ")} WHERE id = ?`,
    );
    stmt.run(...values);
    return this.getById(id)!;
  }

  updateStatus(
    id: string,
    status: SceneStatus,
    extra?: {
      taskId?: string;
      clipPath?: string;
      fileId?: string;
      errorMessage?: string;
    },
  ): Scene {
    return this.update(id, {
      minimax_status: status,
      minimax_task_id: extra?.taskId,
      clip_path: extra?.clipPath,
      file_id: extra?.fileId,
      error_message: extra?.errorMessage,
      generated_at: status === "success" ? new Date().toISOString() : undefined,
    } as Partial<Scene>);
  }

  getCompletedCount(videoId: string): number {
    const db = getDatabase();
    const stmt = db.prepare(
      "SELECT COUNT(*) as count FROM scenes WHERE video_id = ? AND minimax_status = 'success'",
    );
    return (stmt.get(videoId) as { count: number }).count;
  }

  private parseScene(row: Record<string, unknown>): Scene {
    return {
      ...row,
      context: row.context ? JSON.parse(row.context as unknown as string) : null,
    } as Scene;
  }
}

// Singleton
let instance: SceneRepository | null = null;
export function getSceneRepository(): SceneRepository {
  if (!instance) instance = new SceneRepository();
  return instance;
}
