/**
 * Basic integration tests for repositories
 * Run with: pnpm tsx api/db/repositories/repositories.test.ts
 *
 * Note: Database tests require better-sqlite3 native bindings to be compiled.
 * If bindings are missing, only singleton tests will run.
 */
import {
  getProjectRepository,
  getVideoRepository,
  getSceneRepository,
  getEventRepository,
} from "./index.js";

// Check if better-sqlite3 bindings are available
function hasNativeBindings(): boolean {
  try {
    const { getDatabase } = require("../client.js");
    getDatabase();
    return true;
  } catch {
    return false;
  }
}

// Test runner
async function runTests() {
  console.log("🧪 Testing Repositories\n");

  const hasDb = hasNativeBindings();
  if (!hasDb) {
    console.log("⚠️  better-sqlite3 bindings not available, skipping DB tests\n");
  }

  const tests: { name: string; fn: () => Promise<void> | void }[] = [
    {
      name: "getProjectRepository() returns singleton",
      fn: () => {
        const repo1 = getProjectRepository();
        const repo2 = getProjectRepository();
        if (repo1 !== repo2) throw new Error("Not a singleton");
        console.log("  ✓ ProjectRepository is singleton");
      },
    },
    {
      name: "getVideoRepository() returns singleton",
      fn: () => {
        const repo1 = getVideoRepository();
        const repo2 = getVideoRepository();
        if (repo1 !== repo2) throw new Error("Not a singleton");
        console.log("  ✓ VideoRepository is singleton");
      },
    },
    {
      name: "getSceneRepository() returns singleton",
      fn: () => {
        const repo1 = getSceneRepository();
        const repo2 = getSceneRepository();
        if (repo1 !== repo2) throw new Error("Not a singleton");
        console.log("  ✓ SceneRepository is singleton");
      },
    },
    {
      name: "getEventRepository() returns singleton",
      fn: () => {
        const repo1 = getEventRepository();
        const repo2 = getEventRepository();
        if (repo1 !== repo2) throw new Error("Not a singleton");
        console.log("  ✓ EventRepository is singleton");
      },
    },
  ];

  // Only add DB tests if bindings are available
  if (hasDb) {
    const { getDatabase } = require("../client.js");

    tests.push(
      {
        name: "Database connection works",
        fn: () => {
          const db = getDatabase();
          const result = db.prepare("SELECT 1 as test").get() as { test: number };
          if (result.test !== 1) throw new Error("Database query failed");
          console.log("  ✓ Database connection works");
        },
      },
      {
        name: "ProjectRepository CRUD operations",
        fn: async () => {
          const repo = getProjectRepository();
          const testId = `test-${Date.now()}`;

          // Create
          const created = repo.create({
            name: "Test Project",
            context_id: testId,
          });
          if (!created.id) throw new Error("Create failed");
          console.log("  ✓ Project created");

          // Read
          const found = repo.getById(created.id);
          if (!found || found.name !== "Test Project") throw new Error("Read failed");
          console.log("  ✓ Project read");

          // Update
          const updated = repo.update(created.id, { name: "Updated Project" });
          if (updated.name !== "Updated Project") throw new Error("Update failed");
          console.log("  ✓ Project updated");

          // Delete (soft)
          repo.delete(created.id);
          const deleted = repo.getById(created.id);
          if (deleted?.status !== "deleted") throw new Error("Delete failed");
          console.log("  ✓ Project soft-deleted");
        },
      }
    );
  }

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      await test.fn();
      passed++;
    } catch (error) {
      console.log(`  ✗ ${test.name}: ${error instanceof Error ? error.message : error}`);
      failed++;
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
