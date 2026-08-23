import React, { useState, useEffect } from 'react';
import { AVAILABLE_USERS } from './data/mockData';
import type  { Meeting, MeetingNote } from './types';
import { statusBadge } from './utils/helpers';
import MeetingDetail from './components/MeetingDetail';
import MeetingForm from './components/MeetingForm';
import { runtime, getPayload } from './runtime';
import type { IResult } from '@polaris-runtime/core';

// Tipe untuk Toast Notification
interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<{ userId: string; name: string; role: string } | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [showMeetingForm, setShowMeetingForm] = useState<boolean>(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  
  const [showRejectModal, setShowRejectModal] = useState<{workflow: string, id?: string} | null>(null);
  const [showNoteHistory, setShowNoteHistory] = useState<MeetingNote | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // State untuk Notifikasi
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Helper untuk menambah notifikasi
  const addToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    // Auto-hide setelah 3 detik
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const fetchMeetings = async () => {
    try {
      const result = await runtime.execute('meeting/wf-list', { _t: Date.now() });
      const data = getPayload<Meeting[]>(result);
      setMeetings(data || []);
    } catch (error) {
      console.error("Failed to fetch meetings:", error);
      setMeetings([]); 
    }
  };

  const fetchMeetingDetail = async (id: string) => {
    try {
      const result: IResult = await runtime.execute('meeting/wf-get', { id, _t: Date.now() });
      console.log('==result==',result);
      const data = result.payload;
      console.log('==ini==',data);
      if (data) setSelectedMeeting(data);
    } catch (error) {
      console.error("Failed to fetch meeting detail:", error);
    }
  };

  const handleLogin = async (userId: string, name: string, role: string) => {
    await runtime.execute('workspace/wf-set-context', { userId, name, role });
    const ctx = runtime.getGlobalContext();
    setCurrentUser({
      userId: ctx.get('userId') || 'unknown',
      name: ctx.get('name') || 'Unknown',
      role: ctx.get('role') || 'member'
    });
    fetchMeetings();
  };

  // 🔥 POLARIS STATE MANAGEMENT
  useEffect(() => {
    if (!currentUser) return;    

    const unsubscribe = runtime.subscribeAll((event) => {
      const readOnlyWorkflows = ['meeting/wf-list', 'meeting/wf-get', 'workspace/wf-set-context'];
      const isReadOnly = readOnlyWorkflows.includes(event.workflowPath);
      const isMeetingEvent = event.workflowPath.startsWith('meeting/');

      if (event.type === 'workflow_completed') {
        // Tampilkan notifikasi sukses
        if (!isReadOnly) {
          addToast('success', `${event.workflowPath.split('/').pop()} executed successfully!`);
        }

        if (isMeetingEvent && !isReadOnly) {
          fetchMeetings();       
          // Gunakan functional update untuk mendapatkan state terbaru tanpa stale closure
          setSelectedMeeting(prev => {                       
            if (prev && event.output?.payload?.id === prev.id) {
              fetchMeetingDetail(prev.id); // Refresh detail                     
            }
            return prev; // Kembalikan nilai yang sama agar tidak trigger re-render tanpa data
          });
        }
      }
      
      if (event.type === 'workflow_failed') {
        // Tampilkan notifikasi gagal
        addToast('error', `${event.workflowPath}: ${event.error || 'Execution failed'}`);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser]); // Hanya depend pada currentUser!

  const handleAction = async (workflow: string, meeting: Meeting, payload?: Partial<Meeting> | Partial<MeetingNote>) => {
    try {
      const input = { ...meeting, ...payload};
      await runtime.execute(workflow, input);
      // Tidak perlu manual fetch, subscribeAll akan handle & kasih toast
    } catch (error) {
      console.error(`Error executing ${workflow}:`, error);
      addToast('error', `Failed to execute ${workflow}`);
    }
  };

  const handleRejectSubmit = async () => {
    if (!showRejectModal || !selectedMeeting) return;
    try {
      console.debug('status===',selectedMeeting.status)
      await runtime.execute(showRejectModal.workflow, { status: selectedMeeting.status, id: showRejectModal.id, reason: rejectReason });
      setShowRejectModal(null);
      setRejectReason('');
    } catch (error) {
      console.error("Error rejecting:", error);
    }
  };

  const handleSaveMeeting = async (workflow: string, meetingData: Meeting) => {
    try {
      await runtime.execute(workflow, meetingData);
      setShowMeetingForm(false);
      setEditingMeeting(null);
    } catch (error) {
      console.error("Error saving meeting:", error);
    }
  };

  // === VIEWS ===
  if (!currentUser) {  
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <span className="mb-4 text-center text-gray-700 border-b border-gray-300 pb-2">
      💡 <strong>Pro Tip:</strong> Allow browser pop-ups to open <strong>Polaris Explorer</strong> for sefl-describing app documentation!
        </span>
        <p>Demonstrating Class Models, Declarative Rules (allowed), and Reactive UI Guards via can()</p>
        <p>🔥 Note: This is a mock login for demonstration purposes. No real authentication is implemented.</p>
        <p>💡 Tip: You can switch between different users to test the workflow and guards.</p>
        <p>&nbsp;</p>     
        <h1 className="text-2xl font-bold mb-4">🎯 Scenario Test you can try</h1>
        <p>Login as Chen Fan (member) → create meeting → submit approval</p>
        <p>Switch to Liu Ruyan (leader) → approve meeting → status waiting_note</p>
        <p>Switch to Chen Fan → add note → status waiting_note_approval</p>
        <p>Switch to Sheng Min Yan (secretary) → approve note → status done</p>
        <p>&#128129; All buttons are show how guards are implemented</p>
        <p className="mt-2 text-center text-gray-600">Note: You can also reject at any step to see the reject flow.</p>
      <div className="flex justify-center">
        <div className="bg-white p-8 rounded shadow-md w-96">
          <h2 className="text-2xl font-bold mb-6 text-center">Mock Login</h2>          
          {AVAILABLE_USERS.map(user => (
            <button
              key={user.userId}
              onClick={() => handleLogin(user.userId, user.name, user.role)}
              className="w-full bg-blue-500 text-white py-2 rounded mb-3 hover:bg-blue-600 transition"
            >
              Login as {user.name}
            </button>
          ))}
        </div>
      </div>
      </div>
    );
  }

  if (showMeetingForm) {
    return <MeetingForm meeting={editingMeeting} onSave={handleSaveMeeting} onCancel={() => { setSelectedMeeting(editingMeeting); setShowMeetingForm(false); setEditingMeeting(null); }} />;
  }

  if (selectedMeeting) {
    return (
      <>
        <MeetingDetail 
          meeting={selectedMeeting} 
          currentUser={currentUser.userId} 
          onBack={() => setSelectedMeeting(null)}
          onEdit={() => { setEditingMeeting(selectedMeeting); setShowMeetingForm(true); setSelectedMeeting(null); }}
          onRejectClick={(workflow, id) => setShowRejectModal({workflow, id})}
          onShowNoteHistory={(note) => setShowNoteHistory(note)}
          onAction={handleAction}
        />
        
        {showRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow-lg w-96">
              <h3 className="text-lg font-bold mb-4 capitalize">{showRejectModal.workflow} Reject Reason</h3>
              <textarea 
                className="w-full border p-2 rounded mb-4" 
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Masukkan alasan reject..."
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowRejectModal(null)} className="px-4 py-2 border rounded">Cancel</button>
                <button onClick={handleRejectSubmit} className="px-4 py-2 bg-red-500 text-white rounded">Submit Reject</button>
              </div>
            </div>
          </div>
        )}

        {showNoteHistory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded shadow-lg w-96 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Note Detail</h3>
                <button onClick={() => setShowNoteHistory(null)} className="text-gray-500 hover:text-gray-800 text-xl">&times;</button>
              </div>
              <div className="space-y-3 text-sm">
                <div className="bg-gray-50 p-3 rounded border">
                  <p className="font-semibold mb-1">Content:</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{showNoteHistory.content}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <p><strong>Status:</strong> <span className="capitalize">{showNoteHistory.status}</span></p>
                  <p><strong>Version:</strong> {showNoteHistory.version}</p>
                  <p><strong>Created By:</strong> {AVAILABLE_USERS.find(u => u.userId === showNoteHistory.createdBy)?.name || showNoteHistory.createdBy}</p>
                  <p><strong>Created At:</strong> {new Date(showNoteHistory.createdAt).toLocaleString()}</p>
                  {showNoteHistory.approvedBy && (
                    <>
                      <p className="text-green-600"><strong>Approved By:</strong> {AVAILABLE_USERS.find(u => u.userId === showNoteHistory.approvedBy)?.name || showNoteHistory.approvedBy}</p>
                      <p className="text-green-600"><strong>Approved At:</strong> {new Date(showNoteHistory.approvedAt!).toLocaleString()}</p>
                    </>
                  )}
                  {showNoteHistory.rejectedBy && (
                    <>
                      <p className="text-red-600"><strong>Rejected By:</strong> {AVAILABLE_USERS.find(u => u.userId === showNoteHistory.rejectedBy)?.name || showNoteHistory.rejectedBy}</p>
                      <p className="text-red-600"><strong>Rejected At:</strong> {new Date(showNoteHistory.rejectedAt!).toLocaleString()}</p>
                    </>
                  )}
                </div>
                {showNoteHistory.rejectReason && (
                  <div className="bg-red-50 border border-red-200 p-3 rounded mt-2">
                    <p className="font-semibold text-red-700 mb-1">Reject Reason:</p>
                    <p className="text-red-600 text-sm">{showNoteHistory.rejectReason}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 🔥 TOAST NOTIFICATION COMPONENT */}
        <div className="fixed bottom-4 right-4 z-[100] space-y-2">
          {toasts.map(toast => (
            <div 
              key={toast.id} 
              className={`px-4 py-2 rounded shadow-lg text-white text-sm flex items-center gap-2 animate-slide-in ${
                toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
              }`}
            >
              {toast.type === 'success' ? '✅' : '❌'} {toast.message}
            </div>
          ))}
        </div>
      </>
    );
  }

  
  // Halaman Utama
  return (    
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Meeting List</h1>
          <div className="flex gap-4 items-center">
            <span className="text-sm font-medium bg-gray-200 px-3 py-1 rounded-full">
              {currentUser.name} ({currentUser.role})
            </span>
            <button onClick={() => setCurrentUser(null)} className="text-sm text-red-500 hover:underline">Logout</button>
            <button onClick={() => { setEditingMeeting(null); setShowMeetingForm(true); }} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Create Meeting</button>
          </div>
        </div>
        
        <div className="grid gap-4">
          {meetings.length === 0 && <p className="text-gray-500 text-center py-10">No meetings found.</p>}
          {meetings.map(m => (
            <div key={m.id} onClick={() => setSelectedMeeting(m)} className="bg-white p-5 rounded-lg shadow hover:shadow-lg hover:border-blue-500 border border-transparent cursor-pointer flex justify-between items-center transition-all">
              <div>
                <h3 className="font-bold text-lg text-gray-800">{m.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{m.date} at {m.time} &bull; {m.place}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusBadge(m.status)}`}>
                {m.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 🔥 TOAST NOTIFICATION COMPONENT */}
      <div className="fixed bottom-4 right-4 z-[100] space-y-2">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className={`px-4 py-2 rounded shadow-lg text-white text-sm flex items-center gap-2 ${
              toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}
          >
            {toast.type === 'success' ? '✅' : '❌'} {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;