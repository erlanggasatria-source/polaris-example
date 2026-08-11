import React, { useEffect, useState } from 'react';
import { runtime } from '../App';
import type { NoteItem } from '../plugins/note.plugin';
import { logger } from '@polaris-runtime/core/dev';

export const NoteList: React.FC = () => {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const fetchNotes = async (source: string) => {
    logger.debug('Refetching notes list, source:', source);
    try {
      const res = await runtime.execute('note/wf-list', { _t: Date.now() });
      setNotes(res.payload || []);
    } catch (err: any) {
      logger.error('Failed to fetch notes list:', err);
    }
  };

  useEffect(() => {
    // Initial fetch on component mount
    fetchNotes('initial');

    // Granular subscriptions filtered by workflow completion
    const unsubCreate = runtime.subscribe('note/wf-create', (event) => {
      if (event.type === 'workflow_completed') fetchNotes('create');
    });

    const unsubUpdate = runtime.subscribe('note/wf-update', (event) => {
      if (event.type === 'workflow_completed') fetchNotes('update');
    });

    const unsubDelete = runtime.subscribe('note/wf-delete', (event) => {
      if (event.type === 'workflow_completed') fetchNotes('delete');
    });

    return () => {
      unsubCreate();
      unsubUpdate();
      unsubDelete();
    };
  }, []);

  const handleStartEdit = (note: NoteItem) => {
    setEditingId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  const handleSaveEdit = async (id: string) => {
    try {
      await runtime.execute('note/wf-update', {
        id,
        title: editTitle,
        content: editContent,
      });
      setEditingId(null);
    } catch (err: any) {
      // Handled globally
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
      await runtime.execute('note/wf-delete', { id });
    } catch (err: any) {
      // Handled globally
    }
  };

  return (
    <div>
      <h3>Note List</h3>
      {notes.length === 0 ? (
        <p style={{ color: '#666' }}>No notes available.</p>
      ) : (
        notes.map((note) => (
          <div key={note.id} style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '6px', marginBottom: '0.5rem' }}>
            {editingId === note.id ? (
              <div>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  style={{ width: '100%', padding: '6px', marginBottom: '4px' }}
                />
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={2}
                  style={{ width: '100%', padding: '6px', marginBottom: '4px' }}
                />
                <button onClick={() => handleSaveEdit(note.id)} style={{ marginRight: '8px' }}>Save</button>
                <button onClick={() => setEditingId(null)}>Cancel</button>
              </div>
            ) : (
              <div>
                <h4 style={{ margin: '0 0 4px 0' }}>{note.title}</h4>
                <p style={{ margin: '0 0 8px 0', color: '#444' }}>{note.content}</p>
                <small style={{ color: '#888' }}>{new Date(note.updatedAt).toLocaleString('en-US')}</small>
                <div style={{ marginTop: '8px' }}>
                  <button onClick={() => handleStartEdit(note)} style={{ marginRight: '8px' }}>Edit</button>
                  <button onClick={() => handleDelete(note.id)} style={{ color: 'red' }}>Delete</button>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};