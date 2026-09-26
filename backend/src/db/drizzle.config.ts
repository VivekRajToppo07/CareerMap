import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load environment variables from .env file.
dotenv.config();

let dbCredentials: any = {};

if (process.env.DATABASE_URL) {
  console.log("Using DATABASE_URL for connection.");
  let url = process.env.DATABASE_URL;
  // Fix URL if it contains # in password
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
        // replace # with %23
        pass = pass.replace(/#/g, '%23');
        url = `${url.substring(0, protoEnd)}${user}:${pass}${url.substring(atIndex)}`;
      }
    }
  }
  dbCredentials = {
    url: url,
  };
} else {
  const sqlHost = process.env.SQL_HOST;
  const sqlDbName = process.env.SQL_DB_NAME;
  const user = process.env.SQL_ADMIN_USER;
  const password = process.env.SQL_ADMIN_PASSWORD;

  if (!sqlHost || !sqlDbName || !user || !password) {
    throw new Error("Missing SQL connection environment variables (DATABASE_URL or SQL_HOST).");
  }

  console.log(`Using AI Studio user: ${user} to connect to database.`);
  dbCredentials = {
    host: sqlHost,
    user: user,
    password: password,
    database: sqlDbName,
    ssl: false,
  };
}

export default defineConfig({
  schema: "./backend/src/db/schema.ts",
  out: "./backend/drizzle", // Output directory for migrations.
  dialect: "postgresql",
  schemaFilter: ["public"],
  tablesFilter: ["users", "assessments", "saved_paths", "path_progress"],
  dbCredentials,
  verbose: true, // Enable verbose output.
});
