## 2023-10-27 - [CRITICAL] Unprotected Admin Data Endpoint
**Vulnerability:** The `/api/admin/data` endpoint was configured with `optionalAuth`, allowing unauthenticated access to fetch sensitive system-wide data (users, assessments, and paths).
**Learning:** Even internal or admin-focused endpoints might be mistakenly exposed if default or relaxed middleware (`optionalAuth` instead of `requireAuth`) is used.
**Prevention:** Always use strict authentication (`requireAuth`) and implement role-based authorization (e.g., matching against an `ADMIN_EMAIL` environment variable) for endpoints returning aggregated or sensitive data.

## 2024-03-01 - SSRF Vulnerability in /api/search-jobs

**Vulnerability:** The `/api/search-jobs` endpoint constructs an external request payload using the unvalidated `query` parameter directly from the request body. While this isn't a traditional SSRF where the attacker controls the URL, it allows injection of arbitrary text into the search query, potentially bypassing intended search restrictions or causing excessive data processing.

**Learning:** Always validate and sanitize user input before using it in external API requests, even if the URL itself is static.

**Prevention:** Ensure `query` is a string, trim whitespace, remove potentially dangerous characters if necessary, and enforce a reasonable length limit before passing it to external services.
