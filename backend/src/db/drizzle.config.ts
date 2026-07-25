import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load environment variables from .env file.
dotenv.config();

let dbCredentials: any = {};

if (process.env.DATABASE_URL) {
  console.log("Using DATABASE_URL for connection.");
  let url = process.env.DATABASE_URL;
  // Fix URL if it contains # in password
  if (url.includes('#') && url.includes('@')) {
    const atIndex = url.lastIndexOf('@');
    const prefix = url.substring(0, atIndex);
    const suffix = url.substring(atIndex);
    const firstColonAfterProto = prefix.indexOf(':', 13); // after postgresql://
    if (firstColonAfterProto > -1) {
       const user = prefix.substring(13, firstColonAfterProto);
       let pass = prefix.substring(firstColonAfterProto + 1);
       // replace # with %23
       pass = pass.replace(/#/g, '%23');
       url = `postgresql://${user}:${pass}${suffix}`;
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
