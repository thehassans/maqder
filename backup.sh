#!/bin/sh
# Daily MongoDB backup script for Docker deployment
# Usage: crontab: 0 3 * * * /var/www/vhosts/maqder.com/httpdocs/backup.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKUP_DIR="$SCRIPT_DIR/backups"
DB_NAME="maqder"
CONTAINER_NAME="maqder_mongo"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="mongo_backup_${DB_NAME}_${DATE}.gz"
RETENTION_DAYS=14

mkdir -p "$BACKUP_DIR"

echo "Starting MongoDB backup: $BACKUP_FILE"
docker exec "$CONTAINER_NAME" sh -c "mongodump --db $DB_NAME --archive --gzip" > "$BACKUP_DIR/$BACKUP_FILE"

echo "Backup saved: $BACKUP_DIR/$BACKUP_FILE"

# Optional: upload to S3-compatible storage
# if [ -f "$BACKUP_DIR/.s3cfg" ]; then
#   s3cmd put "$BACKUP_DIR/$BACKUP_FILE" s3://your-bucket-name/backups/
# fi

# Remove old backups
find "$BACKUP_DIR" -name "mongo_backup_${DB_NAME}_*.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup complete."
