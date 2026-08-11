import { IPlugin, successResult, errorResult , logger } from '@polaris-runtime/core';

const DB_KEY = 'polaris_meeting_db';

function getDB(): Record<string, any[]> {
  const data = localStorage.getItem(DB_KEY);
  return data ? JSON.parse(data) : {};
}

function saveDB(db: Record<string, any[]>): void {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function getCollection(db: Record<string, any[]>, domain: string): any[] {
  if (!db[domain]) db[domain] = [];
  return db[domain];
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

export const RepoPlugin: IPlugin = {
  name: 'repo',
  version: '1.0.0',
  description: 'Repository - localStorage for meeting app',

  capabilities: [
    {
      name: 'repo/cap-save',
      description: 'Save data to repository',
      run: (input) => {
        logger.verbose(`[Repo] Saving to domain: ${input.domain}`);
        const data = input.payload?.data || input.data;
        const domain = input.payload?.domain || input.domain;
        if (!data) return errorResult('No data to save', domain);

        try {
          const db = getDB();
          const collection = getCollection(db, domain);
          const record = { ...data };
          collection.push(record);
          saveDB(db);
          return successResult(record, domain, record.id, `Saved to ${domain}`);
        } catch (err) {
          const error = err instanceof Error ? err.message : String(err);
          return errorResult(error, domain);
        }
      }
    },
    {
      name: 'repo/cap-get',
      description: 'Get data from repository',
      run: (input) => {
        const domain = input.payload?.domain || input.domain;
        const id = input.payload?.id || input.id;
        if (!domain || !id) return errorResult('Domain and id required', domain);

        try {
          const db = getDB();
          const collection = getCollection(db, domain);
          const record = collection.find((r: any) => r.id === id);
          if (!record) return errorResult(`Record "${id}" not found`, domain, id);
          return successResult(record, domain, id, `Found in ${domain}`);
        } catch (err) {
          const error = err instanceof Error ? err.message : String(err);
          return errorResult(error, domain);
        }
      }
    },
    {
      name: 'repo/cap-list',
      description: 'List all data from repository',
      run: (input, context) => {
        const domain = input.payload?.domain || input.domain;
        if (!domain) return errorResult('Domain required');

        try {
          const db = getDB();
          const collection = getCollection(db, domain);
          return successResult(collection, domain, undefined, `${collection.length} records`);
        } catch (err) {
          const error = err instanceof Error ? err.message : String(err);
          return errorResult(error, domain);
        }
      }
    },
    {
      name: 'repo/cap-update',
      description: 'Update data in repository',
      run: (input) => {
        const domain = input.payload?.domain || input.domain;
        const id = input.payload?.id || input.id;
        const data = input.payload?.data || input.data;
        if (!domain || !id) return errorResult('Domain and id required', domain);

        try {
          const db = getDB();
          const collection = getCollection(db, domain);
          const index = collection.findIndex((r: any) => r.id === id);
          if (index === -1) return errorResult(`Record "${id}" not found`, domain, id);

          collection[index] = { ...collection[index], ...data };

          console.log('[repo/cap-update] before update, collection:', collection);
          console.log('[repo/cap-update] updating index:', index);


          saveDB(db);
          return successResult(collection[index], domain, id, `Updated in ${domain}`);
        } catch (err) {
          const error = err instanceof Error ? err.message : String(err);
          return errorResult(error, domain);
        }
      }
    },
    {
      name: 'repo/cap-delete',
      description: 'Delete data from repository',
      run: (input) => {
        const domain = input.payload?.domain || input.domain;
        const id = input.payload?.id || input.id;
        if (!domain || !id) return errorResult('Domain and id required', domain);

        try {
          const db = getDB();
          const collection = getCollection(db, domain);
          const filtered = collection.filter((r: any) => r.id !== id);
          if (filtered.length === collection.length) {
            return errorResult(`Record "${id}" not found`, domain, id);
          }
          db[domain] = filtered;
          saveDB(db);
          return successResult(undefined, domain, id, `Deleted from ${domain}`);
        } catch (err) {
          const error = err instanceof Error ? err.message : String(err);
          return errorResult(error, domain);
        }
      }
    }
  ],
  workflows: []
};