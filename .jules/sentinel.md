## 2023-10-27 - [CRITICAL] Unprotected Admin Data Endpoint
**Vulnerability:** The `/api/admin/data` endpoint was configured with `optionalAuth`, allowing unauthenticated access to fetch sensitive system-wide data (users, assessments, and paths).
**Learning:** Even internal or admin-focused endpoints might be mistakenly exposed if default or relaxed middleware (`optionalAuth` instead of `requireAuth`) is used.
**Prevention:** Always use strict authentication (`requireAuth`) and implement role-based authorization (e.g., matching against an `ADMIN_EMAIL` environment variable) for endpoints returning aggregated or sensitive data.
