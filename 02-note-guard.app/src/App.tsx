import React, { useState, useEffect } from 'react';
import { NoteForm } from './components/NoteForm';
import { NoteList } from './components/NoteList';
import { notePlugin } from './plugins/note.plugin';
import { logger, PolarisRuntime } from '@polaris-runtime/core/dev';

// 1. Instansiasi Polaris Runtime
export const runtime = new PolarisRuntime();

// 2. Register Plugin
runtime.register([notePlugin]);

// 3. Helper can()
export const can = (workflowPath: string, input?: any): boolean => {  
  const result = runtime.canExecute(workflowPath, input);
  return result.allowed
}

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
    <div className="app-container">
      <header>
        <h1>🔐 Polaris Example 02: Note Guard App</h1>
        <span>
    💡 <strong>Pro Tip:</strong> Allow browser pop-ups to open <strong>Polaris Explorer</strong> for sefl-describing app documentation!
        </span>
        <p>Demonstrating Class Models, Declarative Rules (allowed), and Reactive UI Guards via can()</p>
      </header>

      {loading && <div className="loading-bar">Processing workflow...</div>}
      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}

      <main>
        <NoteForm />
        <NoteList />
      </main>
    </div>
  );
}