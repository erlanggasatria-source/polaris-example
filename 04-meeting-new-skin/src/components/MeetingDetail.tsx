import React, { useState } from 'react';
import  type { Meeting, MeetingNote } from '../types';
import { AVAILABLE_USERS } from '../data/mockData';
import { statusBadge, renderLogHistory } from '../utils/helpers';
import { runtime } from '../runtime'; 

interface DetailProps {
  meeting: Meeting;
  currentUser: string;
  onBack: () => void;
  onEdit: () => void;
  onRejectClick: (workflow: string, id?: string) => void;
  onShowNoteHistory: (note: MeetingNote) => void;
  onAction: (workflow: string, meeting: Meeting, payload?: Record<string, unknown>) => void;
}

// Tombol dinamis berdasarkan evaluasi Polaris
const ActionButton: React.FC<{ check: { allowed: boolean; reason?: string }, onClick: () => void, color: string, children: React.ReactNode }> = 
  ({ check, onClick, color, children }) => {
  if (!check.allowed && !check.reason) return null; // Hidden jika tidak ada reason

  return (
    <button
      onClick={onClick}
      disabled={!check.allowed}
      title={check.reason}
      className={`${check.allowed ? `${color} text-white hover:brightness-110` : 'bg-gray-200 text-gray-400 cursor-not-allowed'} px-4 py-2 rounded text-sm transition-all`}
    >
      {children}
    </button>
  );
};

const MeetingDetail: React.FC<DetailProps> = ({ meeting, onBack, onEdit, onRejectClick, onShowNoteHistory, onAction }) => {
  const activeNote = meeting.notes.find(n => n.id === meeting.activeNoteId);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteContent, setNoteContent] = useState('');

  const handleSaveNote = (workflow: string) => {    
    onAction(workflow, meeting, { note: noteContent, ...meeting });
    setShowNoteForm(false);
    setNoteContent('');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="mb-4 text-blue-500 hover:underline flex items-center gap-2">
          &larr; Back to List
        </button>
        
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex justify-between items-start mb-6 border-b pb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{meeting.title}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusBadge(meeting.status)}`}>
                {meeting.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            
            <div className="flex gap-2">
              {/* Tombol Edit: Mengirim data meeting ke form */}
              <ActionButton 
                check={runtime.canExecute('meeting/wf-edit-draft', { ...meeting })} 
                onClick={onEdit} 
                color="bg-blue-500"
              >
                Edit Meeting
              </ActionButton>
              
              {/* Tombol Delete: Memunculkan konfirmasi lalu memanggil workflow delete */}
              <ActionButton 
                check={runtime.canExecute('meeting/wf-delete-draft', { ...meeting })} 
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this meeting?')) {
                    onAction('meeting/wf-delete-draft', meeting);
                  }
                }} 
                color="bg-red-500"
              >
                Delete Meeting
              </ActionButton>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="space-y-1">
              <h4 className="text-xs text-gray-500 uppercase font-semibold">Date & Time</h4>
              <p className="text-gray-800">{meeting.date} at {meeting.time}</p>
            </div>
            <div className="space-y-1">
              <h4 className="text-xs text-gray-500 uppercase font-semibold">Location</h4>
              <p className="text-gray-800">{meeting.place}</p>
            </div>
            <div className="space-y-1">
              <h4 className="text-xs text-gray-500 uppercase font-semibold">Created By</h4>
              <p className="text-gray-800">{AVAILABLE_USERS.find(u => u.userId === meeting.createdBy)?.name || meeting.createdBy}</p>
            </div>
            <div className="space-y-1">
              <h4 className="text-xs text-gray-500 uppercase font-semibold">Participants</h4>
              <p className="text-gray-800 text-sm">{meeting.participants.map(p => AVAILABLE_USERS.find(u => u.userId === p)?.name || p).join(', ')}</p>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-xs text-gray-500 uppercase font-semibold mb-2">Agenda</h4>
            <ul className="list-disc list-inside bg-gray-50 p-4 rounded-lg text-gray-700 text-sm space-y-1">
              {meeting.agenda.map((a, i) => <li key={i}>{a}</li>)}
            </ul>
          </div>

          <div className="flex flex-wrap gap-2 border-t pt-4">
            <ActionButton check={runtime.canExecute('meeting/wf-submit-approval', { ...meeting })} onClick={() => onAction('meeting/wf-submit-approval', meeting)} color="bg-yellow-500">
              Send Approval
            </ActionButton>
            <ActionButton check={runtime.canExecute('meeting/wf-approve', { ...meeting })} onClick={() => onAction('meeting/wf-approve', meeting)} color="bg-green-500">
              Approve Meeting
            </ActionButton>
            <ActionButton check={runtime.canExecute('meeting/wf-reject-approval', { ...meeting })} onClick={() => onRejectClick('meeting/wf-reject-approval', meeting.id)} color="bg-red-500">
              Reject Approval
            </ActionButton>
            <ActionButton check={runtime.canExecute('meeting/wf-add-note', { ...meeting })} onClick={() => setShowNoteForm(true)} color="bg-blue-500">
              Add Note
            </ActionButton>
            <ActionButton check={runtime.canExecute('meeting/wf-cancel', { ...meeting })} onClick={() => onRejectClick('meeting/wf-cancel', meeting.id)} color="bg-gray-600">
              Cancel Meeting
            </ActionButton>
          </div>

          {showNoteForm && (
            <div className="mt-4 bg-gray-50 p-4 rounded border border-blue-200">
              <textarea 
                className="w-full border p-2 rounded mb-2" 
                rows={3}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Masukkan isi note..."
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowNoteForm(false)} className="px-3 py-1 border rounded text-sm">Cancel</button>
                <button
                  onClick={() => {
                    const workflow = runtime.canExecute('meeting/wf-add-note', { ...meeting }).allowed
                      ? 'meeting/wf-add-note'
                      : 'meeting/wf-revise-note';
                    handleSaveNote(workflow);
                  }}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                >
                  Save Note
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Active Note</h2>
            {activeNote && (
              <div className="flex gap-2 flex-wrap">
                <ActionButton check={runtime.canExecute('meeting/wf-approve-note', { status: meeting.status, createdBy: meeting.notes.find(n => n.id === meeting.activeNoteId)?.createdBy })} onClick={() => onAction('meeting/wf-approve-note', meeting, { createdBy: meeting.notes.find(n => n.id === meeting.activeNoteId)?.approvedBy })} color="bg-green-500">
                  Approve Note
                </ActionButton>
                <ActionButton check={runtime.canExecute('meeting/wf-revise-note', { ...meeting })} onClick={() => setShowNoteForm(true)} color="bg-yellow-500">
                  Revise Note
                </ActionButton>
                <ActionButton check={runtime.canExecute('meeting/wf-reject-note', { ...meeting })} onClick={() => onRejectClick('meeting/wf-reject-note', meeting.id)} color="bg-red-500">
                  Reject Note
                </ActionButton>
                <button onClick={() => onShowNoteHistory(activeNote)} className="border border-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-50">
                  View Full History
                </button>
              </div>
            )}
          </div>
          {activeNote ? (
            <div className="bg-gray-50 p-4 rounded border border-gray-200">
              <p className="text-gray-800 whitespace-pre-wrap">{activeNote.content}</p>
              <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between text-xs text-gray-500">
                <span>Created by: {AVAILABLE_USERS.find(u => u.userId === activeNote.createdBy)?.name || activeNote.createdBy}</span>
                <span>Version: {activeNote.version}</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm italic text-center py-4">No active note yet.</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Log History</h2>
          <div className="relative">
            {renderLogHistory(meeting.log).map((log, i) => (
              <div key={i} className="flex gap-4 mb-6 last:mb-0">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full z-10"></div>
                  {i < renderLogHistory(meeting.log).length - 1 && <div className="w-1 h-full bg-gray-200 mt-1"></div>}
                </div>
                <div className="flex-1 -mt-1">
                  <p className="font-semibold text-gray-800">{log.label}</p>
                  <p className="text-xs text-gray-500">{new Date(log.date).toLocaleString()} &bull; by {AVAILABLE_USERS.find(u => u.userId === log.user)?.name || log.user}</p>
                  {log.reason && <p className="text-xs text-red-500 mt-1 bg-red-50 inline-block px-2 py-1 rounded">Reason: {log.reason}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingDetail;