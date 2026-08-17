import type { Database } from '#/client.ts';

type QueryChain = Promise<unknown[]> & {
  from: () => QueryChain;
  innerJoin: () => QueryChain;
  where: () => QueryChain;
  limit: () => QueryChain;
  orderBy: () => QueryChain;
};

function chainable(rows: unknown[]): QueryChain {
  const query = Promise.resolve(rows) as QueryChain;
  query.from = () => query;
  query.innerJoin = () => query;
  query.where = () => query;
  query.limit = () => query;
  query.orderBy = () => query;
  return query;
}

export type Inserted = { table: string; values: unknown };
export type Updated = { table: string; set: unknown };

export function createFakeWriteDb(selectQueue: unknown[][]): {
  db: Database;
  inserted: Inserted[];
  updated: Updated[];
} {
  const inserted: Inserted[] = [];
  const updated: Updated[] = [];
  let index = 0;

  function select() {
    const rows = selectQueue[index];
    index += 1;
    if (!rows) {
      throw new Error(`unexpected extra select (call ${index})`);
    }
    return chainable(rows);
  }

  function insert() {
    return {
      values(values: unknown) {
        inserted.push({ table: 'unknown', values });
        return Promise.resolve();
      },
    };
  }

  function update() {
    return {
      set(setValues: unknown) {
        updated.push({ table: 'unknown', set: setValues });
        return { where: () => Promise.resolve() };
      },
    };
  }

  const base = { select, insert, update };

  const db = {
    ...base,
    async transaction(fn: (tx: typeof base) => Promise<unknown>) {
      return fn(base);
    },
  } as unknown as Database;

  return { db, inserted, updated };
}
