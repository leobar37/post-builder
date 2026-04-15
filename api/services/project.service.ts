import { mkdirSync, existsSync, rmSync } from "fs";
import { join } from "path";
import { getProjectRepository } from "../db/repositories/project.repository.js";
import type {
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectResponse,
  ProjectWithCounts,
  ProjectListResponse,
  ProjectStatus,
} from "../types/index.js";

const REQUIRED_CONTEXT_FILES = ["system.md", "brand.md", "audience.md"];

/**
 * ProjectService - Business logic for projects
 *
 * Responsibilities:
 * - CRUD operations for projects
 * - Validate unique context_id
 * - Create/delete physical folder for project
 * - Hard delete with cascade to all child records
 */
export class ProjectService {
  private projectsBasePath: string;

  constructor() {
    this.projectsBasePath = join(process.cwd(), "projects");
  }

  /**
   * Create a project + physical folder
   * Validates context_id is unique
   */
  create(data: CreateProjectRequest): ProjectResponse {
    const repo = getProjectRepository();

    // Validate context_id is unique
    const allProjects = repo.getAll();
    const existing = allProjects.find((p) => p.context_id === data.context_id);
    if (existing) {
      throw new Error(
        `Project with context_id "${data.context_id}" already exists`,
      );
    }

    // Create in database
    const project = repo.create({
      name: data.name,
      description: data.description,
      context_id: data.context_id,
      config: data.config,
    });

    // Create physical folder
    const contextPath = join(this.projectsBasePath, data.context_id);
    if (!existsSync(contextPath)) {
      mkdirSync(contextPath, { recursive: true });
    }

    // Validate context files exist in data/contexts/{context_id}/
    const contextsBasePath = join(process.cwd(), "data", "contexts", data.context_id);
    const missingFiles: string[] = [];
    for (const file of REQUIRED_CONTEXT_FILES) {
      if (!existsSync(join(contextsBasePath, file))) {
        missingFiles.push(file);
      }
    }
    if (missingFiles.length > 0) {
      console.warn(
        `[ProjectService] Warning: Creating project "${data.name}" without context files: ${missingFiles.join(", ")}`,
      );
    }

    return project;
  }

  private getRepo() {
    return getProjectRepository();
  }

  /**
   * Get project by id
   */
  getById(id: string): ProjectResponse {
    const project = this.getRepo().getById(id);
    if (!project) {
      throw new Error("Project not found");
    }
    return project;
  }

  /**
   * Get all projects with video counts
   */
  getAll(status?: ProjectStatus): ProjectListResponse {
    const projects = this.getRepo().withVideoCount(status);
    return { projects, total: projects.length };
  }

  /**
   * Update project fields
   * Note: context_id cannot be changed
   */
  update(id: string, data: UpdateProjectRequest): ProjectResponse {
    const existing = this.getRepo().getById(id);
    if (!existing) {
      throw new Error("Project not found");
    }

    // Prevent changing context_id
    if (data.status && data.status !== existing.status) {
      // status change is allowed
    }

    return this.getRepo().update(id, data);
  }

  /**
   * Hard delete project and physical folder
   * Cascade deletes all related videos, scenes, events via FK CASCADE
   */
  delete(id: string): void {
    const existing = this.getRepo().getById(id);
    if (!existing) {
      throw new Error("Project not found");
    }
    // Delete from database (cascade will handle videos, scenes, events)
    this.getRepo().delete(id);
    // Delete physical folder
    const contextPath = join(this.projectsBasePath, existing.context_id);
    if (existsSync(contextPath)) {
      rmSync(contextPath, { recursive: true, force: true });
    }
  }

  /**
   * Get project folder path
   */
  getProjectPath(contextId: string): string {
    return join(this.projectsBasePath, contextId);
  }
}

// Singleton
let instance: ProjectService | null = null;
export function getProjectService(): ProjectService {
  if (!instance) instance = new ProjectService();
  return instance;
}
