export type MeetingStatus = 'draft' | 'waiting_approval' | 'scheduled' | 'waiting_note_approval' | 'done' | 'canceled';

export interface MeetingNote {
  id: string;
  content: string;
  status: 'active' | 'inactive' | 'rejected';
  createdBy: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectReason?: string;
  version: number;
}

export interface MeetingLog {
  created: { user: string; date: string };
  sent_approval?: { user: string; date: string };
  approve?: { user: string; date: string };
  reject_approval?: { user: string; date: string; reason: string };
  note_added?: { user: string; date: string; noteId: string };
  note_revised?: { user: string; date: string; oldNoteId: string; newNoteId: string };
  approve_note?: { user: string; date: string; noteId: string };
  reject_note?: { user: string; date: string; reason: string; noteId: string };
  done?: { user: string; date: string };
  cancel?: { user: string; date: string; reason: string };
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  place: string;
  agenda: string[];
  participants: string[];
  notes: MeetingNote[];
  activeNoteId: string | null;
  status: MeetingStatus;
  createdBy: string;
  log: MeetingLog;
  updatedAt: string;
}