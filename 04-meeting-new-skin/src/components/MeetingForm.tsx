import React, { useState } from 'react';
import type { Meeting } from '../types';
import { AVAILABLE_USERS } from '../data/mockData';

interface FormProps {
  meeting: Meeting | null;
  onSave: (workflow: string, meeting: Meeting) => void;
  onCancel: () => void;
}

const MeetingForm: React.FC<FormProps> = ({ meeting, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Meeting>(
    meeting || {
      id: '', title: '', date: '', time: '', place: '', agenda: [], participants: [],
      notes: [], activeNoteId: null, status: 'draft', createdBy: '', log: { created: { user: '', date: '' } }, updatedAt: ''
    }
  );

  const [agendaInput, setAgendaInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Jika formData.id ada (tidak kosong), berarti ini aksi edit. Jika tidak, ini aksi create.
    const workflow = formData.id ? 'meeting/wf-edit-draft' : 'meeting/wf-create';
    onSave(workflow, formData);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">{meeting ? 'Edit' : 'Create'} Meeting</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <input type="time" required value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Place</label>
            <input type="text" required value={formData.place} onChange={e => setFormData({...formData, place: e.target.value})} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Agenda</label>
            <input 
              type="text" 
              value={agendaInput}
              onChange={e => setAgendaInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && agendaInput.trim()) {
                  e.preventDefault();
                  setFormData({...formData, agenda: [...formData.agenda, agendaInput]});
                  setAgendaInput('');
                }
              }}
              className="w-full border p-2 rounded mb-2 focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="Type agenda and press Enter..."
            />
            <ul className="flex flex-wrap gap-2">
              {formData.agenda.map((a, i) => (
                <li key={i} className="flex items-center bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded">
                  {a} 
                  <button type="button" onClick={() => setFormData({...formData, agenda: formData.agenda.filter((_, idx) => idx !== i)})} className="ml-2 text-red-500 font-bold">&times;</button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Participants</label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_USERS.map(user => {
                // Cek apakah user ini sudah dipilih (ada di dalam array formData.participants)
                const isSelected = formData.participants.includes(user.userId);
                
                return (
                  <button
                    key={user.userId}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        // Jika sudah dipilih, klik lagi untuk menghapus (deselect)
                        setFormData({
                          ...formData, 
                          participants: formData.participants.filter(id => id !== user.userId)
                        });
                      } else {
                        // Jika belum dipilih, tambahkan ke array
                        setFormData({
                          ...formData, 
                          participants: [...formData.participants, user.userId]
                        });
                      }
                    }}
                    className={`px-3 py-1 rounded-full text-sm border transition-all ${
                      isSelected 
                        ? 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600' 
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                    }`}
                  >
                    {user.name}
                  </button>
                );
              })}
            </div>
            
            {/* Optional: Tampilkan daftar user ID yang sudah dipilih dalam teks */}
            {formData.participants.length > 0 && (
              <p className="mt-2 text-xs text-gray-500">
                Selected: {formData.participants.join(', ')}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-6 border-t mt-6">
            <button type="button" onClick={onCancel} className="px-4 py-2 border rounded hover:bg-gray-100">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 font-medium">Save Meeting</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MeetingForm;