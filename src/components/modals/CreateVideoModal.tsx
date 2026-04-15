import { useState } from 'react';

interface Props {
  projectName: string;
  projectContextId: string;
  onClose: () => void;
  onSubmit: (prompt: string) => Promise<void>;
}

export function CreateVideoModal({ projectName, projectContextId, onClose, onSubmit }: Props) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError('');
    try {
      await onSubmit(prompt);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear video');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-ui-bg-card rounded-xl shadow-2xl w-full max-w-lg p-6 border border-ui-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-ui-text-primary">Nuevo Video</h2>
          <button onClick={onClose} className="text-ui-text-muted hover:text-ui-text-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-2 text-sm text-ui-text-secondary mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4V2m0 2v2m0-2H4m3 0h3m0 2v2m0-2h2m-2 0v6m0-6H4m3 0h3m0 2v2m0-2h2m-2 0v6m0-6h2m-2 0h2"/>
            </svg>
            <span>{projectName}</span>
            <span className="text-ui-text-muted">·</span>
            <span className="font-mono text-xs">projects/{projectContextId}/</span>
          </div>

          <label className="block text-sm font-medium text-ui-text-secondary mb-1">Prompt para OpenCode</label>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            rows={4}
            placeholder="Ej: Video promocional de 15 segundos mostrando las nuevas instalaciones del gimnasio con testimonios de socios"
            className="w-full px-3 py-2 border border-ui-border bg-ui-bg-input rounded-lg text-sm text-ui-text-primary placeholder-ui-text-muted focus:ring-2 focus:ring-gs-orange focus:border-gs-orange outline-none resize-none"
          />
        </div>

        {error && (
          <div className="bg-red-900/30 text-red-400 text-sm p-3 rounded-lg mb-3">
            {error}
          </div>
        )}

        <div className="bg-gs-orange/10 rounded-lg p-3 mb-4">
          <p className="text-xs text-gs-orange">
            <strong>Cómo funciona:</strong> OpenCode leerá los archivos de contexto del proyecto (system.md, brand.md) y generará la idea del video automáticamente.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-ui-border rounded-lg text-sm font-medium text-ui-text-secondary hover:bg-ui-bg-hover"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !prompt.trim()}
            className="flex-1 px-4 py-2 bg-gs-orange hover:bg-gs-orange-dark text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Creando...' : 'Generar idea'}
          </button>
        </div>
      </div>
    </div>
  );
}
