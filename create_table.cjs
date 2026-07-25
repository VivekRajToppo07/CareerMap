const { Pool } = require('pg');
const u = new URL(process.env.DATABASE_URL);
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
const pool = new Pool({ connectionString: url });
pool.query(`
CREATE TABLE IF NOT EXISTS path_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  path_title TEXT NOT NULL,
  roadmap JSONB,
  completed_steps JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`).then(() => {
  console.log("Table created");
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
