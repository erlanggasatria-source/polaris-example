import React, { useState, useEffect } from 'react';
import { NoteForm } from './components/NoteForm';
import { NoteList } from './components/NoteList';
import { NotePlugin } from './plugins/note.plugin';
import { logger, PolarisRuntime } from '@polaris-runtime/core/dev';

export const runtime = new PolarisRuntime();
runtime.register([NotePlugin]);

export default function App() {
  const [loading, setLoading] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const unsubscribe = runtime.subscribeAll((event) => {
      logger.debug('App Lifecycle Event:', event.type, event);

      if (event.type === 'workflow_started') {
        setLoading(true);
        setCurrentStep(`Executing ${event.workflowPath}...`);
      }

      if (event.type === 'step_started') {
        setCurrentStep(`Step: ${event.stepName}`);
      }

      if (event.type === 'workflow_completed') {
        setLoading(false);
        setCurrentStep('');
        if (event.workflowPath !== 'note/wf-list') {
          // Ambil pesan dinamik dari successResult(payload, domain, id, message)
          const successMessage = event.output?.message || `Operation completed: ${event.workflowPath}`;
          setToast({ message: `✅ ${successMessage}`, type: 'success' });
          setTimeout(() => setToast(null), 3000);
        }
      }

      if (event.type === 'workflow_failed') {
        setLoading(false);
        setCurrentStep('');
        // Ambil pesan error dinamik dari errorResult(...) atau throw new Error(...)
        const errorMessage = event.error || 'Execution failed';
        setToast({ message: `❌ ${errorMessage}`, type: 'error' });
        setTimeout(() => setToast(null), 4000);
      }
    });

    return () => unsubscribe();
}, []);

  return (
    <div style={{ maxWidth: '520px', margin: '2rem auto', fontFamily: 'sans-serif', padding: '0 1rem' }}>
      <h2>Polaris Basic Note App</h2>
      <p style={{ color: '#555', fontSize: '0.9rem' }}>
        Powered by <code>@polaris-runtime/core</code>
      </p>

      {/* Global Loading Indicator */}
      {loading && (
        <div style={{ background: '#e6f0ff', color: '#0066cc', padding: '6px 12px', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '1rem' }}>
          ⏳ {currentStep}
        </div>
      )}

      {/* Global Toast Notification */}
      {toast && (
        <div style={{
          padding: '10px 14px',
          borderRadius: '6px',
          marginBottom: '1rem',
          color: '#fff',
          background: toast.type === 'success' ? '#2e7d32' : '#d32f2f',
          transition: 'all 0.3s ease'
        }}>
          {toast.message}
        </div>
      )}

      <hr style={{ margin: '1.5rem 0' }} />
      <NoteForm />
      <NoteList />
    </div>
  );
}