import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.ts';

const { Pool } = pg;

export const createPool = () => {
  if (process.env.DATABASE_URL) {
    let url = process.env.DATABASE_URL;
    const protoMatch = url.match(/^([a-z0-9+.-]+):\/\//i);
    if (protoMatch && url.includes('#') && url.includes('@')) {
      const protoEnd = protoMatch[0].length;
      const atIndex = url.lastIndexOf('@');
      if (atIndex > protoEnd) {
        const credentials = url.substring(protoEnd, atIndex);
        const colonIndex = credentials.indexOf(':');
        if (colonIndex > -1) {
          const user = credentials.substring(0, colonIndex);
          let pass = credentials.substring(colonIndex + 1);
          pass = pass.replace(/#/g, '%23');
          url = `${url.substring(0, protoEnd)}${user}:${pass}${url.substring(atIndex)}`;
        }
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
