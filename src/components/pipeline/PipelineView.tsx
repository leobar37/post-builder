import { useEffect } from 'react';
import { StateMachine } from './StateMachine';
import { SSEPanel } from './SSEPanel';
import { useSSE } from '../../hooks/useSSE';

export function PipelineView() {
  const { events, status, connect, disconnect } = useSSE();

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ui-text-primary mb-1">Pipeline de Estado</h1>
        <p className="text-sm text-ui-text-secondary">Flujo que sigue cada video desde que se crea hasta que se completa</p>
      </div>

      <StateMachine />

      <div className="mt-6">
        <SSEPanel events={events} status={status} />
      </div>
    </div>
  );
}
