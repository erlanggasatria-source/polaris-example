import React, { useState } from 'react';
import { runtime, can } from '../App';
import { INoteData } from '../models/NoteModel';

export const NoteItem: React.FC<{ note: INoteData }> = ({ note }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);

  // Guards reaktif
  const canEdit = can('note/wf-update', note);
  const canLock = can('note/wf-lock', note);
  const canDelete = can('note/wf-delete', note);

  const handleUpdate = async () => {
    const result = await runtime.execute('note/wf-update', { ...note, title, content });
    if (result.status === 'success') setIsEditing(false);
  };

  const handleLock = async () => {
    await runtime.execute('note/wf-lock', { id: note.id, status: note.status });
  };

  const handleDelete = async () => {
    await runtime.execute('note/wf-delete', { id: note.id, status: note.status });
  };

  return (
    <div className={`note-card status-${note.status}`}>
      <div>
        <div className="card-header">
          <span className={`badge badge-${note.status}`}>{note.status.toUpperCase()}</span>
          <small style={{ color: '#64748b', fontSize: '0.75rem' }}>
            {new Date(note.updatedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </small>
        </div>

        {isEditing ? (
          <div className="edit-box">
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
            <textarea value={content} onChange={(e) => setContent(e.target.value)} />
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <button onClick={handleUpdate} style={{ background: '#16a34a', color: '#fff' }}>Save</button>
              <button onClick={() => setIsEditing(false)} style={{ background: '#475569', color: '#fff' }}>Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <h3 className="card-title">{note.title}</h3>
            <p className="card-body">{note.content}</p>
          </>
        )}
      </div>

      <div className="card-actions">
        <button disabled={!canEdit} onClick={() => setIsEditing(true)}>
          ✏️ Edit
        </button>
        <button disabled={!canLock} onClick={handleLock}>
          🔒 Lock
        </button>
        <button disabled={!canDelete} onClick={handleDelete}>
          🗑️ Delete
        </button>
      </div>
    </div>
  );
};