import React, { useEffect, useState } from 'react';
import { IWorkflowEvent, logger } from '@polaris-runtime/core/dev';
import { runtime } from '../App';
import { NoteItem } from './NoteItem';
import { INoteData } from '../models/NoteModel';

export const NoteList: React.FC = () => {
  const [notes, setNotes] = useState<INoteData[]>([]);

  const fetchNotes = async () => {
    const res = await runtime.execute('note/wf-list', { _t: Date.now() });
    if (res.status === 'success') setNotes(res.payload || []);
  };

  useEffect(() => {
    fetchNotes();

    const unsubscribe = runtime.subscribeAll((event: IWorkflowEvent) => {
      if (event.type === 'workflow_completed' && event.workflowPath !== 'note/wf-list') {
        fetchNotes();
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="note-list-container">
      <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Notes Collection ({notes.length})</h2>
      {notes.length === 0 ? (
        <p style={{ color: '#64748b' }}>No notes found. Create your first draft note above!</p>
      ) : (
        <div className="note-grid">
          {notes.map((note) => (
            <NoteItem key={note.id} note={note} />
          ))}
        </div>
      )}
    </div>
  );
};