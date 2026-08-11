// src/plugins/meeting.plugin.ts
import { IPlugin, successResult, errorResult, logger } from '@polaris-runtime/core';
import { MeetingModel } from '../domain/meeting.model';
import { MeetingStatus } from '../types/meeting.types';

// ============================================
// CAPABILITIES (menggunakan class MeetingModel)
// ============================================

export const MeetingPlugin: IPlugin = {
  name: 'meeting',
  version: '1.0.0',
  description: 'Meeting management with domain model',

  capabilities: [
    // 1. PREPARE REPO (UNIVERSAL)
    {
      name: 'meeting/cap-prepare-repo',
      description: 'Prepare domain and data for repo operations',
      run: (input) => {
        const data = input.payload?.data || input.data || input;
        const id = input.payload?.id || input.id;

        if (!data && !id) return successResult({ domain: 'meetings' }, 'meetings');
        if (id && !data) return successResult({ domain: 'meetings', id }, 'meetings', id);
        if (data) return successResult({ domain: 'meetings', data }, 'meetings', data.id || id);
        return errorResult('Unable to prepare repo input', 'meetings');
      }
    },

    // 2. GET VALIDATION
    {
      name: 'meeting/cap-get-validation',
      description: 'Validate get meeting input',
      run: (input) => {
        if (!input.id) {
          logger.error('Meeting ID required');
          throw new Error('Meeting ID required');
        }
        return successResult({ domain: 'meetings', id: input.id }, 'meetings', input.id);
      }
    },

    // 3. CREATE
    {
      name: 'meeting/cap-create',
      description: 'Create new meeting from input',
      run: (input, context) => {
        const userId = context.context.get('userId') || 'unknown';
        const model = MeetingModel.createFromInput(input, userId);
        return successResult(model.toPayload(), 'meetings', model.id, 'Meeting created');
      }
    },

    // 4. SUBMIT APPROVAL
    {
      name: 'meeting/cap-validate-submit',
      description: 'Submit approval – auto detect note',
      run: (input, context) => {
        const meetingData = input.payload;
        const userId = context.context.get('userId') || 'unknown';
        const model = new MeetingModel(meetingData);

        if (!model.validateStatus(['draft'])) {
          logger.error(`Status is "${model.status}", not draft.`);
          throw new Error(`Status is "${model.status}", not draft.`);
        }
        if (!model.validateCreator(userId)) {
          logger.error('Only creator can submit approval');
          throw new Error('Only creator can submit approval');
        }

        const hasActiveNote = model.notes.some(n => n.status === 'active');
        const newStatus: MeetingStatus = hasActiveNote ? 'waiting_note_approval' : 'waiting_approval';

        model.addLog('sent_approval', { user: userId });
        model.transitionTo(newStatus);

        return successResult(model.toPayload(), 'meetings', model.id, 'Submit approval validated');
      }
    },

    // 5. APPROVE (Jadwal)
    {
      name: 'meeting/cap-validate-approve',
      description: 'Approve schedule',
      run: (input, context) => {
        const meetingData = input.payload;
        const userId = context.context.get('userId') || 'unknown';
        const role = context.context.get('role') || 'member';
        const model = new MeetingModel(meetingData);

        if (!model.validateStatus(['waiting_approval'])) {
          logger.error(`Status is "${model.status}", not waiting_approval.`);
          throw new Error(`Status is "${model.status}", not waiting_approval.`);
        }
        if (!model.validateRole(role, ['leader', 'secretary'])) {
          logger.error('Only leader/secretary can approve');
          throw new Error('Only leader/secretary can approve');
        }

        model.addLog('approve', { user: userId });
        model.transitionTo('scheduled');

        return successResult(model.toPayload(), 'meetings', model.id, 'Schedule approved');
      }
    },

    // 6. REJECT APPROVAL
    {
      name: 'meeting/cap-validate-reject-approval',
      description: 'Reject schedule',
      run: (input, context) => {
        const meetingData = input.payload;
        const userId = context.context.get('userId') || 'unknown';
        const role = context.context.get('role') || 'member';
        const reason = context.input.reason || 'No reason provided';
        const model = new MeetingModel(meetingData);

        if (!model.validateStatus(['waiting_approval'])) {
          logger.error(`Status is "${model.status}", not waiting_approval.`);
          throw new Error(`Status is "${model.status}", not waiting_approval.`);
        }
        if (!model.validateRole(role, ['leader', 'secretary'])) {
          logger.error('Only leader/secretary can reject');
          throw new Error('Only leader/secretary can reject');
        }

        model.addLog('reject_approval', { user: userId, reason });
        model.transitionTo('draft');

        return successResult(model.toPayload(), 'meetings', model.id, 'Schedule rejected');
      }
    },

    // 7. ADD NOTE
    {
      name: 'meeting/cap-validate-add-note',
      description: 'Add note',
      run: (input, context) => {
        const meetingData = input.payload;
        const userId = context.context.get('userId') || 'unknown';
        const role = context.context.get('role') || 'member';
        const noteContent = context.input.note;
        const model = new MeetingModel(meetingData);

        if (!model.validateStatus(['scheduled'])) {
          logger.error(`Status is "${model.status}", not scheduled.`);
          throw new Error(`Status is "${model.status}", not scheduled.`);
        }
        if (!model.validateCreator(userId) && !model.validateRole(role, ['secretary', 'leader'])) {
          logger.error('Only creator/secretary/leader can add note');
          throw new Error('Only creator/secretary/leader can add note');
        }

        model.addNote(noteContent, userId);
        model.transitionTo('waiting_note_approval');

        return successResult(model.toPayload(), 'meetings', model.id, 'Note added');
      }
    },

    // 8. REVISE NOTE
    {
      name: 'meeting/cap-validate-revise-note',
      description: 'Revise note',
      run: (input, context) => {
        const meetingData = input.payload;
        const userId = context.context.get('userId') || 'unknown';
        const role = context.context.get('role') || 'member';
        const newNoteContent = context.input.note;
        const model = new MeetingModel(meetingData);

        if (!model.validateStatus(['waiting_note_approval','done'])) {
          logger.error(`Status is "${model.status}", not waiting_note_approval.`);
          throw new Error(`Status is "${model.status}", not waiting_note_approval.`);
        }
        if (!model.validateCreator(userId) && !model.validateRole(role, ['secretary', 'leader'])) {
          logger.error('Only creator/secretary/leader can revise note');
          throw new Error('Only creator/secretary/leader can revise note');
        }

        model.reviseNote(newNoteContent, userId);
        model.transitionTo('waiting_note_approval');
        // status tetap waiting_note_approval

        return successResult(model.toPayload(), 'meetings', model.id, 'Note revised');
      }
    },

    // 9. APPROVE NOTE
    {
      name: 'meeting/cap-validate-approve-note',
      description: 'Approve note',
      run: (input, context) => {
        const meetingData = input.payload;
        const userId = context.context.get('userId') || 'unknown';
        const role = context.context.get('role') || 'member';
        const model = new MeetingModel(meetingData);

        if (!model.validateStatus(['waiting_note_approval'])) {
          logger.error(`Status is "${model.status}", not waiting_note_approval.`);
          throw new Error(`Status is "${model.status}", not waiting_note_approval.`);
        }
        if (!model.validateRole(role, ['leader'])) {
          logger.error('Only leader can approve note');
          throw new Error('Only leader can approve note');
        }

        model.approveNote(userId);

        return successResult(model.toPayload(), 'meetings', model.id, 'Note approved');
      }
    },

    // 10. REJECT NOTE
    {
      name: 'meeting/cap-validate-reject-note',
      description: 'Reject note',
      run: (input, context) => {
        const meetingData = input.payload;
        const userId = context.context.get('userId') || 'unknown';
        const role = context.context.get('role') || 'member';
        const reason = context.input.reason || 'No reason provided';
        const model = new MeetingModel(meetingData);

        if (!model.validateStatus(['waiting_note_approval'])) {
          logger.error(`Status is "${model.status}", not waiting_note_approval.`);
          throw new Error(`Status is "${model.status}", not waiting_note_approval.`);
        }
        if (!model.validateRole(role, ['leader'])) {
          logger.error('Only leader can reject note');
          throw new Error('Only leader can reject note');
        }

        model.rejectNote(userId, reason);

        return successResult(model.toPayload(), 'meetings', model.id, 'Note rejected');
      }
    },

    // 11. EDIT DRAFT
    {
      name: 'meeting/cap-validate-edit-draft',
      description: 'Edit draft',
      run: (input, context) => {
        const meetingData = input.payload;
        const userId = context.context.get('userId') || 'unknown';
        const updates = context.input.data || {};
        const model = new MeetingModel(meetingData);

        if (!model.validateStatus(['draft'])) {
          logger.error(`Status is "${model.status}", not draft.`);
          throw new Error(`Status is "${model.status}", not draft.`);
        }
        if (!model.validateCreator(userId)) {
          logger.error('Only creator can edit draft');
          throw new Error('Only creator can edit draft');
        }

        // Parse agenda jika ada
        if (updates.agenda && typeof updates.agenda === 'string') {
          updates.agenda = updates.agenda.split('\n').filter(Boolean);
        }

        // Jika ada note, update note (tambahkan atau ganti)
        if (updates.note) {
          const activeNote = model.notes.find(n => n.status === 'active');
          if (activeNote) {            
            activeNote.content = updates.note;            
          } else {
            // Jika belum ada note, tambahkan
            model.addNote(updates.note, userId);
            // status tetap draft
          }
        }

        model.updateFields(updates);

        return successResult(model.toPayload(), 'meetings', model.id, 'Draft updated');
      }
    },

    // 12. DELETE DRAFT
    {
      name: 'meeting/cap-validate-delete-draft',
      description: 'Delete draft',
      run: (input, context) => {
        const meetingData = input.payload;
        const userId = context.context.get('userId') || 'unknown';
        const model = new MeetingModel(meetingData);

        if (!model.validateStatus(['draft'])) {
          logger.error(`Status is "${model.status}", not draft.`);
          throw new Error(`Status is "${model.status}", not draft.`);
        }
        if (!model.validateCreator(userId)) {
          logger.error('Only creator can delete draft');
          throw new Error('Only creator can delete draft');
        }

        // Return domain dan id untuk repo/cap-delete
        return successResult({ domain: 'meetings', id: model.id }, 'meetings', model.id, 'Draft delete prepared');
      }
    },

    // 13. CANCEL
    {
      name: 'meeting/cap-validate-cancel',
      description: 'Cancel meeting',
      run: (input, context) => {
        const meetingData = input.payload;
        const userId = context.context.get('userId') || 'unknown';
        const role = context.context.get('role') || 'member';
        const reason = context.input.reason || 'No reason provided';
        const model = new MeetingModel(meetingData);

        const allowedStatuses: MeetingStatus[] = ['waiting_approval', 'scheduled', 'waiting_note_approval'];
        if (!model.validateStatus(allowedStatuses)) {
          logger.error(`Status "${model.status}" cannot be canceled.`);
          throw new Error(`Status "${model.status}" cannot be canceled.`);
        }
        if (!model.validateRole(role, ['leader', 'secretary'])) {
          logger.error('Only leader/secretary can cancel');
          throw new Error('Only leader/secretary can cancel');
        }

        model.addLog('cancel', { user: userId, reason });
        model.transitionTo('canceled');

        return successResult(model.toPayload(), 'meetings', model.id, 'Meeting canceled');
      }
    }
  ],

  // ============================================
  // WORKFLOWS (sama seperti sebelumnya, tapi menggunakan cap yang sudah direfactor)
  // ============================================
  workflows: [
    // LIST
    {
      name: 'meeting/wf-list',
      description: 'List all meetings',
      allowed: [{ key: 'role', value: ['member', 'secretary', 'leader'], source: 'context', operator: 'in' }],
      steps: [
        { name: 'prepare-repo', useCapability: 'meeting/cap-prepare-repo' },
        { name: 'fetch-repo', useCapability: 'repo/cap-list' }
      ]
    },

    // CREATE
    {
      name: 'meeting/wf-create',
      description: 'Create new meeting',
      allowed: [{ key: 'role', value: ['member', 'secretary', 'leader'], source: 'context', operator: 'in' }],
      steps: [
        { name: 'create', useCapability: 'meeting/cap-create' },
        { name: 'prepare-repo', useCapability: 'meeting/cap-prepare-repo' },
        { name: 'save-repo', useCapability: 'repo/cap-save' }
      ]
    },

    // GET
    {
      name: 'meeting/wf-get',
      description: 'Get meeting by ID',
      allowed: [{ key: 'role', value: ['member', 'secretary', 'leader'], source: 'context', operator: 'in' }],
      steps: [
        { name: 'validate-get', useCapability: 'meeting/cap-get-validation' },
        { name: 'get-repo', useCapability: 'repo/cap-get', dependsOn: ['validate-get'] },
        { name: 'prepare-repo', useCapability: 'meeting/cap-prepare-repo', dependsOn: ['get-repo'] }
      ]
    },

    // SUBMIT APPROVAL
    {
      name: 'meeting/wf-submit-approval',
      description: 'Submit meeting for approval',
      allowed: [
        { key: 'role', value: ['member', 'secretary', 'leader'], source: 'context', operator: 'in' },
        { key: 'status', value: 'draft', source: 'input', operator: 'eq' }
      ],
      steps: [
        { name: 'validate-get', useCapability: 'meeting/cap-get-validation' },
        { name: 'get-meeting', useCapability: 'repo/cap-get', dependsOn: ['validate-get'] },
        { name: 'validate-submit', useCapability: 'meeting/cap-validate-submit', dependsOn: ['get-meeting'] },
        { name: 'prepare-repo', useCapability: 'meeting/cap-prepare-repo', dependsOn: ['validate-submit'] },
        { name: 'update-repo', useCapability: 'repo/cap-update', dependsOn: ['prepare-repo'] }
      ]
    },

    // APPROVE
    {
      name: 'meeting/wf-approve',
      description: 'Approve schedule',
      allowed: [
        { key: 'role', value: ['leader', 'secretary'], source: 'context', operator: 'in' },
        { key: 'status', value: 'waiting_approval', source: 'input', operator: 'eq' }
      ],
      steps: [
        { name: 'validate-get', useCapability: 'meeting/cap-get-validation' },
        { name: 'get-meeting', useCapability: 'repo/cap-get', dependsOn: ['validate-get'] },
        { name: 'validate-approve', useCapability: 'meeting/cap-validate-approve', dependsOn: ['get-meeting'] },
        { name: 'prepare-repo', useCapability: 'meeting/cap-prepare-repo', dependsOn: ['validate-approve'] },
        { name: 'update-repo', useCapability: 'repo/cap-update', dependsOn: ['prepare-repo'] }
      ]
    },

    // REJECT APPROVAL
    {
      name: 'meeting/wf-reject-approval',
      description: 'Reject schedule',
      allowed: [
        { key: 'role', value: ['leader', 'secretary'], source: 'context', operator: 'in' },
        { key: 'status', value: 'waiting_approval', source: 'input', operator: 'eq' }
      ],
      steps: [
        { name: 'validate-get', useCapability: 'meeting/cap-get-validation' },
        { name: 'get-meeting', useCapability: 'repo/cap-get', dependsOn: ['validate-get'] },
        { name: 'validate-reject-approval', useCapability: 'meeting/cap-validate-reject-approval', dependsOn: ['get-meeting'] },
        { name: 'prepare-repo', useCapability: 'meeting/cap-prepare-repo', dependsOn: ['validate-reject-approval'] },
        { name: 'update-repo', useCapability: 'repo/cap-update', dependsOn: ['prepare-repo'] }
      ]
    },

    // ADD NOTE
    {
      name: 'meeting/wf-add-note',
      description: 'Add note',
      allowed: [
        { key: 'role', value: ['member', 'secretary', 'leader'], source: 'context', operator: 'in' },
        { key: 'status', value: 'scheduled', source: 'input', operator: 'eq' }
      ],
      steps: [
        { name: 'validate-get', useCapability: 'meeting/cap-get-validation' },
        { name: 'get-meeting', useCapability: 'repo/cap-get', dependsOn: ['validate-get'] },
        { name: 'validate-add-note', useCapability: 'meeting/cap-validate-add-note', dependsOn: ['get-meeting'] },
        { name: 'prepare-repo', useCapability: 'meeting/cap-prepare-repo', dependsOn: ['validate-add-note'] },
        { name: 'update-repo', useCapability: 'repo/cap-update', dependsOn: ['prepare-repo'] }
      ]
    },

    // REVISE NOTE
    {
      name: 'meeting/wf-revise-note',
      description: 'Revise note',
      allowed: [
        { key: 'role', value: ['member', 'secretary', 'leader'], source: 'context', operator: 'in' },
        { key: 'status', value: ['waiting_note_approval', 'done'], source: 'input', operator: 'in' }
      ],
      steps: [
        { name: 'validate-get', useCapability: 'meeting/cap-get-validation' },
        { name: 'get-meeting', useCapability: 'repo/cap-get', dependsOn: ['validate-get'] },
        { name: 'validate-revise-note', useCapability: 'meeting/cap-validate-revise-note', dependsOn: ['get-meeting'] },
        { name: 'prepare-repo', useCapability: 'meeting/cap-prepare-repo', dependsOn: ['validate-revise-note'] },
        { name: 'update-repo', useCapability: 'repo/cap-update', dependsOn: ['prepare-repo'] }
      ]
    },

    // APPROVE NOTE
    {
      name: 'meeting/wf-approve-note',
      description: 'Approve note',
      allowed: [
        { key: 'role', value: ['leader'], source: 'context', operator: 'in' },
        { key: 'status', value: 'waiting_note_approval', source: 'input', operator: 'eq' }
      ],
      steps: [
        { name: 'validate-get', useCapability: 'meeting/cap-get-validation' },
        { name: 'get-meeting', useCapability: 'repo/cap-get', dependsOn: ['validate-get'] },
        { name: 'validate-approve-note', useCapability: 'meeting/cap-validate-approve-note', dependsOn: ['get-meeting'] },
        { name: 'prepare-repo', useCapability: 'meeting/cap-prepare-repo', dependsOn: ['validate-approve-note'] },
        { name: 'update-repo', useCapability: 'repo/cap-update', dependsOn: ['prepare-repo'] }
      ]
    },

    // REJECT NOTE
    {
      name: 'meeting/wf-reject-note',
      description: 'Reject note',
      allowed: [
        { key: 'role', value: ['leader'], source: 'context', operator: 'in' },
        { key: 'status', value: 'waiting_note_approval', source: 'input', operator: 'eq' }
      ],
      steps: [
        { name: 'validate-get', useCapability: 'meeting/cap-get-validation' },
        { name: 'get-meeting', useCapability: 'repo/cap-get', dependsOn: ['validate-get'] },
        { name: 'validate-reject-note', useCapability: 'meeting/cap-validate-reject-note', dependsOn: ['get-meeting'] },
        { name: 'prepare-repo', useCapability: 'meeting/cap-prepare-repo', dependsOn: ['validate-reject-note'] },
        { name: 'update-repo', useCapability: 'repo/cap-update', dependsOn: ['prepare-repo'] }
      ]
    },

    // EDIT DRAFT
    {
      name: 'meeting/wf-edit-draft',
      description: 'Edit draft',
      allowed: [
        { key: 'role', value: ['member', 'secretary', 'leader'], source: 'context', operator: 'in' },
        { key: 'status', value: 'draft', source: 'input', operator: 'eq' }
      ],
      steps: [
        { name: 'validate-get', useCapability: 'meeting/cap-get-validation' },
        { name: 'get-meeting', useCapability: 'repo/cap-get', dependsOn: ['validate-get'] },
        { name: 'validate-edit-draft', useCapability: 'meeting/cap-validate-edit-draft', dependsOn: ['get-meeting'] },
        { name: 'prepare-repo', useCapability: 'meeting/cap-prepare-repo', dependsOn: ['validate-edit-draft'] },
        { name: 'update-repo', useCapability: 'repo/cap-update', dependsOn: ['prepare-repo'] }
      ]
    },

    // DELETE DRAFT
    {
      name: 'meeting/wf-delete-draft',
      description: 'Delete draft',
      allowed: [
        { key: 'role', value: ['member', 'secretary', 'leader'], source: 'context', operator: 'in' },
        { key: 'status', value: 'draft', source: 'input', operator: 'eq' }
      ],
      steps: [
        { name: 'validate-get', useCapability: 'meeting/cap-get-validation' },
        { name: 'get-meeting', useCapability: 'repo/cap-get', dependsOn: ['validate-get'] },
        { name: 'validate-delete-draft', useCapability: 'meeting/cap-validate-delete-draft', dependsOn: ['get-meeting'] },
        { name: 'prepare-repo', useCapability: 'meeting/cap-prepare-repo', dependsOn: ['validate-delete-draft'] },
        { name: 'delete-repo', useCapability: 'repo/cap-delete', dependsOn: ['prepare-repo'] }
      ]
    },

    // CANCEL
    {
      name: 'meeting/wf-cancel',
      description: 'Cancel meeting',
      allowed: [
        { key: 'role', value: ['leader', 'secretary'], source: 'context', operator: 'in' },
        { key: 'status', value: ['waiting_approval', 'scheduled', 'waiting_note_approval'], source: 'input', operator: 'in' }
      ],
      steps: [
        { name: 'validate-get', useCapability: 'meeting/cap-get-validation' },
        { name: 'get-meeting', useCapability: 'repo/cap-get', dependsOn: ['validate-get'] },
        { name: 'validate-cancel', useCapability: 'meeting/cap-validate-cancel', dependsOn: ['get-meeting'] },
        { name: 'prepare-repo', useCapability: 'meeting/cap-prepare-repo', dependsOn: ['validate-cancel'] },
        { name: 'update-repo', useCapability: 'repo/cap-update', dependsOn: ['prepare-repo'] }
      ]
    }
  ]
};