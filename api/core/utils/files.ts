import { readFile, writeFile, mkdir, access, constants } from 'fs/promises';
import { dirname } from 'path';

/**
 * Read and parse JSON file with type safety
 */
export async function readJson<T>(path: string): Promise<T> {
  const content = await readFile(path, 'utf-8');
  return JSON.parse(content) as T;
}

/**
 * Write data to JSON file with formatting
 */
export async function writeJson(path: string, data: unknown, pretty = true): Promise<void> {
  const content = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
  await writeFile(path, content, 'utf-8');
}

/**
 * Ensure directory exists (creates recursively)
 */
export async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

/**
 * Check if file or directory exists
 */
export async function exists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if path is readable
 */
export async function isReadable(path: string): Promise<boolean> {
  try {
    await access(path, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if path is writable
 */
export async function isWritable(path: string): Promise<boolean> {
  try {
    await access(path, constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Write file ensuring parent directory exists
 */
export async function writeFileSafe(path: string, content: string | Buffer): Promise<void> {
  const dir = dirname(path);
  await ensureDir(dir);
  await writeFile(path, content);
}
