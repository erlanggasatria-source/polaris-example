import React, { useState } from 'react';
import { runtime } from '../App';

export const NoteForm: React.FC = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await runtime.execute('note/wf-create', {
        title,
        content,
      });
      setTitle('');
      setContent('');
    } catch (err: any) {
      // Errors are handled globally via runtime.subscribeAll in App.tsx
    }
  };

  return (
    <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h3>Add New Note</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '0.5rem' }}>
          <input
            type="text"
            placeholder="Note title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <textarea
            placeholder="Note content..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <button type="submit" style={{ padding: '8px 16px', cursor: 'pointer', background: '#0066cc', color: '#fff', border: 'none', borderRadius: '4px' }}>
          Save Note
        </button>
      </form>
    </div>
  );
};