// src/App.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { logger, PolarisRuntime } from '@polaris-runtime/core/dev';
import { RepoPlugin } from './plugins/repo.plugin';
import { MeetingPlugin } from './plugins/meeting.plugin';
import { WorkspacePlugin } from './plugins/workspace.plugin';
import MeetingList from './components/MeetingList';
import MeetingForm from './components/MeetingForm';
import MeetingDetail from './components/MeetingDetail';
import ProgressBar from './components/ProgressBar';
import { Meeting } from './types/meeting.types';

// ===== INIT RUNTIME =====
const runtime = new PolarisRuntime();
runtime.register([RepoPlugin, MeetingPlugin, WorkspacePlugin]);
runtime.setAllowedContextWorkflow('workspace/wf-set-context');

// ===== MOCK USERS =====
const AVAILABLE_USERS = [
  { userId: 'user-001', role: 'leader', name: 'Liu Ruyan (Leader)' },
  { userId: 'user-002', role: 'secretary', name: 'Sheng Min Yan (Secretary)' },
  { userId: 'user-003', role: 'member', name: 'Chen Fan (Member)' }
];

const DEFAULT_USER = AVAILABLE_USERS[0];

function App() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<'future' | 'past'>('future');
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [currentUser, setCurrentUser] = useState(DEFAULT_USER);

  const contextSet = useRef(false);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ===== SET CONTEXT (pertama kali) =====
  useEffect(() => {
    if (contextSet.current) return;
    contextSet.current = true;
    switchUser(DEFAULT_USER);
  }, []);

  // ===== SWITCH USER =====
  const switchUser = async (user: typeof DEFAULT_USER) => {
    try {
      await runtime.execute('workspace/wf-set-context', {
        userId: user.userId,
        role: user.role,
        name: user.name
      });
      setCurrentUser(user);
      logger.info(`✅ Switched to ${user.name} (${user.role})`);
      loadMeetings();
    } catch (err) {
      logger.error('Failed to switch user:', err);
      setError('Gagal berganti user');
    }
  };

  // ===== SUBSCRIBE EVENTS =====
  useEffect(() => {
    const unsubscribe = runtime.subscribeAll((event) => {
      if (event.type === 'step_started') {
        setProgress(event.progress || 0);
        setCurrentStep(event.stepName || '');
      }
      if (event.type === 'workflow_completed') {
        setProgress(100);
        setCurrentStep('Completed');
        if(event.workflowPath !== 'meeting/wf-list') loadMeetings();
      }
      if (event.type === 'workflow_failed') {
        setError(event.error || 'Workflow failed');
        setProgress(0);
      }
    });
    return unsubscribe;
  }, []);

  // ===== LOAD MEETINGS =====
  const loadMeetings = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const result = await runtime.execute('meeting/wf-list', { _t: Date.now() });
      if (result.status === 'success') {
        setMeetings(result.payload || []);
      } else {
        setError(result.error || 'Failed to load meetings');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [loading]);

  // ===== HELPER UNTUK SUCCESS MESSAGE =====
  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
    }
    successTimeoutRef.current = setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  // ===== HANDLE CREATE =====
  const handleCreate = async (data: any) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const result = await runtime.execute('meeting/wf-create', data);
      if (result.status === 'success') {
        setShowForm(false);
        await loadMeetings();
        showSuccess('✅ Meeting berhasil dibuat!');
      } else {
        setError(result.error || 'Failed to create meeting');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // ===== HANDLE WORKFLOW ACTION =====
  const handleWorkflowAction = async (workflowName: string, input: any) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const result = await runtime.execute(workflowName, input);
      if (result.status === 'success') {
        await loadMeetings();
        if (selectedMeetingId) {
          setSelectedMeetingId(null);
          setTimeout(() => setSelectedMeetingId(selectedMeetingId), 100);
        }
        // Ambil pesan sukses dari result atau buat default
        const msg = result.message || '✅ Action berhasil!';
        showSuccess(msg);
      } else {
        setError(result.error || 'Action failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const selectedMeeting = meetings.find(m => m.id === selectedMeetingId);

  // Cleanup timeout saat unmount
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>📋 Meeting Notes</h1>
        <div className="header-right">
          <div className="user-switcher">
            <label htmlFor="user-select">👤 User: </label>
            <select
              id="user-select"
              value={currentUser.userId}
              onChange={(e) => {
                const user = AVAILABLE_USERS.find(u => u.userId === e.target.value);
                if (user) switchUser(user);
              }}
            >
              {AVAILABLE_USERS.map(u => (
                <option key={u.userId} value={u.userId}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div className="user-info">
            <span>{currentUser.name}</span>
            <span className="role-badge">{currentUser.role}</span>
          </div>
        </div>
      </header>

      <div className="app-body">
        <aside className="sidebar">
          <div className="sidebar-actions">
            <button
              className="btn-primary"
              onClick={() => {
                setFormMode('future');
                setShowForm(true);
              }}
            >
              + Rencanakan Meeting
            </button>
            <button
              className="btn-secondary"
              onClick={() => {
                setFormMode('past');
                setShowForm(true);
              }}
            >
              + Catat Meeting
            </button>
          </div>
          <MeetingList
            meetings={meetings}
            loading={loading}
            selectedId={selectedMeetingId}
            onSelect={setSelectedMeetingId}
            onRefresh={loadMeetings}
          />
        </aside>

        <main className="main-content">
          {showForm ? (
            <MeetingForm
              mode={formMode}
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
              loading={loading}
            />
          ) : selectedMeeting ? (
            <MeetingDetail
              meeting={selectedMeeting}
              runtime={runtime}
              onAction={handleWorkflowAction}
              onClose={() => setSelectedMeetingId(null)}
              loading={loading}
            />
          ) : (
            <div className="empty-state">
              <p>Pilih meeting dari daftar atau buat baru</p>
            </div>
          )}
        </main>
      </div>

      {progress > 0 && progress < 100 && (
        <ProgressBar progress={progress} step={currentStep} />
      )}

      {successMessage && (
        <div className="success-toast">
          ✅ {successMessage}
          <button onClick={() => setSuccessMessage(null)}>✕</button>
        </div>
      )}

      {error && (
        <div className="error-toast">
          ❌ {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}
    </div>
  );
}

export default App;