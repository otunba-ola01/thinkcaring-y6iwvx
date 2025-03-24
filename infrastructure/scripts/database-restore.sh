#!/bin/bash

# database-restore.sh
#
# This script restores the PostgreSQL database for the HCBS Revenue Management System
# from backups stored in S3. It can be used for disaster recovery, testing, and 
# database maintenance procedures.
#
# Dependencies:
# - aws-cli (latest) - For S3 operations
# - postgresql-client (15.x) - For database restoration
# - gzip (latest) - For decompression

# Set error handling
set -e

# Global variables
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
PROJECT_ROOT=$(dirname "$(dirname "$SCRIPT_DIR")")
RESTORE_DIR="/tmp/database-restores"
S3_BUCKET="${S3_BACKUP_BUCKET:-hcbs-database-backups}"
S3_PREFIX="database-backup"
LOG_FILE="/var/log/hcbs/database-restore.log"

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Function to log messages
log_message() {
    local message="$1"
    local level="${2:-INFO}"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    local formatted_message="[$timestamp] [$level] $message"
    
    # Display to stdout
    echo "$formatted_message"
    
    # Append to log file
    echo "$formatted_message" >> "$LOG_FILE"
}

# Function to load environment variables from .env file
load_env() {
    if [[ -f "$PROJECT_ROOT/.env" ]]; then
        log_message "Loading environment variables from $PROJECT_ROOT/.env"
        source "$PROJECT_ROOT/.env"
    else
        log_message "No .env file found at $PROJECT_ROOT/.env" "WARN"
    fi
}

# Function to check if required dependencies are installed
check_dependencies() {
    local missing_deps=0
    
    if ! command -v pg_restore &> /dev/null; then
        log_message "pg_restore command not found. Please install postgresql-client." "ERROR"
        missing_deps=1
    fi
    
    if ! command -v aws &> /dev/null; then
        log_message "aws command not found. Please install aws-cli." "ERROR"
        missing_deps=1
    fi
    
    if ! command -v gzip &> /dev/null; then
        log_message "gzip command not found. Please install gzip." "ERROR"
        missing_deps=1
    fi
    
    return $missing_deps
}

# Function to setup the restore directory
setup_restore_directory() {
    log_message "Setting up restore directory: $RESTORE_DIR"
    
    if [[ ! -d "$RESTORE_DIR" ]]; then
        mkdir -p "$RESTORE_DIR" || {
            log_message "Failed to create restore directory: $RESTORE_DIR" "ERROR"
            return 1
        }
    fi
    
    # Ensure appropriate permissions
    chmod 700 "$RESTORE_DIR" || {
        log_message "Failed to set permissions on restore directory" "ERROR"
        return 1
    }
    
    return 0
}

# Function to get database credentials
get_database_credentials() {
    # Check if all required environment variables are set
    local missing_creds=0
    
    if [[ -z "$DB_HOST" ]]; then
        log_message "DB_HOST environment variable is not set" "ERROR"
        missing_creds=1
    fi
    
    if [[ -z "$DB_PORT" ]]; then
        log_message "DB_PORT not set, defaulting to 5432" "WARN"
        export DB_PORT=5432
    fi
    
    if [[ -z "$DB_NAME" ]]; then
        log_message "DB_NAME environment variable is not set" "ERROR"
        missing_creds=1
    fi
    
    if [[ -z "$DB_USER" ]]; then
        log_message "DB_USER environment variable is not set" "ERROR"
        missing_creds=1
    fi
    
    if [[ -z "$DB_PASSWORD" ]]; then
        log_message "DB_PASSWORD environment variable is not set" "ERROR"
        missing_creds=1
    fi
    
    return $missing_creds
}

# Function to list available backups in S3
list_available_backups() {
    log_message "Listing available backups in S3 bucket: $S3_BUCKET/$S3_PREFIX"
    
    aws s3 ls "s3://$S3_BUCKET/$S3_PREFIX/" --recursive | \
    awk '{print $4 " | " $1 " " $2}' | \
    sort -r
    
    return $?
}

# Function to download a backup from S3
download_backup() {
    local backup_key="$1"
    local filename=$(basename "$backup_key")
    local local_file="$RESTORE_DIR/$filename"
    
    log_message "Downloading backup: $backup_key to $local_file"
    
    aws s3 cp "s3://$S3_BUCKET/$backup_key" "$local_file" || {
        log_message "Failed to download backup from S3" "ERROR"
        return 1
    }
    
    log_message "Successfully downloaded backup to $local_file"
    echo "$local_file"
}

# Function to get the latest backup
get_latest_backup() {
    log_message "Finding latest backup in S3 bucket: $S3_BUCKET/$S3_PREFIX"
    
    local latest_backup=$(aws s3 ls "s3://$S3_BUCKET/$S3_PREFIX/" --recursive | \
                          sort -r | head -n 1 | awk '{print $4}')
    
    if [[ -z "$latest_backup" ]]; then
        log_message "No backups found in S3 bucket" "ERROR"
        return 1
    fi
    
    log_message "Latest backup found: $latest_backup"
    echo "$latest_backup"
}

# Function to decompress backup file if needed
decompress_backup() {
    local backup_file="$1"
    
    if [[ "$backup_file" == *.gz ]]; then
        local decompressed_file="${backup_file%.gz}"
        
        log_message "Decompressing backup: $backup_file to $decompressed_file"
        
        gzip -d -c "$backup_file" > "$decompressed_file" || {
            log_message "Failed to decompress backup file" "ERROR"
            return 1
        }
        
        log_message "Successfully decompressed backup to $decompressed_file"
        echo "$decompressed_file"
    else
        log_message "Backup file is not compressed: $backup_file"
        echo "$backup_file"
    fi
}

# Function to restore the database
restore_database() {
    local backup_file="$1"
    local format="${2:-custom}"
    
    log_message "Restoring database $DB_NAME from backup: $backup_file (format: $format)"
    
    # Set PGPASSWORD environment variable for authentication
    export PGPASSWORD="$DB_PASSWORD"
    
    local restore_cmd=""
    local result=0
    
    # Determine restore command based on format
    case "$format" in
        "custom")
            log_message "Using pg_restore with custom format"
            restore_cmd="pg_restore -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -v --clean --if-exists --no-owner --no-privileges --no-acl $backup_file"
            ;;
        "plain")
            log_message "Using psql with plain SQL format"
            restore_cmd="psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $backup_file"
            ;;
        "tar")
            log_message "Using pg_restore with tar format"
            restore_cmd="pg_restore -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -v --clean --if-exists --no-owner --no-privileges --no-acl -F t $backup_file"
            ;;
        "directory")
            log_message "Using pg_restore with directory format"
            restore_cmd="pg_restore -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -v --clean --if-exists --no-owner --no-privileges --no-acl -F d $backup_file"
            ;;
        *)
            log_message "Unsupported format: $format" "ERROR"
            return 1
            ;;
    esac
    
    # Execute the restore command
    if [[ "$VERBOSE" == "true" ]]; then
        log_message "Executing: $restore_cmd"
        eval "$restore_cmd"
        result=$?
    else
        log_message "Executing restore command (use -v for details)"
        eval "$restore_cmd" > /dev/null 2>&1
        result=$?
    fi
    
    # Check restore result
    if [[ $result -eq 0 ]]; then
        log_message "Database restore completed successfully"
    else
        log_message "Database restore failed with exit code: $result" "ERROR"
    fi
    
    # Unset PGPASSWORD for security
    unset PGPASSWORD
    
    return $result
}

# Function to cleanup restore files
cleanup_restore_files() {
    local backup_file="$1"
    
    if [[ "$KEEP_FILES" == "true" ]]; then
        log_message "Keeping backup files as requested (-k option)"
        return 0
    fi
    
    log_message "Cleaning up restore files"
    
    if [[ -f "$backup_file" ]]; then
        rm -f "$backup_file"
    fi
    
    # If backup was compressed, also remove the decompressed file
    if [[ "$backup_file" == *.gz && -f "${backup_file%.gz}" ]]; then
        rm -f "${backup_file%.gz}"
    fi
    
    return 0
}

# Main function
main() {
    local return_code=0
    local backup_file=""
    local decompressed_file=""
    
    log_message "Starting database restore process"
    
    # Load environment variables
    load_env
    
    # Check dependencies
    check_dependencies || {
        log_message "Missing required dependencies. Aborting." "ERROR"
        return 1
    }
    
    # Setup restore directory
    setup_restore_directory || {
        log_message "Failed to setup restore directory. Aborting." "ERROR"
        return 1
    }
    
    # Get database credentials
    get_database_credentials || {
        log_message "Missing required database credentials. Aborting." "ERROR"
        return 1
    }
    
    # List backups if requested
    if [[ "$LIST_BACKUPS" == "true" ]]; then
        log_message "Listing available backups:"
        list_available_backups
        return $?
    fi
    
    # Determine which backup to restore
    if [[ -n "$BACKUP_KEY" ]]; then
        log_message "Using specified backup: $BACKUP_KEY"
    else
        log_message "No backup specified, using latest backup"
        BACKUP_KEY=$(get_latest_backup) || {
            log_message "Failed to get latest backup. Aborting." "ERROR"
            return 1
        }
    fi
    
    # Download the backup
    backup_file=$(download_backup "$BACKUP_KEY") || {
        log_message "Failed to download backup. Aborting." "ERROR"
        return 1
    }
    
    # Decompress backup if needed
    decompressed_file=$(decompress_backup "$backup_file") || {
        log_message "Failed to decompress backup. Aborting." "ERROR"
        cleanup_restore_files "$backup_file"
        return 1
    }
    
    # Restore the database
    restore_database "$decompressed_file" "$FORMAT" || {
        log_message "Failed to restore database. Aborting." "ERROR"
        cleanup_restore_files "$backup_file"
        return 1
    }
    
    # Cleanup restore files
    cleanup_restore_files "$backup_file"
    
    log_message "Database restore process completed successfully"
    return 0
}

# Parse command line arguments
FORMAT="custom"
KEEP_FILES=false
LIST_BACKUPS=false
LATEST=false
BACKUP_KEY=""
VERBOSE=false

while getopts ":f:klvb:" opt; do
  case ${opt} in
    f )
      FORMAT="$OPTARG"
      ;;
    k )
      KEEP_FILES=true
      ;;
    l )
      LIST_BACKUPS=true
      ;;
    v )
      VERBOSE=true
      ;;
    b )
      BACKUP_KEY="$OPTARG"
      ;;
    \? )
      echo "Invalid option: $OPTARG" 1>&2
      exit 1
      ;;
    : )
      echo "Invalid option: $OPTARG requires an argument" 1>&2
      exit 1
      ;;
  esac
done

# Call the main function
main "$@"

# Exit with the return code from main
exit $?