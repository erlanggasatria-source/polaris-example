import { type IPlugin, successResult, errorResult, logger } from '@polaris-runtime/core';

const DB_KEY = 'polaris_meeting_db';

type RepoRecord = Record<string, unknown> & { id?: string | number };
type RepoDB = Record<string, RepoRecord[]>;

function getDB(): RepoDB {
  const data = localStorage.getItem(DB_KEY);
  return data ? (JSON.parse(data) as RepoDB) : {};
}

function saveDB(db: RepoDB): void {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function getCollection(db: RepoDB, domain: string): RepoRecord[] {
  if (!db[domain]) db[domain] = [];
  return db[domain];
}

export const RepoPlugin: IPlugin = {
  name: 'repo',
  version: '1.0.0',
  description: 'Repository - localStorage for meeting app',
  capabilities: [
    {
      name: 'repo/cap-save',
      description: 'Save data to repository',
      inputSchema: {'input': `{ domain, data } // domain exp. meeting just like table name, data include id, exp. { id: 1, name: 'test' }`},
      outputSchema: { 'output': `{ status, domain, id, payload, message, error }` },              
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
      inputSchema: {'input': `{ domain, id } // domain exp. meeting just like table name, id is the unique identifier of the record`},
      outputSchema: { 'output': `{ status, domain, id, payload, message, error }` },              
      run: (input) => {
        const domain = input.payload?.domain || input.domain;
        const id = input.payload?.id || input.id;
        if (!domain || !id) return errorResult('Domain and id required', domain);

        try {
          const db = getDB();
          const collection = getCollection(db, domain);
          const record = collection.find((r: RepoRecord) => r.id === id);
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
      inputSchema: {'input': `{ domain } // domain exp. meeting just like table name`},
      outputSchema: { 'output': `{ status, domain, id, payload, message, error }` },
      run: (input) => {
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
      inputSchema: {'input': `{ domain, id, data } // domain exp. meeting just like table name, id is the unique identifier of the record, data contains the fields to update`},
      outputSchema: { 'output': `{ status, domain, id, payload, message, error }` },
      run: (input) => {
        const domain = input.payload?.domain || input.domain;
        const id = input.payload?.id || input.id;
        const data = input.payload?.data || input.data;
        if (!domain || !id) return errorResult('Domain and id required', domain);

        try {
          const db = getDB();
          const collection = getCollection(db, domain);
          const index = collection.findIndex((r: RepoRecord) => r.id === id);
          if (index === -1) return errorResult(`Record "${id}" not found`, domain, id);

          collection[index] = { ...collection[index], ...data };

          logger.verbose('[repo/cap-update] before update, collection:', collection);
          logger.verbose('[repo/cap-update] updating index:', index);


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
      inputSchema: {'input': `{ domain, id } // domain exp. meeting just like table name, id is the unique identifier of the record`},
      outputSchema: { 'output': `{ status, domain, id, payload, message, error }` },
      run: (input) => {
        const domain = input.payload?.domain || input.domain;
        const id = input.payload?.id || input.id;
        if (!domain || !id) return errorResult('Domain and id required', domain);

        try {
          const db = getDB();
          const collection = getCollection(db, domain);
          const filtered = collection.filter((r: RepoRecord) => r.id !== id);
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