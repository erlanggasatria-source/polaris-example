// src/components/MeetingDetail.tsx
import React, { useState } from 'react';
import { Meeting, MeetingNote } from '../types/meeting.types';

interface MeetingDetailProps {
  meeting: Meeting;
  runtime: any;
  onAction: (workflowName: string, input: any) => void;
  onClose: () => void;
  loading: boolean;
}

export default function MeetingDetail({
  meeting,
  runtime,
  onAction,
  onClose,
  loading
}: MeetingDetailProps) {
  const [newNote, setNewNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectType, setRejectType] = useState<'approval' | 'note'>('approval');
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    title: meeting.title,
    date: meeting.date,
    time: meeting.time,
    place: meeting.place,
    agenda: meeting.agenda.join('\n'),
    participants: meeting.participants.join(', '),
    note: meeting.notes?.find(n => n.status === 'active')?.content || '' 
  });

  if (!meeting || !meeting.id) return <div className="meeting-detail"><p>Meeting tidak valid</p></div>;

  const globalContext = runtime.getGlobalContext();
  const currentUserId = globalContext.get('userId') || 'unknown';
  const currentRole = globalContext.get('role') || 'member';

  const status = meeting.status;
  const isCreator = meeting.createdBy === currentUserId;

  // ===== HELPERS =====
  const can = (workflowName: string, extraInput: any = {}) => {
    const result = runtime.canExecute(workflowName, {
      id: meeting.id,
      status: meeting.status,
      domain: 'meetings',
      meeting,
      ...extraInput
    });
    return result.allowed;
  };

  const handleAction = (workflowName: string, input: any = {}) => {
    if (!meeting || !meeting.id) return;
    const payload = { id: meeting.id, status: meeting.status, domain: 'meetings', meeting, ...input };
    onAction(workflowName, payload);
  };

  // ===== STATUS BADGE =====
  const statusLabels: Record<string, string> = {
    draft: 'Draft',
    waiting_approval: 'Waiting Approval',
    scheduled: 'Scheduled',
    waiting_note_approval: 'Waiting Note Approval',
    done: 'Done',
    canceled: 'Canceled'
  };
  const statusColors: Record<string, string> = {
    draft: '#888',
    waiting_approval: '#f7d44a',
    scheduled: '#6c63ff',
    waiting_note_approval: '#f7a84a',
    done: '#6caf7a',
    canceled: '#f76c6c'
  };

  // ===== RENDER NOTE =====
  const renderNote = (note: MeetingNote) => (
    <div key={note.id} className={`log-item status-${note.status}`}>
      <span className="log-user">{note.createdBy}</span>
      <span className="log-date">{new Date(note.createdAt).toLocaleString()}</span>
      <span className="note-status">{note.status === 'active' ? '✅' : note.status === 'inactive' ? '⏳' : '❌'}</span>
      <pre className="log-note">{note.content}</pre>
      {note.rejectReason && <div className="reject-reason">📌 Reason: {note.rejectReason}</div>}
      {note.approvedBy && <div className="approve-info">✅ Approved by {note.approvedBy}</div>}
    </div>
  );

  // ===== RENDER ACTIONS =====
  const renderActions = () => {
    const actions = [];

    // 1. Submit Approval (draft → waiting_approval atau waiting_note_approval)
    if (status === 'draft' && isCreator && can('meeting/wf-submit-approval')) {
      actions.push(
        <button key="submit" className="btn-submit" onClick={() => handleAction('meeting/wf-submit-approval')} disabled={loading}>
          📤 Ajukan Approval
        </button>
      );
    }

    // 2. Approve Jadwal (waiting_approval → scheduled)
    if (status === 'waiting_approval' && can('meeting/wf-approve')) {
      actions.push(
        <button key="approve" className="btn-approve" onClick={() => handleAction('meeting/wf-approve')} disabled={loading}>
          ✅ Setujui Jadwal
        </button>
      );
    }

    // 3. Reject Jadwal (waiting_approval → draft)
    if (status === 'waiting_approval' && can('meeting/wf-reject-approval')) {
      actions.push(
        <button key="reject" className="btn-reject" onClick={() => { setRejectType('approval'); setShowRejectModal(true); }} disabled={loading}>
          ❌ Tolak Jadwal
        </button>
      );
    }

    // 4. Add Note (scheduled → waiting_note_approval)
    if (status === 'scheduled' && can('meeting/wf-add-note')) {
      actions.push(
        <button key="addNote" className="btn-note" onClick={() => setShowNoteInput(true)} disabled={loading}>
          📝 Tambah Note
        </button>
      );
    }

    // 5. Revise Note (waiting_note_approval → waiting_note_approval)
    if (['waiting_note_approval', 'done'].includes(status) && isCreator && can('meeting/wf-revise-note')) {
      actions.push(
        <button key="reviseNote" className="btn-revise" onClick={() => setShowNoteInput(true)} disabled={loading}>
          ✏️ Revisi Note
        </button>
      );
    }

    // 6. Approve Note (waiting_note_approval → done)
    if (status === 'waiting_note_approval' && can('meeting/wf-approve-note')) {
      actions.push(
        <button key="approveNote" className="btn-approve" onClick={() => handleAction('meeting/wf-approve-note')} disabled={loading}>
          ✅ Setujui Note
        </button>
      );
    }

    // 7. Reject Note (waiting_note_approval → scheduled)
    if (status === 'waiting_note_approval' && can('meeting/wf-reject-note')) {
      actions.push(
        <button key="rejectNote" className="btn-reject" onClick={() => { setRejectType('note'); setShowRejectModal(true); }} disabled={loading}>
          ❌ Tolak Note
        </button>
      );
    }

    // 8. Edit Draft (draft only)
    if (status === 'draft' && isCreator && can('meeting/wf-edit-draft')) {
      actions.push(
        <button key="edit" className="btn-edit" onClick={() => setEditMode(true)} disabled={loading}>
          ✏️ Edit
        </button>
      );
    }

    // 9. Delete Draft (draft only)
    if (status === 'draft' && isCreator && can('meeting/wf-delete-draft')) {
      actions.push(
        <button key="delete" className="btn-delete" onClick={() => {
          if (confirm('Yakin ingin menghapus meeting ini?')) {
            handleAction('meeting/wf-delete-draft');
          }
        }} disabled={loading}>
          🗑️ Hapus
        </button>
      );
    }

    // 10. Cancel
    if (can('meeting/wf-cancel')) {
      actions.push(
        <button key="cancel" className="btn-cancel" onClick={() => {
          const reason = prompt('Alasan pembatalan:');
          if (reason !== null) handleAction('meeting/wf-cancel', { reason: reason || 'No reason' });
        }} disabled={loading}>
          ❌ Batalkan Meeting
        </button>
      );
    }

    return actions;
  };

  // ===== HANDLE EDIT SUBMIT =====
  const handleEditSubmit = () => {
    const payload = {
      data: {
        title: editData.title,
        date: editData.date,
        time: editData.time,
        place: editData.place,
        agenda: editData.agenda,
        participants: editData.participants.split(',').map(s => s.trim()).filter(Boolean),
        note: editData.note
      }
    };
    handleAction('meeting/wf-edit-draft', payload);
    setEditMode(false);
  };

  // ===== RENDER =====
  return (
    <div className="meeting-detail">
      {/* Header */}
      <div className="detail-header">
        <button className="close-btn" onClick={onClose}>✕</button>
        <h2>{meeting.title}</h2>
        <span className="status-badge" style={{ backgroundColor: statusColors[status] || '#888' }}>
          {statusLabels[status] || status}
        </span>
      </div>

      {/* Body */}
      <div className="detail-body">
        {!editMode ? (
          // ===== VIEW MODE =====
          <>
            <div className="detail-info">
              <div className="info-row"><span>📅 Date</span> {new Date(meeting.date).toLocaleDateString()}</div>
              <div className="info-row"><span>⏰ Time</span> {meeting.time || '-'}</div>
              <div className="info-row"><span>📍 Place</span> {meeting.place || '-'}</div>
              <div className="info-row"><span>👥 Participants</span> {meeting.participants?.join(', ') || '-'}</div>
            </div>

            {meeting.agenda && meeting.agenda.length > 0 && (
              <div className="detail-section">
                <h4>📋 Agenda</h4>
                <ul className="agenda-list">
                  {meeting.agenda.map((item, idx) => <li key={idx}>{item}</li>)}
                </ul>
              </div>
            )}

            {/* ===== NOTE AKTIF ===== */}
            <div className="detail-section">
              <h4>📝 Note Aktif</h4>
              {meeting.activeNoteId ? (
                (() => {
                  const activeNote = meeting.notes?.find(n => n.id === meeting.activeNoteId);
                  return activeNote ? (
                    <div className="note-content active-note">
                      <pre>{activeNote.content}</pre>
                      <div className="note-meta">
                        <span>by {activeNote.createdBy}</span>
                        <span>{new Date(activeNote.createdAt).toLocaleString()}</span>
                        {activeNote.approvedBy && <span>✅ Approved by {activeNote.approvedBy}</span>}
                      </div>
                    </div>
                  ) : <p className="empty-note">Tidak ada note aktif</p>;
                })()
              ) : (
                <p className="empty-note">Tidak ada note aktif</p>
              )}
            </div>

            {meeting.notes && meeting.notes.length > 0 && (
              <div className="detail-section">
                <h4>📝 Riwayat Note</h4>
                <div className="log-list">{meeting.notes.map(renderNote)}</div>
              </div>
            )}

            <div className="detail-section">
              <h4>📜 Riwayat Status</h4>
              <div className="log-list">
                {meeting.log.created && <div className="log-item"><span className="log-user">{meeting.log.created.user}</span><span className="log-date">{new Date(meeting.log.created.date).toLocaleString()}</span><span>📝 Created</span></div>}
                {meeting.log.sent_approval && <div className="log-item"><span className="log-user">{meeting.log.sent_approval.user}</span><span className="log-date">{new Date(meeting.log.sent_approval.date).toLocaleString()}</span><span>📤 Sent Approval</span></div>}
                {meeting.log.approve && <div className="log-item"><span className="log-user">{meeting.log.approve.user}</span><span className="log-date">{new Date(meeting.log.approve.date).toLocaleString()}</span><span>✅ Approved</span></div>}
                {meeting.log.reject_approval && <div className="log-item"><span className="log-user">{meeting.log.reject_approval.user}</span><span className="log-date">{new Date(meeting.log.reject_approval.date).toLocaleString()}</span><span>❌ Rejected Approval</span><div className="reject-reason">📌 Reason: {meeting.log.reject_approval.reason}</div></div>}
                {meeting.log.note_added && <div className="log-item"><span className="log-user">{meeting.log.note_added.user}</span><span className="log-date">{new Date(meeting.log.note_added.date).toLocaleString()}</span><span>📝 Note Added</span></div>}
                {meeting.log.note_revised && <div className="log-item"><span className="log-user">{meeting.log.note_revised.user}</span><span className="log-date">{new Date(meeting.log.note_revised.date).toLocaleString()}</span><span>✏️ Note Revised</span></div>}
                {meeting.log.approve_note && <div className="log-item"><span className="log-user">{meeting.log.approve_note.user}</span><span className="log-date">{new Date(meeting.log.approve_note.date).toLocaleString()}</span><span>✅ Note Approved</span></div>}
                {meeting.log.reject_note && <div className="log-item"><span className="log-user">{meeting.log.reject_note.user}</span><span className="log-date">{new Date(meeting.log.reject_note.date).toLocaleString()}</span><span>❌ Note Rejected</span><div className="reject-reason">📌 Reason: {meeting.log.reject_note.reason}</div></div>}
                {meeting.log.cancel && <div className="log-item"><span className="log-user">{meeting.log.cancel.user}</span><span className="log-date">{new Date(meeting.log.cancel.date).toLocaleString()}</span><span>❌ Canceled</span><div className="reject-reason">📌 Reason: {meeting.log.cancel.reason}</div></div>}
              </div>
            </div>
          </>
        ) : (
          // ===== EDIT MODE =====
          <div className="edit-mode">
            <h4>✏️ Edit Meeting</h4>
            <div className="form-group">
              <label>Title</label>
              <input type="text" value={editData.title} onChange={(e) => setEditData({...editData, title: e.target.value})} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Date</label>
                <input type="date" value={editData.date} onChange={(e) => setEditData({...editData, date: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Time</label>
                <input type="text" value={editData.time} onChange={(e) => setEditData({...editData, time: e.target.value})} placeholder="15:00 - 17:00" />
              </div>
            </div>
            <div className="form-group">
              <label>Place</label>
              <input type="text" value={editData.place} onChange={(e) => setEditData({...editData, place: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Agenda (satu baris per item)</label>
              <textarea value={editData.agenda} onChange={(e) => setEditData({...editData, agenda: e.target.value})} rows={3} />
            </div>
            <div className="form-group">
              <label>Note (opsional, jika meeting sudah terjadi)</label>
              <textarea
                value={editData.note}
                onChange={(e) => setEditData({...editData, note: e.target.value})}
                rows={4}
                placeholder="Catatan meeting..."
              />
            </div>
            <div className="form-group">
              <label>Participants (pisahkan dengan koma)</label>
              <input type="text" value={editData.participants} onChange={(e) => setEditData({...editData, participants: e.target.value})} />
            </div>
            <div className="form-actions">
              <button onClick={() => setEditMode(false)} disabled={loading}>Cancel</button>
              <button onClick={handleEditSubmit} disabled={loading}>Save</button>
            </div>
          </div>
        )}
      </div>

      {/* Actions (hanya di view mode) */}
      {!editMode && (
        <div className="detail-actions">{renderActions()}</div>
      )}

      {/* Note Input Modal */}
      {showNoteInput && (
        <div className="note-input-modal">
          <div className="note-input-box">
            <h4>{status === 'scheduled' ? '📝 Tambah Note' : '✏️ Revisi Note'}</h4>
            <textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} rows={4} placeholder="Tulis note..." />
            <div className="note-actions">
              <button onClick={() => setShowNoteInput(false)}>Cancel</button>
              <button onClick={() => {
                if (newNote.trim()) {
                  const workflow = status === 'scheduled' ? 'meeting/wf-add-note' : 'meeting/wf-revise-note';
                  handleAction(workflow, { note: newNote });
                  setNewNote('');
                  setShowNoteInput(false);
                }
              }} disabled={!newNote.trim() || loading}>Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="note-input-modal">
          <div className="note-input-box">
            <h4>{rejectType === 'approval' ? '❌ Tolak Jadwal' : '❌ Tolak Note'}</h4>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} placeholder="Alasan penolakan..." />
            <div className="note-actions">
              <button onClick={() => setShowRejectModal(false)}>Cancel</button>
              <button onClick={() => {
                if (rejectReason.trim()) {
                  const workflow = rejectType === 'approval' ? 'meeting/wf-reject-approval' : 'meeting/wf-reject-note';
                  handleAction(workflow, { reason: rejectReason });
                  setRejectReason('');
                  setShowRejectModal(false);
                }
              }} disabled={!rejectReason.trim() || loading}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}