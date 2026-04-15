import { nanoid } from "nanoid";
import { getDatabase } from "../client.js";
import type { Video, VideoStatus } from "../../types/index.js";

export class VideoRepository {
  create(data: {
    id?: string;
    project_id: string;
    title: string;
    prompt?: string;
    status?: VideoStatus;
  }): Video {
    const db = getDatabase();
    const id = data.id || nanoid();
    const stmt = db.prepare(`
      INSERT INTO videos (id, project_id, title, prompt, status, total_scenes, completed_scenes, progress)
      VALUES (?, ?, ?, ?, ?, 0, 0, 0)
    `);
    stmt.run(
      id,
      data.project_id,
      data.title,
      data.prompt || null,
      data.status || "draft",
    );
    return this.getById(id)!;
  }

  getById(id: string): Video | undefined {
    const db = getDatabase();
    const stmt = db.prepare("SELECT * FROM videos WHERE id = ?");
    const row = stmt.get(id) as Record<string, unknown> | undefined;
    if (!row) return undefined;
    return this.parseVideo(row);
  }

  getByProjectId(projectId: string): Video[] {
    const db = getDatabase();
    const stmt = db.prepare(
      "SELECT * FROM videos WHERE project_id = ? ORDER BY created_at DESC",
    );
    return (stmt.all(projectId) as Record<string, unknown>[]).map(this.parseVideo);
  }

  getAll(status?: VideoStatus): Video[] {
    const db = getDatabase();
    let stmt;
    if (status) {
      stmt = db.prepare(
        "SELECT * FROM videos WHERE status = ? ORDER BY created_at DESC",
      );
      return (stmt.all(status) as Record<string, unknown>[]).map(this.parseVideo);
    }
    stmt = db.prepare("SELECT * FROM videos ORDER BY created_at DESC");
    return (stmt.all() as Record<string, unknown>[]).map(this.parseVideo);
  }

  update(id: string, data: Partial<Video>): Video {
    const db = getDatabase();
    const fields: string[] = [];
    const values: unknown[] = [];

    const allowed = [
      "status",
      "prompt",
      "opencode_session_id",
      "opencode_status",
      "idea_title",
      "idea_description",
      "idea_json",
      "context",
      "output_path",
      "output_url",
      "total_scenes",
      "completed_scenes",
      "progress",
      "active_scene_id",
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
      `UPDATE videos SET ${fields.join(", ")} WHERE id = ?`,
    );
    stmt.run(...values);
    return this.getById(id)!;
  }

  updateStatus(id: string, status: VideoStatus): Video {
    return this.update(id, { status });
  }

  updateIdea(
    id: string,
    idea: { title: string; description: string; scenes: unknown[] },
  ): Video {
    return this.update(id, {
      idea_title: idea.title,
      idea_description: idea.description,
      idea_json: JSON.stringify(idea.scenes),
      status: "idea_ready",
    });
  }

  updateProgress(id: string): Video {
    const db = getDatabase();
    const sceneStmt = db.prepare(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN minimax_status = 'success' THEN 1 END) as completed
      FROM scenes WHERE video_id = ?
    `);
    const { total, completed } = sceneStmt.get(id) as {
      total: number;
      completed: number;
    };
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    return this.update(id, { completed_scenes: completed, progress });
  }

  complete(id: string, outputPath?: string): Video {
    return this.update(id, {
      status: "completed",
      completed_at: new Date().toISOString(),
      output_path: outputPath || undefined,
    });
  }

  delete(id: string): void {
    const db = getDatabase();
    db.prepare("DELETE FROM videos WHERE id = ?").run(id);
  }

  private parseVideo(row: Record<string, unknown>): Video {
    return {
      ...row,
      context: row.context ? JSON.parse(row.context as unknown as string) : null,
    } as Video;
  }
}

// Singleton
let instance: VideoRepository | null = null;
export function getVideoRepository(): VideoRepository {
  if (!instance) instance = new VideoRepository();
  return instance;
}
