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
pool.query("SELECT tablename FROM pg_tables WHERE schemaname='public';").then(res => {
  console.log(res.rows);
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
