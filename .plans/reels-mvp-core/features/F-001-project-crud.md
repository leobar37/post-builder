# F-001: Project CRUD Operations

## Objective

Ensure complete project lifecycle management with proper validation, error handling, and cascading operations. Projects are the top-level container for videos.

## Scope Boundaries

### In Scope
- Create project with context initialization
- Update project metadata (name, description)
- Delete project (with cascade to videos, scenes, events)
- List projects with video counts
- Get single project with video list
- Validate context_id exists in filesystem

### Out of Scope
- Project templates (future feature)
- Project sharing/collaboration
- Project-level permissions
- Archive vs delete distinction

## Verified Context

### Existing Implementation
| Component | Location | Status |
|-----------|----------|--------|
| Projects route | `api/routes/projects.ts` | Basic CRUD exists |
| Project service | `api/services/project.service.ts` | CRUD + context operations |
| Project repository | `api/db/repositories/project.repository.ts` | SQLite CRUD |
| Projects UI | `src/components/projects/` | Grid, create modal |

### Database Schema (Verified)
```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  context_id TEXT NOT NULL UNIQUE,
  config TEXT,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Context System
Projects reference a `context_id` that maps to a filesystem directory at `data/contexts/{context_id}/` containing:
- `system.md` - System prompt base
- `brand.md` - Brand guidelines
- `audience.md` - Target audience info

## Implementation Notes

### Current Gaps
1. **Delete cascade** - Need to verify cascading delete works properly
2. **Context validation** - Should verify context_id exists before creating project
3. **Update timestamps** - updated_at should be refreshed on modification
4. **Error messages** - Need user-friendly error messages in UI

### File Locations
- **Backend**: `api/routes/projects.ts`, `api/services/project.service.ts`
- **Database**: `api/db/repositories/project.repository.ts`
- **Frontend**: `src/components/projects/`, `src/hooks/useProjects.ts`

## Acceptance Criteria

- [ ] Can create project with unique context_id
- [ ] Cannot create project with duplicate context_id (proper error)
- [ ] Can update project name and description
- [ ] Can delete project (cascades to videos, scenes, events)
- [ ] List shows video count per project
- [ ] Context directory is created if doesn't exist
- [ ] API returns proper HTTP status codes
- [ ] UI shows loading states and error messages
- [ ] All operations work via CLI `reel` commands

## Estimated Effort

**2 days**

- Day 1: Backend validation, cascade fixes, API improvements
- Day 2: UI polish, error handling, testing

## Suggested /plan Mode

`simple` - This is a localized CRUD feature with clear scope.

## Open Questions

1. Should we allow renaming context_id or is it immutable?
2. What happens to generated videos if project is deleted during active generation?
3. Should we soft-delete (status=archived) or hard delete?

## Verification Steps

```bash
# Test create
curl -X POST http://localhost:3458/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","description":"Test project","context_id":"test-ctx"}'

# Test duplicate (should fail)
curl -X POST http://localhost:3458/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"Test 2","context_id":"test-ctx"}'

# Test delete
curl -X DELETE http://localhost:3458/api/projects/{id}

# Verify cascade
sqlite3 data/app.db "SELECT * FROM videos WHERE project_id='{id}'"
```
