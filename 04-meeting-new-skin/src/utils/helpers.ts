import type { MeetingStatus, MeetingLog } from '../types';

export const statusBadge = (status: MeetingStatus): string => {
  switch (status) {
    case 'draft': return 'bg-gray-200 text-gray-800';
    case 'waiting_approval': return 'bg-yellow-200 text-yellow-800';
    case 'scheduled': return 'bg-blue-200 text-blue-800';
    case 'waiting_note_approval': return 'bg-purple-200 text-purple-800';
    case 'done': return 'bg-green-200 text-green-800';
    case 'canceled': return 'bg-red-200 text-red-800';
    default: return 'bg-gray-200 text-gray-800';
  }
};

export const renderLogHistory = (log: MeetingLog): {label: string, date: string, user: string, reason?: string}[] => {
  const history = [];
  if (log.created) history.push({ label: 'Created', ...log.created });
  if (log.sent_approval) history.push({ label: 'Sent for Approval', ...log.sent_approval });
  if (log.approve) history.push({ label: 'Approved', ...log.approve });
  if (log.reject_approval) history.push({ label: 'Rejected', ...log.reject_approval, reason: log.reject_approval.reason });
  if (log.note_added) history.push({ label: 'Note Added', ...log.note_added });
  if (log.note_revised) history.push({ label: 'Note Revised', ...log.note_revised });
  if (log.approve_note) history.push({ label: 'Note Approved', ...log.approve_note });
  if (log.reject_note) history.push({ label: 'Note Rejected', ...log.reject_note, reason: log.reject_note.reason });
  if (log.done) history.push({ label: 'Done', ...log.done });
  if (log.cancel) history.push({ label: 'Canceled', ...log.cancel, reason: log.cancel.reason });
  return history.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};