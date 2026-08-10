#!/usr/bin/env bash
#
# Dumps the Postgres database (DATABASE_URL) to a timestamped, gzipped file
# and sends it to Telegram. Deletes local dumps older than RETENTION_DAYS.
# Intended to run from cron. See docs/superpowers/specs/2026-08-10-db-backup-telegram-design.md
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$BACKEND_DIR/.env"
BACKUP_DIR="$BACKEND_DIR/backups"
RETENTION_DAYS=7

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

if [[ ! -f "$ENV_FILE" ]]; then
  log "ERROR: env file not found at $ENV_FILE"
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

for var in DATABASE_URL TELEGRAM_BOT_TOKEN TELEGRAM_CHAT_ID; do
  if [[ -z "${!var:-}" ]]; then
    log "ERROR: required env var $var is not set in $ENV_FILE"
    exit 1
  fi
done

TELEGRAM_API="https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}"

telegram_send_message() {
  local text="$1"
  curl -sS -f -X POST "$TELEGRAM_API/sendMessage" \
    -d chat_id="$TELEGRAM_CHAT_ID" \
    --data-urlencode text="$text" \
    > /dev/null
}

telegram_send_document() {
  local file="$1"
  local caption="$2"
  curl -sS -f -X POST "$TELEGRAM_API/sendDocument" \
    -F chat_id="$TELEGRAM_CHAT_ID" \
    -F document=@"$file" \
    -F caption="$caption" \
    > /dev/null
}

fail() {
  local message="$1"
  local discard_dump="${2:-yes}"
  log "ERROR: $message"
  telegram_send_message "❌ DB backup failed: $message" || log "WARNING: also failed to notify Telegram"
  if [[ "$discard_dump" == "yes" ]]; then
    [[ -n "${DUMP_FILE:-}" && -f "${DUMP_FILE:-}" ]] && rm -f "$DUMP_FILE"
    [[ -n "${GZ_FILE:-}" && -f "${GZ_FILE:-}" ]] && rm -f "$GZ_FILE"
  else
    log "Keeping local dump file so the backup isn't lost: ${GZ_FILE:-$DUMP_FILE}"
  fi
  exit 1
}

mkdir -p "$BACKUP_DIR" || fail "could not create backup directory $BACKUP_DIR"

TIMESTAMP="$(date '+%Y-%m-%d_%H%M%S')"
DUMP_FILE="$BACKUP_DIR/db_backup_${TIMESTAMP}.sql"
GZ_FILE="${DUMP_FILE}.gz"

log "Starting backup: $DUMP_FILE"

ERR_FILE="$(mktemp)"
pg_dump "$DATABASE_URL" > "$DUMP_FILE" 2>"$ERR_FILE"
PG_DUMP_EXIT=$?
if [[ $PG_DUMP_EXIT -ne 0 ]]; then
  ERR_MSG="$(cat "$ERR_FILE")"
  rm -f "$ERR_FILE"
  fail "pg_dump exited with code $PG_DUMP_EXIT: $ERR_MSG"
fi
rm -f "$ERR_FILE"

log "Dump written, compressing"
gzip -f "$DUMP_FILE" || fail "gzip failed on $DUMP_FILE"

FILE_SIZE="$(du -h "$GZ_FILE" | cut -f1)"
log "Backup compressed: $GZ_FILE ($FILE_SIZE)"

log "Sending to Telegram"
telegram_send_document "$GZ_FILE" "DB backup $TIMESTAMP ($FILE_SIZE)" || fail "failed to send document to Telegram" no

log "Sent to Telegram successfully"

log "Cleaning up dumps older than $RETENTION_DAYS days"
find "$BACKUP_DIR" -name 'db_backup_*.sql.gz' -type f -mtime "+$RETENTION_DAYS" -print -delete 2>/dev/null | while read -r old_file; do
  log "Deleted old backup: $old_file"
done

log "Backup complete"
