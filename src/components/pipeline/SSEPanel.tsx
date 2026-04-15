import type { SSEEvent } from '../../../api/types/index.js';
import type { SSEStatus } from '../../hooks/useSSE';

interface Props {
  events: SSEEvent[];
  status: SSEStatus;
}

const eventColors: Record<string, string> = {
  opencode_connected: 'text-blue-400',
  opencode_message: 'text-orange-400',
  opencode_done: 'text-blue-400',
  idea_ready: 'text-blue-400',
  scene_created: 'text-purple-400',
  scene_updated: 'text-purple-400',
  minimax_success: 'text-green-400',
  minimax_fail: 'text-red-400',
  video_created: 'text-green-400',
  error: 'text-red-400',
  state_transition: 'text-yellow-400',
};

export function SSEPanel({ events, status }: Props) {
  const isConnected = status === 'connected';

  return (
    <div className="bg-ui-bg-card rounded-xl border border-ui-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-ui-text-primary">Eventos en Tiempo Real (SSE)</h3>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full animate-pulse ${isConnected ? 'bg-green-400' : 'bg-ui-text-muted'}`} />
          <span className={`text-xs font-medium ${isConnected ? 'text-green-400' : 'text-ui-text-muted'}`}>
            {isConnected ? 'Conectado' : status === 'connecting' ? 'Conectando...' : 'Desconectado'}
          </span>
        </div>
      </div>
      <div className="bg-gray-900 rounded-lg p-4 font-mono text-xs text-green-400 h-32 overflow-y-auto space-y-1">
        {events.length === 0 ? (
          <div className="text-gray-500"> Esperando eventos...</div>
        ) : (
          events.map((event, i) => (
            <div key={i}>
              <span className="text-gray-500">[{formatTime(event.timestamp)}]</span>
              <span className="mx-1">{isEventType(event.type) ? '→' : '•'}</span>
              <span className={eventColors[event.type] || 'text-gray-400'}>{event.type}</span>
              {event.data && Object.keys(event.data).length > 0 && (
                <span className="text-gray-500"> {JSON.stringify(event.data).slice(0, 50)}</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function isEventType(type: string): boolean {
  return ['opencode_connected', 'opencode_message', 'idea_ready', 'scene_created', 'minimax_success'].includes(type);
}

function formatTime(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return '--:--:--';
  }
}
