import { useState } from 'react';
import type { CreateProjectRequest } from '../../../api/types/index.js';

interface Props {
  onClose: () => void;
  onSubmit: (data: CreateProjectRequest) => Promise<void>;
}

export function CreateProjectModal({ onClose, onSubmit }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [contextId, setContextId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!contextId || contextId === slugify(name)) {
      setContextId(slugify(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('El nombre es requerido');
      return;
    }
    if (!contextId.trim()) {
      setError('El context_id es requerido');
      return;
    }
    if (!/^[a-z0-9-_]+$/.test(contextId)) {
      setError('El context_id solo puede contener letras minúsculas, números, guiones y guiones bajos');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({ name, description: description || undefined, context_id: contextId });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear proyecto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-ui-bg-card rounded-xl shadow-2xl w-full max-w-md p-6 border border-ui-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-ui-text-primary">Nuevo Proyecto</h2>
          <button onClick={onClose} className="text-ui-text-muted hover:text-ui-text-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ui-text-secondary mb-1">Nombre del proyecto</label>
            <input
              type="text"
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              placeholder="Promo Junio 2024"
              className="w-full px-3 py-2 border border-ui-border bg-ui-bg-input rounded-lg text-sm text-ui-text-primary placeholder-ui-text-muted focus:ring-2 focus:ring-gs-orange focus:border-gs-orange outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ui-text-secondary mb-1">
              Descripción <span className="text-ui-text-muted font-normal">(opcional)</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              placeholder="Campaña de promociones de junio para redes sociales"
              className="w-full px-3 py-2 border border-ui-border bg-ui-bg-input rounded-lg text-sm text-ui-text-primary placeholder-ui-text-muted focus:ring-2 focus:ring-gs-orange focus:border-gs-orange outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ui-text-secondary mb-1">Context ID</label>
            <input
              type="text"
              value={contextId}
              onChange={e => setContextId(e.target.value)}
              placeholder="promo-junio-2024"
              className="w-full px-3 py-2 border border-ui-border bg-ui-bg-input rounded-lg text-sm font-mono text-ui-text-primary placeholder-ui-text-muted focus:ring-2 focus:ring-gs-orange focus:border-gs-orange outline-none"
            />
            <p className="text-xs text-ui-text-muted mt-1">
              Se creará la carpeta <span className="font-mono bg-ui-bg-input px-1 rounded">projects/{contextId || '...'}/</span>
            </p>
          </div>

          {error && (
            <div className="bg-red-900/30 text-red-400 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="bg-ui-bg-input rounded-lg p-3">
            <p className="text-xs text-ui-text-muted">Se creará automáticamente:</p>
            <ul className="mt-2 space-y-1 text-xs text-ui-text-secondary">
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span className="font-mono">projects/{contextId || '...'}/system.md</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-ui-text-muted">○</span>
                <span className="font-mono">projects/{contextId || '...'}/brand.md</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-ui-text-muted">○</span>
                <span className="font-mono">projects/{contextId || '...'}/audience.md</span>
              </li>
            </ul>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-ui-border rounded-lg text-sm font-medium text-ui-text-secondary hover:bg-ui-bg-hover"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gs-orange hover:bg-gs-orange-dark text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {loading ? 'Creando...' : 'Crear proyecto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-_]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}
