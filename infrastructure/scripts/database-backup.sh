#!/bin/bash
#
# database-backup.sh - PostgreSQL database backup script for HCBS Revenue Management System
#
# This script performs automated database backups, compresses them, and uploads them to S3.
# It also handles cleanup of old backups based on retention policy.
#
# Dependencies:
# - aws-cli (latest) - For S3 operations
# - postgresql-client (15.x) - For pg_dump
# - gzip (latest) - For compression
#

# Set error handling
set -e

# Global variables
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
PROJECT_ROOT=$(dirname "$(dirname "$SCRIPT_DIR")")
TIMESTAMP=$(date +"%Y-%m-%d-%H%M%S")
BACKUP_DIR=${BACKUP_DIR:-/tmp/database-backups}
S3_BUCKET=${S3_BACKUP_BUCKET:-hcbs-database-backups}
S3_PREFIX=${S3_PREFIX:-database-backup}
BACKUP_RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}
LOG_FILE=${LOG_FILE:-/var/log/hcbs/database-backup.log}

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Function to log messages
log_message() {
    local message="$1"
    local level="${2:-INFO}"
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    local log_entry="[$timestamp] [$level] $message"
    
    # Log to console if verbose
    if [[ "$VERBOSE" == "true" || "$level" == "ERROR" ]]; then
        echo "$log_entry"
    fi
    
    # Log to file
    echo "$log_entry" >> "$LOG_FILE"
}

# Function to load environment variables from .env file
load_env() {
    local env_file="$PROJECT_ROOT/.env"
    
    if [[ -f "$env_file" ]]; then
        log_message "Loading environment variables from $env_file"
        source "$env_file"
        return 0
    else
        log_message "No .env file found at $env_file" "WARNING"
        return 1
    fi
}

# Function to check if required dependencies are installed
check_dependencies() {
    local missing_deps=0
    
    # Check for pg_dump
    if ! command -v pg_dump &> /dev/null; then
        log_message "pg_dump is not installed. Please install postgresql-client." "ERROR"
        missing_deps=1
    fi
    
    # Check for aws CLI
    if ! command -v aws &> /dev/null; then
        log_message "aws CLI is not installed. Please install aws-cli." "ERROR"
        missing_deps=1
    fi
    
    # Check for gzip
    if ! command -v gzip &> /dev/null; then
        log_message "gzip is not installed. Please install gzip." "ERROR"
        missing_deps=1
    fi
    
    return $missing_deps
}

# Function to setup the backup directory
setup_backup_directory() {
    if [[ ! -d "$BACKUP_DIR" ]]; then
        log_message "Creating backup directory: $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
        
        # Set appropriate permissions (owner read/write/execute only)
        chmod 700 "$BACKUP_DIR"
        
        if [[ $? -ne 0 ]]; then
            log_message "Failed to create backup directory: $BACKUP_DIR" "ERROR"
            return 1
        fi
    fi
    
    return 0
}

# Function to retrieve database credentials
get_database_credentials() {
    # Check for required database connection info
    if [[ -z "$DB_HOST" ]]; then
        log_message "DB_HOST environment variable is not set" "ERROR"
        return 1
    fi
    
    # Default to 5432 if DB_PORT is not set
    DB_PORT=${DB_PORT:-5432}
    
    if [[ -z "$DB_NAME" ]]; then
        log_message "DB_NAME environment variable is not set" "ERROR"
        return 1
    fi
    
    if [[ -z "$DB_USER" ]]; then
        log_message "DB_USER environment variable is not set" "ERROR"
        return 1
    fi
    
    if [[ -z "$DB_PASSWORD" ]]; then
        log_message "DB_PASSWORD environment variable is not set" "ERROR"
        return 1
    fi
    
    log_message "Database credentials retrieved successfully"
    return 0
}

# Function to create database backup
create_database_backup() {
    local format="$1"
    local backup_filename="$DB_NAME-$TIMESTAMP"
    local backup_file="$BACKUP_DIR/$backup_filename"
    
    log_message "Creating database backup of $DB_NAME in $format format"
    
    # Create format option
    local format_option=""
    case "$format" in
        "custom")
            format_option="-Fc"
            backup_file="$backup_file.dump"
            ;;
        "plain")
            format_option="-Fp"
            backup_file="$backup_file.sql"
            ;;
        "tar")
            format_option="-Ft"
            backup_file="$backup_file.tar"
            ;;
        "directory")
            format_option="-Fd"
            backup_file="$backup_file.dir"
            mkdir -p "$backup_file"
            ;;
        *)
            log_message "Invalid format: $format. Defaulting to custom format." "WARNING"
            format_option="-Fc"
            backup_file="$backup_file.dump"
            ;;
    esac
    
    # Set PGPASSWORD environment variable for pg_dump
    export PGPASSWORD="$DB_PASSWORD"
    
    # Create backup using pg_dump
    pg_dump $format_option \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -f "$backup_file"
    
    local backup_result=$?
    
    # Unset PGPASSWORD for security
    unset PGPASSWORD
    
    if [[ $backup_result -eq 0 ]]; then
        log_message "Database backup created successfully: $backup_file"
        echo "$backup_file"
        return 0
    else
        log_message "Failed to create database backup" "ERROR"
        return 1
    fi
}

# Function to compress backup
compress_backup() {
    local backup_file="$1"
    local compressed_file=""
    
    # Skip compression for directory format backups
    if [[ -d "$backup_file" ]]; then
        log_message "Directory format backups cannot be compressed with gzip" "WARNING"
        echo "$backup_file"
        return 0
    fi
    
    log_message "Compressing backup file: $backup_file"
    
    # Skip if file is already compressed
    if [[ "$backup_file" == *.gz ]]; then
        log_message "File is already compressed: $backup_file" "WARNING"
        echo "$backup_file"
        return 0
    fi
    
    compressed_file="$backup_file.gz"
    
    # Compress the file
    gzip -9 -c "$backup_file" > "$compressed_file"
    
    if [[ $? -eq 0 ]]; then
        log_message "Backup compressed successfully: $compressed_file"
        
        # Remove the original file to save space
        rm -f "$backup_file"
        
        echo "$compressed_file"
        return 0
    else
        log_message "Failed to compress backup file" "ERROR"
        return 1
    fi
}

# Function to upload backup to S3
upload_to_s3() {
    local backup_file="$1"
    local s3_key="$S3_PREFIX/$(basename "$backup_file")"
    
    # Check for AWS credentials
    if [[ -z "$AWS_ACCESS_KEY_ID" || -z "$AWS_SECRET_ACCESS_KEY" ]]; then
        log_message "AWS credentials not found in environment variables. Trying AWS CLI configured credentials." "WARNING"
    fi
    
    log_message "Uploading backup to S3: s3://$S3_BUCKET/$s3_key"
    
    # Upload to S3 with server-side encryption
    aws s3 cp "$backup_file" "s3://$S3_BUCKET/$s3_key" --sse AES256
    
    if [[ $? -eq 0 ]]; then
        log_message "Backup uploaded successfully to S3"
        return 0
    else
        log_message "Failed to upload backup to S3" "ERROR"
        return 1
    fi
}

# Function to cleanup old backups based on retention period
cleanup_old_backups() {
    local cutoff_date=$(date -d "$BACKUP_RETENTION_DAYS days ago" +"%Y-%m-%d")
    
    log_message "Cleaning up backups older than $cutoff_date"
    
    # List all backups in S3
    local old_backups=$(aws s3 ls "s3://$S3_BUCKET/$S3_PREFIX/" --recursive | awk '$1 < "'$cutoff_date'" {print $4}')
    
    if [[ -z "$old_backups" ]]; then
        log_message "No old backups to clean up"
        return 0
    fi
    
    # Delete each old backup
    echo "$old_backups" | while read -r backup_key; do
        aws s3 rm "s3://$S3_BUCKET/$backup_key"
        
        if [[ $? -eq 0 ]]; then
            log_message "Deleted old backup: $backup_key"
        else
            log_message "Failed to delete old backup: $backup_key" "WARNING"
        fi
    done
    
    return 0
}

# Function to list existing backups in S3
list_backups() {
    log_message "Listing existing backups in S3:"
    
    # List all backups in S3
    aws s3 ls "s3://$S3_BUCKET/$S3_PREFIX/" --recursive | sort
    
    return $?
}

# Function to cleanup local backup files
cleanup_local_backups() {
    local backup_file="$1"
    
    if [[ -f "$backup_file" ]]; then
        log_message "Removing local backup file: $backup_file"
        rm -f "$backup_file"
        
        if [[ $? -eq 0 ]]; then
            log_message "Local backup file removed successfully"
            return 0
        else
            log_message "Failed to remove local backup file" "WARNING"
            return 1
        fi
    elif [[ -d "$backup_file" ]]; then
        log_message "Removing local backup directory: $backup_file"
        rm -rf "$backup_file"
        
        if [[ $? -eq 0 ]]; then
            log_message "Local backup directory removed successfully"
            return 0
        else
            log_message "Failed to remove local backup directory" "WARNING"
            return 1
        fi
    else
        log_message "Backup file not found: $backup_file" "WARNING"
        return 1
    fi
}

# Main function
main() {
    local return_code=0
    local backup_file=""
    
    log_message "Starting database backup process"
    
    # If list backups option is enabled, list backups and exit
    if [[ "$LIST_BACKUPS" == "true" ]]; then
        list_backups
        return $?
    fi
    
    # Load environment variables
    load_env
    
    # Check dependencies
    check_dependencies
    if [[ $? -ne 0 ]]; then
        log_message "Missing required dependencies, aborting" "ERROR"
        return 1
    fi
    
    # Setup backup directory
    setup_backup_directory
    if [[ $? -ne 0 ]]; then
        log_message "Failed to setup backup directory, aborting" "ERROR"
        return 1
    fi
    
    # Get database credentials
    get_database_credentials
    if [[ $? -ne 0 ]]; then
        log_message "Failed to get database credentials, aborting" "ERROR"
        return 1
    fi
    
    # Create backup
    backup_file=$(create_database_backup "$FORMAT")
    if [[ $? -ne 0 ]]; then
        log_message "Failed to create database backup, aborting" "ERROR"
        return 1
    fi
    
    # Compress backup (skip for directory format)
    if [[ ! -d "$backup_file" ]]; then
        backup_file=$(compress_backup "$backup_file")
        if [[ $? -ne 0 ]]; then
            log_message "Failed to compress backup, aborting" "ERROR"
            return 1
        fi
    fi
    
    # Upload to S3
    upload_to_s3 "$backup_file"
    if [[ $? -ne 0 ]]; then
        log_message "Failed to upload backup to S3, aborting" "ERROR"
        return 1
    fi
    
    # Cleanup old backups
    cleanup_old_backups
    if [[ $? -ne 0 ]]; then
        log_message "Failed to cleanup old backups" "WARNING"
        # Continue execution, not critical
    fi
    
    # Cleanup local backup files if not keeping them
    if [[ "$KEEP_LOCAL" != "true" ]]; then
        cleanup_local_backups "$backup_file"
        if [[ $? -ne 0 ]]; then
            log_message "Failed to cleanup local backup files" "WARNING"
            # Continue execution, not critical
        fi
    else
        log_message "Keeping local backup file: $backup_file"
    fi
    
    log_message "Database backup process completed successfully"
    return 0
}

# Parse command line arguments
FORMAT="custom"
KEEP_LOCAL=false
VERBOSE=false

while getopts ":f:klv" opt; do
  case ${opt} in
    f )
      FORMAT="$OPTARG"
      ;;
    k )
      KEEP_LOCAL=true
      ;;
    l )
      LIST_BACKUPS=true
      ;;
    v )
      VERBOSE=true
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