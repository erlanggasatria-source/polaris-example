// src/domain/meeting.model.ts
import type { Meeting, MeetingStatus, MeetingNote, MeetingLog } from '../types/meeting.types';

// ===== HELPERS =====
function generateId(): string {
  return `MET-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

function generateNoteId(): string {
  return `NOTE-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

function getDefaultLog(userId: string): MeetingLog {
  return { created: { user: userId, date: new Date().toISOString() } };
}

// ===== DOMAIN CLASS =====
export class MeetingModel {
  private data: Meeting;
  private log: MeetingLog;

  constructor(data: Partial<Meeting>, userId?: string) {
    const now = new Date().toISOString();
    const defaultData: Meeting = {
      id: generateId(),
      title: '',
      date: '',
      time: '',
      place: '',
      agenda: [],
      participants: [],
      notes: [],
      activeNoteId: null,
      status: 'draft',
      createdBy: userId || 'unknown',
      log: getDefaultLog(userId || 'unknown'),
      updatedAt: now
    };

    this.data = { ...defaultData, ...data };
    this.log = this.data.log;
  }

  // ===== GETTER =====
  get id(): string { return this.data.id; }
  get status(): MeetingStatus { return this.data.status; }
  get createdBy(): string { return this.data.createdBy; }
  get notes(): MeetingNote[] { return this.data.notes; }
  get activeNoteId(): string | null { return this.data.activeNoteId; }
  get dataPayload(): Meeting { return this.data; }

  // ===== VALIDASI =====
  validateBasic(): string[] {    
    const errors: string[] = [];
    if (!this.data.title) errors.push('title');
    if (!this.data.date) errors.push('date');
    if (this.data.agenda.length == 0) errors.push('agenda');
    return errors;
  }

  validateStatus(allowed: MeetingStatus[]): boolean {
    return allowed.includes(this.data.status);
  }

  validateCreator(userId: string): boolean {
    return this.data.createdBy === userId;
  }

  validateRole(role: string, allowed: string[]): boolean {
    return allowed.includes(role);
  }

  // ===== NOTE =====
  addNote(content: string, userId: string): void {
    if (!content || content.trim() === '') {
      throw new Error('Note cannot be empty');
    }
    const newNote: MeetingNote = {
      id: generateNoteId(),
      content,
      status: 'active',
      createdBy: userId,
      createdAt: new Date().toISOString(),
      version: 1
    };
    this.data.notes.push(newNote);
    this.data.activeNoteId = newNote.id;
    this.addLog('note_added', { user: userId, noteId: newNote.id });
    this.data.updatedAt = new Date().toISOString();
  }

  reviseNote(content: string, userId: string): void {
    if (!content || content.trim() === '') {
      throw new Error('Note cannot be empty');
    }
    const activeNote = this.data.notes.find(n => n.id === this.data.activeNoteId);
    if (!activeNote) {
      throw new Error('No active note found to revise');
    }
    activeNote.status = 'inactive';
    const newNote: MeetingNote = {
      id: generateNoteId(),
      content,
      status: 'active',
      createdBy: userId,
      createdAt: new Date().toISOString(),
      version: (activeNote.version || 0) + 1
    };
    this.data.notes.push(newNote);
    this.data.activeNoteId = newNote.id;
    this.addLog('note_revised', { user: userId, oldNoteId: activeNote.id, newNoteId: newNote.id });
    this.data.updatedAt = new Date().toISOString();
  }

  approveNote(userId: string): void {
    const activeNote = this.data.notes.find(n => n.id === this.data.activeNoteId);
    if (!activeNote) {
      throw new Error('No active note found to approve');
    }
    activeNote.approvedBy = userId;
    activeNote.approvedAt = new Date().toISOString();
    this.addLog('approve_note', { user: userId, noteId: activeNote.id });
    this.transitionTo('done');
  }

  rejectNote(userId: string, reason: string): void {
    const activeNote = this.data.notes.find(n => n.id === this.data.activeNoteId);
    if (!activeNote) {
      throw new Error('No active note found to reject');
    }
    activeNote.status = 'rejected';
    activeNote.rejectedBy = userId;
    activeNote.rejectedAt = new Date().toISOString();
    activeNote.rejectReason = reason;
    this.addLog('reject_note', { user: userId, reason, noteId: activeNote.id });
    this.data.activeNoteId = null;
    this.transitionTo('scheduled');
  }

  // ===== LOG =====
  addLog(type: keyof MeetingLog, data: any): void {
    const logEntry = { user: data.user, date: new Date().toISOString(), ...data };
    this.log[type] = logEntry;
  }

  // ===== TRANSISI STATUS =====
  transitionTo(newStatus: MeetingStatus): void {
    this.data.status = newStatus;
    this.data.updatedAt = new Date().toISOString();
  }

  // ===== UPDATE DATA (untuk edit draft) =====
  updateFields(updates: Partial<Meeting>): void {
    if (updates.title) this.data.title = updates.title;
    if (updates.date) this.data.date = updates.date;
    if (updates.time) this.data.time = updates.time;
    if (updates.place) this.data.place = updates.place;
    if (updates.agenda) this.data.agenda = updates.agenda;
    if (updates.participants) this.data.participants = updates.participants;
    this.data.updatedAt = new Date().toISOString();
  }

  // ===== OUTPUT UNTUK REPO =====
  toPayload(): { domain: 'meetings'; data: Meeting } {
    return {
      domain: 'meetings',
      data: this.data
    };
  }

  // ===== STATIC: untuk create dari input =====
  static createFromInput(input: any, userId: string): MeetingModel {
    const model = new MeetingModel({}, userId);
    
    model.data.title = input.title;
    model.data.date = input.date;
    model.data.time = input.time || '';
    model.data.place = input.place || '';
    model.data.agenda = input.agenda ? input.agenda : [];
    model.data.participants = input.participants || [];
    if (input.note && input.note.trim() !== '') {
      model.addNote(input.note, userId);
    }

    const errors = model.validateBasic();    
    if (errors.length > 0) {
      throw new Error(`Required: ${errors.join(', ')}`);
    }

    return model;
  }
}