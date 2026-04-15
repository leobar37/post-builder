import { nanoid } from "nanoid";
import { getDatabase } from "../client.js";
import type { Project, ProjectStatus } from "../../types/index.js";

export class ProjectRepository {
  create(data: {
    name: string;
    description?: string;
    context_id: string;
    config?: Record<string, unknown>;
  }): Project {
    const db = getDatabase();
    const id = nanoid();
    const stmt = db.prepare(`
      INSERT INTO projects (id, name, description, context_id, config, status)
      VALUES (?, ?, ?, ?, ?, 'active')
    `);
    stmt.run(
      id,
      data.name,
      data.description || null,
      data.context_id,
      data.config ? JSON.stringify(data.config) : null,
    );
    return this.getById(id)!;
  }

  getById(id: string): Project | undefined {
    const db = getDatabase();
    const stmt = db.prepare("SELECT * FROM projects WHERE id = ?");
    const row = stmt.get(id) as Record<string, unknown> | undefined;
    if (!row) return undefined;
    return {
      ...row,
      config: row.config ? JSON.parse(row.config as unknown as string) : null,
    } as Project;
  }

  getAll(status?: ProjectStatus): Project[] {
    const db = getDatabase();
    let stmt;
    if (status) {
      stmt = db.prepare(
        "SELECT * FROM projects WHERE status = ? ORDER BY created_at DESC",
      );
      return (stmt.all(status) as Record<string, unknown>[]).map(this.parseProject);
    }
    stmt = db.prepare("SELECT * FROM projects ORDER BY created_at DESC");
    return (stmt.all() as Record<string, unknown>[]).map(this.parseProject);
  }

  update(
    id: string,
    data: Partial<Pick<Project, "name" | "description" | "status">>,
  ): Project {
    const db = getDatabase();
    const fields: string[] = [];
    const values: unknown[] = [];
    if (data.name !== undefined) {
      fields.push("name = ?");
      values.push(data.name);
    }
    if (data.description !== undefined) {
      fields.push("description = ?");
      values.push(data.description);
    }
    if (data.status !== undefined) {
      fields.push("status = ?");
      values.push(data.status);
    }
    fields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);
    const stmt = db.prepare(
      `UPDATE projects SET ${fields.join(", ")} WHERE id = ?`,
    );
    stmt.run(...values);
    return this.getById(id)!;
  }

  delete(id: string): void {
    const db = getDatabase();
    // Hard delete (not soft delete) to enable FK CASCADE on videos, scenes, events.
    // SQLite FK constraints only cascade on actual DELETE statements, not UPDATE.
    // This means deleting a project will automatically delete all related records
    // in videos, scenes, events, agent_sessions, and session_tool_calls tables.
    db.prepare("DELETE FROM projects WHERE id = ?").run(id);
  }

  withVideoCount(
    status?: ProjectStatus,
  ): (Project & { video_count: number; completed_videos: number })[] {
    const db = getDatabase();
    let sql = `
      SELECT p.*,
        COUNT(v.id) as video_count,
        COUNT(CASE WHEN v.status = 'completed' THEN 1 END) as completed_videos
      FROM projects p
      LEFT JOIN videos v ON v.project_id = p.id
    `;
    if (status) sql += " WHERE p.status = ?";
    sql += " GROUP BY p.id ORDER BY p.created_at DESC";
    const stmt = status ? db.prepare(sql) : db.prepare(sql);
    const rows = status
      ? (stmt.all(status) as Record<string, unknown>[])
      : (stmt.all() as Record<string, unknown>[]);
    return rows.map((r) => ({
      ...this.parseProject(r),
      video_count: r.video_count as number,
      completed_videos: r.completed_videos as number,
    }));
  }

  private parseProject(row: Record<string, unknown>): Project {
    return {
      ...row,
      config: row.config ? JSON.parse(row.config as unknown as string) : null,
    } as Project;
  }
}

// Singleton
let instance: ProjectRepository | null = null;
export function getProjectRepository(): ProjectRepository {
  if (!instance) instance = new ProjectRepository();
  return instance;
}
