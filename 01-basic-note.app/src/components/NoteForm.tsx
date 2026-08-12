import React, { useState } from 'react';
import { runtime } from '../App';

export const NoteForm: React.FC = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await runtime.execute('note/wf-create', { title, content });
    if (result.status === 'success') {
      setTitle('');
      setContent('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="note-form">
      <h2>Create New Note</h2>
      <input
        type="text"
        placeholder="Note Title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        placeholder="Note Content..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <button type="submit">Save Draft Note</button>
    </form>
  );
};