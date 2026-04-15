import { useState, useEffect, useCallback } from 'react';
import type { ProjectWithCounts, CreateProjectRequest, ProjectResponse } from '../../api/types/index.js';

const API_BASE = import.meta.env.VITE_API_URL || '';

export function useProjects() {
  const [projects, setProjects] = useState<ProjectWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async (status?: 'active' | 'archived' | 'deleted') => {
    setLoading(true);
    setError(null);
    try {
      const url = status ? `${API_BASE}/api/projects?status=${status}` : `${API_BASE}/api/projects`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  }, []);

  const createProject = useCallback(async (data: CreateProjectRequest): Promise<ProjectResponse | null> => {
    try {
      const res = await fetch(`${API_BASE}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      const result = await res.json();
      if (result.success) {
        await fetchProjects();
        return result.project;
      }
      throw new Error(result.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
      return null;
    }
  }, [fetchProjects]);

  const deleteProject = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/api/projects/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      const result = await res.json();
      if (result.success) {
        await fetchProjects();
        return true;
      }
      throw new Error(result.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
      return false;
    }
  }, [fetchProjects]);

  const updateProject = useCallback(async (id: string, data: { name?: string; description?: string; status?: 'active' | 'archived' | 'deleted' }): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      const result = await res.json();
      if (result.success) {
        await fetchProjects();
        return true;
      }
      throw new Error(result.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project');
      return false;
    }
  }, [fetchProjects]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  return { projects, loading, error, fetchProjects, createProject, deleteProject, updateProject };
}
