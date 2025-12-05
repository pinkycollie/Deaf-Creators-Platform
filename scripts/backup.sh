#!/bin/bash
# Backup script for creators.pinksync.io database
set -e

echo "🗄️  Starting database backup..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL environment variable is not set"
  exit 1
fi

# Create backup directory
BACKUP_DIR="${BACKUP_DIR:-./backups}"
mkdir -p "$BACKUP_DIR"

# Generate timestamp
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db-backup-$TIMESTAMP.dump"

echo "📦 Creating database backup: $BACKUP_FILE"

# Backup database using pg_dump
if command -v pg_dump &> /dev/null; then
  pg_dump "$DATABASE_URL" \
    --format=custom \
    --no-owner \
    --no-acl \
    --compress=9 \
    --file="$BACKUP_FILE"
  
  echo "✅ Database backup created successfully"
  
  # Calculate file size
  FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo "📊 Backup size: $FILE_SIZE"
else
  echo "❌ pg_dump not found. Please install PostgreSQL client tools."
  exit 1
fi

# Upload to S3 if AWS CLI is available and configured
if command -v aws &> /dev/null && [ -n "$BACKUP_S3_BUCKET" ]; then
  echo "☁️  Uploading backup to S3: s3://$BACKUP_S3_BUCKET/"
  
  aws s3 cp "$BACKUP_FILE" "s3://$BACKUP_S3_BUCKET/db-backups/" \
    --storage-class STANDARD_IA
  
  echo "✅ Backup uploaded to S3"
fi

# Clean old backups (keep last 30 days)
echo "🧹 Cleaning old backups (keeping last 30 days)..."
find "$BACKUP_DIR" -name "db-backup-*.dump" -mtime +30 -delete
echo "✅ Old backups cleaned"

# List recent backups
echo ""
echo "📋 Recent backups:"
ls -lh "$BACKUP_DIR" | tail -n 5

echo ""
echo "🎉 Backup complete!"
echo "📁 Backup file: $BACKUP_FILE"
echo ""
echo "To restore:"
echo "  pg_restore -d \$DATABASE_URL --clean --if-exists $BACKUP_FILE"
echo ""
