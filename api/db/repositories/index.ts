// Database Repositories - Data access layer
// Each repository handles CRUD operations for one entity
//
// Architecture:
//   client.ts          -> Database connection (getDatabase())
//   repositories/*.ts  -> SQL queries (CRUD operations)
//   services/*.ts      -> Business logic (uses repositories)
//
// Usage:
//   import { getProjectRepository } from '../db/repositories/index.js'
//   const project = getProjectRepository().getById('xxx')

// Re-export entity types for convenience
export type {
  Project,
  ProjectStatus,
  Video,
  VideoStatus,
  Scene,
  SceneStatus,
  Event,
  EventType,
  EventSource,
} from "../../types/index.js";

export {
  ProjectRepository,
  getProjectRepository,
} from "./project.repository.js";

export {
  VideoRepository,
  getVideoRepository,
} from "./video.repository.js";

export {
  SceneRepository,
  getSceneRepository,
} from "./scene.repository.js";

export {
  EventRepository,
  getEventRepository,
} from "./event.repository.js";

export {
  SessionRepository,
  sessionRepository,
} from "./session.repository.js";
