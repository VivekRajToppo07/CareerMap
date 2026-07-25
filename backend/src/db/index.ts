import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.ts';

const { Pool } = pg;

export const createPool = () => {
  if (process.env.DATABASE_URL) {
    let url = process.env.DATABASE_URL;
    if (url.includes('#') && url.includes('@')) {
      const atIndex = url.lastIndexOf('@');
      const prefix = url.substring(0, atIndex);
      const suffix = url.substring(atIndex);
      const firstColonAfterProto = prefix.indexOf(':', 13);
      if (firstColonAfterProto > -1) {
         const user = prefix.substring(13, firstColonAfterProto);
         let pass = prefix.substring(firstColonAfterProto + 1);
         pass = pass.replace(/#/g, '%23');
         url = `postgresql://${user}:${pass}${suffix}`;
      }
    }
    return new Pool({
      connectionString: url,
      connectionTimeoutMillis: 15000,
    });
  }

  return new Pool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
    connectionTimeoutMillis: 15000,
  });
};

const pool = createPool();

pool.on('error', (err) => {
  console.error('Unexpected error on idle SQL pool client:', err);
});

export const db = drizzle(pool, { schema });
