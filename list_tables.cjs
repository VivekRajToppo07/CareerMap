const { Pool } = require('pg');
const u = new URL(process.env.DATABASE_URL);
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
const pool = new Pool({ connectionString: url });
pool.query("SELECT tablename FROM pg_tables WHERE schemaname='public';").then(res => {
  console.log(res.rows);
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
