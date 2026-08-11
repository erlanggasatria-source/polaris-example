import React, { useState } from 'react';

interface MeetingFormProps {
  mode: 'future' | 'past';
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading: boolean;
}

const users = [
  { id: 'user-001', name: 'Liu Ruyan', role: 'Leader' },
  { id: 'user-002', name: 'Sheng Min Yan', role: 'Secretary' },
  { id: 'user-003', name: 'Chen fan', role: 'Member' }
];

export default function MeetingForm({ mode, onSubmit, onCancel, loading }: MeetingFormProps) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [place, setPlace] = useState('');
  const [agenda, setAgenda] = useState('');
  const [note, setNote] = useState('');
  const [participants, setParticipants] = useState<string[]>([]);

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isPast = mode === 'past';
    onSubmit({
      title,
      date,
      time,
      place,
      agenda,
      note,
      participants,
      isPast
    });
  };

  return (
    <div className="meeting-form">
      <h2>{mode === 'future' ? '📅 Rencanakan Meeting' : '📝 Catat Meeting'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Title *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Date *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              min={mode === 'future' ? today : undefined}
              max={mode === 'past' ? today : undefined}
            />
          </div>
          <div className="form-group">
            <label>Time</label>
            <input type="text" value={time} onChange={(e) => setTime(e.target.value)} placeholder="15:00 - 17:00" />
          </div>
        </div>

        <div className="form-group">
          <label>Place</label>
          <input type="text" value={place} onChange={(e) => setPlace(e.target.value)} placeholder="Council room" />
        </div>

        <div className="form-group">
          <label>Agenda</label>
          <textarea
            value={agenda}
            onChange={(e) => setAgenda(e.target.value)}
            rows={3}
            placeholder="Satu agenda per baris&#10;Pembahasan dekorasi&#10;Pembahasan sponsorship"
          />
        </div>

        <div className="form-group">
          <label>Participants</label>
          <select
            multiple
            value={participants}
            onChange={(e) => {
              const values = Array.from(e.target.selectedOptions, (opt) => opt.value);
              setParticipants(values);
            }}
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>
          <small>Hold Ctrl/Cmd to select multiple</small>
        </div>

        <div className="form-group">
          <label>Note / Hasil Meeting {mode === 'past' && <span className="required">*</span>}</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            placeholder={mode === 'past' ? 'Catatan hasil meeting...' : 'Catatan (opsional)...'}
            required={mode === 'past'}
          />
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} disabled={loading}>Cancel</button>
          <button type="submit" disabled={loading}>
            {loading ? 'Saving...' : mode === 'future' ? 'Simpan Draft' : 'Simpan Catatan'}
          </button>
        </div>
      </form>
    </div>
  );
}