import { Meeting } from '../types/meeting.types';

interface MeetingListProps {
  meetings: Meeting[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRefresh: () => void;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: '#888' },
  waiting_approval: { label: 'Waiting Approval', color: '#f7d44a' },
  scheduled: { label: 'Scheduled', color: '#6c63ff' },
  note_waiting_approval: { label: 'Note Waiting', color: '#f7a84a' },
  edited_waiting_approval: { label: 'Edited Waiting', color: '#f7a84a' },
  done: { label: 'Done', color: '#6caf7a' },
  canceled: { label: 'Canceled', color: '#f76c6c' }
};

export default function MeetingList({ meetings, loading, selectedId, onSelect }: MeetingListProps) {
  // Sort by date descending
  const sorted = [...meetings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="meeting-list">
      <h3>📋 Meetings</h3>
      {loading && <div className="loading-text">Loading...</div>}
      {!loading && sorted.length === 0 && <div className="empty-text">No meetings yet</div>}
      {sorted.map((meeting) => {
        const status = statusLabels[meeting.status] || { label: meeting.status, color: '#888' };
        const isPast = new Date(meeting.date) < new Date();
        const dateStr = new Date(meeting.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        return (
          <div
            key={meeting.id}
            className={`meeting-item ${selectedId === meeting.id ? 'active' : ''}`}
            onClick={() => onSelect(meeting.id)}
          >
            <div className="meeting-item-header">
              <span className="meeting-title">{meeting.title}</span>
              <span className="meeting-status" style={{ backgroundColor: status.color }}>
                {status.label}
              </span>
            </div>
            <div className="meeting-item-meta">
              <span>{dateStr}</span>
              <span>{meeting.participants?.length || 0} participants</span>
              {isPast && <span className="past-badge">Past</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}