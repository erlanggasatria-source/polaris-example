import { IPlugin, logger, successResult, errorResult } from '@polaris-runtime/core/dev';

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

// In-Memory Repository/Store for Notes
const noteStore: Map<string, NoteItem> = new Map();

export const NotePlugin: IPlugin = {
  name: 'note',
  version: '1.0.0',
  description: 'Basic note plugin for understanding Polaris Runtime fundamentals',

  capabilities: [
    {
      name: 'note/cap-validate',
      description: 'Validates note title and content input',
      run: async (input) => {
        const payload = input?.payload ? input.payload : input;
        logger.debug('Running CapValidateNote with payload:', payload);

        if (!payload?.title || payload.title.trim() === '') {
          logger.error('Validation failed: Note title is empty');
          throw new Error('Note title is required');
        }

        if (!payload?.content || payload.content.trim() === '') {
          logger.error('Validation failed: Note content is empty');
          throw new Error('Note content is required');
        }

        logger.verbose('CapValidateNote passed successfully');
        return successResult(payload, 'note', payload.id, 'Note validation successful');
      }
    },

    {
      name: 'note/cap-validate-id',
      description: 'Ensures note ID exists in the store',
      run: async (input) => {
        const payload = input?.payload ? input.payload : input;
        logger.debug('Running CapValidateId for ID:', payload?.id);

        if (!payload?.id || !noteStore.has(payload.id)) {
          logger.error(`Note with ID "${payload?.id}" not found`);
          throw new Error('Note not found');
        }

        return successResult(payload, 'note', payload.id, 'Valid Note ID');
      }
    },

    {
      name: 'note/cap-save',
      description: 'Generates ID and saves new note to the store',
      run: async (input) => {
        const payload = input?.payload ? input.payload : input;
        logger.verbose('Executing CapSaveNote...');

        const newNote: NoteItem = {
          id: 'note_' + Math.random().toString(36).substring(2, 9),
          title: payload.title.trim(),
          content: payload.content.trim(),
          updatedAt: new Date().toISOString()
        };

        noteStore.set(newNote.id, newNote);
        logger.info(`✅ Note created successfully: [${newNote.id}] ${newNote.title}`);

        return successResult(newNote, 'note', newNote.id, 'Note saved successfully');
      }
    },

    {
      name: 'note/cap-list',
      description: 'Retrieves all notes sorted by latest update',
      run: async () => {
        logger.verbose('Fetching all notes from store...');
        const list = Array.from(noteStore.values()).sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );

        logger.debug(`Found ${list.length} notes`);
        return successResult(list, 'note', undefined, 'Notes retrieved successfully');
      }
    },

    {
      name: 'note/cap-update',
      description: 'Updates title and content of an existing note',
      run: async (input) => {
        const payload = input?.payload ? input.payload : input;
        logger.verbose(`Updating note [${payload?.id}]...`);

        const existing = noteStore.get(payload.id);
        if (!existing) {
          logger.error(`Note [${payload?.id}] failed to update: Not found`);
          return errorResult('Failed to update: Note not found', 'note', payload?.id);
        }

        const updatedNote: NoteItem = {
          ...existing,
          title: payload.title.trim(),
          content: payload.content.trim(),
          updatedAt: new Date().toISOString()
        };

        noteStore.set(payload.id, updatedNote);
        logger.info(`✅ Note updated successfully: [${payload.id}]`);

        return successResult(updatedNote, 'note', updatedNote.id, 'Note updated successfully');
      }
    },

    {
      name: 'note/cap-delete',
      description: 'Removes note from store by ID',
      run: async (input) => {
        const payload = input?.payload ? input.payload : input;
        logger.verbose(`Deleting note [${payload?.id}]...`);

        const deleted = noteStore.delete(payload.id);
        if (!deleted) {
          logger.error(`Failed to delete: Note [${payload?.id}] not found`);
          return errorResult('Failed to delete note', 'note', payload?.id);
        }

        logger.info(`🗑️ Note deleted successfully: [${payload.id}]`);
        return successResult({ id: payload.id }, 'note', payload.id, 'Note deleted successfully');
      }
    }
  ],

  workflows: [
    {
      name: 'note/wf-create',
      description: 'Creates a new note',
      steps: [
        { name: 'note-validation', useCapability: 'note/cap-validate' },
        { name: 'save-note', useCapability: 'note/cap-save' }
      ]
    },
    {
      name: 'note/wf-list',
      description: 'Retrieves note list',
      steps: [
        { name: 'fetch-list', useCapability: 'note/cap-list' }
      ]
    },
    {
      name: 'note/wf-update',
      description: 'Updates an existing note',
      steps: [
        { name: 'id-validation', useCapability: 'note/cap-validate-id' },
        { name: 'content-validation', useCapability: 'note/cap-validate' },
        { name: 'update-note', useCapability: 'note/cap-update' }
      ]
    },
    {
      name: 'note/wf-delete',
      description: 'Deletes a note',
      steps: [
        { name: 'id-validation', useCapability: 'note/cap-validate-id' },
        { name: 'delete-note', useCapability: 'note/cap-delete' }
      ]
    }
  ]
};