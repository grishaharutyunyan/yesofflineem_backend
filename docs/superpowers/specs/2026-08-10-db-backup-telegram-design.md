# DB Backup to Telegram — Design

## Purpose

Automate daily Postgres backups of the yesofflineem_backend database and deliver them via
Telegram, so a copy of the data exists off-server without manual intervention.

## Approach

A standalone bash script, run by cron once a day. No app runtime dependency — it shells out to
`pg_dump`, `gzip`, and `curl` directly, which keeps it simple to run, debug, and reason about on
the server independent of the NestJS app's lifecycle (deploys, restarts, etc. don't affect it).

## Script: `scripts/backup-db.sh`

1. Load `DATABASE_URL`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` from `yesofflineem_backend/.env`.
2. Run `pg_dump "$DATABASE_URL"`, writing to
   `backups/db_backup_YYYY-MM-DD_HHMMSS.sql`, then gzip it in place →
   `db_backup_YYYY-MM-DD_HHMMSS.sql.gz`.
   - Compression keeps typical dumps well under Telegram's 50MB bot upload limit.
3. On success: POST the `.sql.gz` file to the Telegram Bot API `sendDocument` endpoint, with a
   caption showing the date and file size.
4. On failure (`pg_dump` or `curl` non-zero exit): POST a text message to `sendMessage` reporting
   the failure (script step + exit code), and remove any partial dump file. Do not attempt to
   send a broken file.
5. Retention: after a successful run, delete files in `backups/` older than 7 days.
6. Every step is timestamped on stdout/stderr so cron's redirected output is a readable log.
7. Exit non-zero on any failure, so cron/mail-based monitoring can pick it up if configured later.

## Storage & config

- Dumps live in `yesofflineem_backend/backups/` (created if missing). Added to `.gitignore` —
  dumps must never be committed.
- New required env vars in `yesofflineem_backend/.env`: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.
  Documented in `.env` with placeholder comments if an `.env.example` pattern doesn't already
  exist.

## Cron

Not installed automatically — the script is handed to the user with a suggested crontab line to
add themselves, since editing the system crontab is a machine-level change outside the repo:

```
0 3 * * * /full/path/to/yesofflineem_backend/scripts/backup-db.sh >> /full/path/to/yesofflineem_backend/backups/backup.log 2>&1
```

Daily at 3am server time.

## Error handling

- Missing env vars → script exits immediately with a clear error before touching the database.
- `pg_dump` failure → Telegram failure notification, non-zero exit, no partial file left behind.
- `curl` failure (Telegram unreachable/bad token) → logged to stdout/stderr; dump file is kept
  locally either way so a failed notification doesn't lose the backup.

## Out of scope

- No retry/backoff logic for Telegram delivery — a failed send just logs and keeps the local file.
- No encryption of the dump file in transit beyond Telegram's own TLS.
- No multi-database support — single `DATABASE_URL` target only.