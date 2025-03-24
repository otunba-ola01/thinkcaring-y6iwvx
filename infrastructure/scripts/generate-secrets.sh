#!/usr/bin/env bash
#
# Script to generate secure secrets for the HCBS Revenue Management System
# This script creates cryptographically secure random values for various
# credentials and configurations required by the application.

set -eo pipefail

# Global variables
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
PROJECT_ROOT=$(cd "${SCRIPT_DIR}/../.." && pwd)
K8S_MANIFESTS_DIR="${PROJECT_ROOT}/infrastructure/kubernetes/manifests"
SECRETS_OUTPUT_DIR="${PROJECT_ROOT}/infrastructure/kubernetes/secrets"
ENV_OUTPUT_DIR="${PROJECT_ROOT}/infrastructure/.env"
LOG_FILE="/tmp/generate-secrets-$(date +%Y%m%d-%H%M%S).log"

# Terminal colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
MODE="kubernetes"
APPLY_SECRETS=false
ENVIRONMENT=""
DEBUG=false

# Trap handlers for error management and cleanup
trap 'cleanup; log "ERROR" "Script failed with error on line $LINENO"; exit 1' ERR
trap 'cleanup' EXIT

# Function to display usage information
usage() {
    cat << EOF
Usage: $(basename $0) [OPTIONS] -e ENVIRONMENT

Generate secure secrets for the HCBS Revenue Management System.

OPTIONS:
  -h, --help              Display this help message and exit
  -e, --environment ENV   Environment (development, staging, production)
  -m, --mode MODE         Output mode: kubernetes (default) or env
  -a, --apply             Apply Kubernetes secrets to the cluster (only with kubernetes mode)
  -d, --debug             Enable debug output
  
Examples:
  $(basename $0) -e development -m env                 # Generate .env files for local development
  $(basename $0) -e staging -m kubernetes              # Generate Kubernetes secret files for staging
  $(basename $0) -e production -m kubernetes --apply   # Generate and apply Kubernetes secrets for production
EOF
}

# Function to log messages
log() {
    local level=$1
    local message=$2
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    local color=""
    
    case "$level" in
        "INFO") color=$GREEN ;;
        "WARNING") color=$YELLOW ;;
        "ERROR") color=$RED ;;
        "DEBUG") color=$BLUE ;;
        *) color=$NC ;;
    esac
    
    # Only show debug messages if debug mode is enabled
    if [[ "$level" == "DEBUG" && "$DEBUG" != "true" ]]; then
        echo -e "[$timestamp] $level: $message" >> "$LOG_FILE"
        return
    fi
    
    echo -e "${color}[$timestamp] $level: $message${NC}"
    echo "[$timestamp] $level: $message" >> "$LOG_FILE"
}

# Function to check if required tools are installed
check_prerequisites() {
    local missing_tools=()
    
    # Check for openssl
    if ! command -v openssl &> /dev/null; then
        missing_tools+=("openssl")
    fi
    
    # Check for base64
    if ! command -v base64 &> /dev/null; then
        missing_tools+=("base64")
    fi
    
    # Check for kubectl if in kubernetes mode and applying secrets
    if [[ "$MODE" == "kubernetes" && "$APPLY_SECRETS" == "true" ]]; then
        if ! command -v kubectl &> /dev/null; then
            missing_tools+=("kubectl")
        fi
    fi
    
    # Check for jq
    if ! command -v jq &> /dev/null; then
        missing_tools+=("jq")
    fi
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        log "ERROR" "Missing required tools: ${missing_tools[*]}"
        log "ERROR" "Please install the missing tools and try again."
        return 1
    fi
    
    log "INFO" "All required tools are installed."
    return 0
}

# Function to generate a cryptographically secure random string
generate_random_string() {
    local length=$1
    local result=""
    
    # Generate a random string using OpenSSL
    result=$(openssl rand -base64 $((length * 2)) | tr -dc 'a-zA-Z0-9' | head -c "$length")
    
    # If the result is shorter than requested (due to tr filtering), pad it
    while [ ${#result} -lt "$length" ]; do
        local temp=$(openssl rand -base64 $((length * 2)) | tr -dc 'a-zA-Z0-9' | head -c $((length - ${#result})))
        result="${result}${temp}"
    done
    
    echo "$result"
}

# Function to generate RSA key pair for JWT signing
generate_rsa_keypair() {
    local output_dir=$1
    local key_name=$2
    local private_key_path="${output_dir}/${key_name}.key"
    local public_key_path="${output_dir}/${key_name}.pub"
    
    log "INFO" "Generating RSA key pair for JWT signing"
    
    # Create output directory if it doesn't exist
    mkdir -p "$output_dir"
    
    # Generate private key
    openssl genpkey -algorithm RSA -out "$private_key_path" -pkeyopt rsa_keygen_bits:2048
    
    # Extract public key
    openssl rsa -pubout -in "$private_key_path" -out "$public_key_path"
    
    # Set proper permissions
    chmod 600 "$private_key_path"
    chmod 644 "$public_key_path"
    
    log "INFO" "RSA key pair generated at $output_dir"
    
    return 0
}

# Function to generate Kubernetes secret manifests
generate_kubernetes_secrets() {
    local environment=$1
    local output_dir=$2
    local backend_secret_template="${K8S_MANIFESTS_DIR}/backend/secret.yaml"
    local web_secret_template="${K8S_MANIFESTS_DIR}/web/secret.yaml"
    local temp_dir=$(mktemp -d)
    local jwt_keys_dir="${temp_dir}/jwt-keys"
    
    log "INFO" "Generating Kubernetes secrets for ${environment} environment"
    
    # Create output directory if it doesn't exist
    mkdir -p "$output_dir"
    
    # Generate JWT RSA keys
    generate_rsa_keypair "$jwt_keys_dir" "jwt"
    
    # Read the keys into variables
    local jwt_private_key=$(cat "${jwt_keys_dir}/jwt.key")
    local jwt_public_key=$(cat "${jwt_keys_dir}/jwt.pub")
    
    # Generate random values for all required secrets
    local db_user
    local db_password
    local redis_password
    local jwt_secret
    local smtp_user
    local smtp_password
    local aws_access_key_id
    local aws_secret_access_key
    local clearinghouse_api_key
    local clearinghouse_api_secret
    local ehr_api_key
    local ehr_api_secret
    local encryption_key
    local mfa_secret_key
    local session_secret
    local cookie_secret
    
    # For development environment, use fixed values for easier development
    if [[ "$environment" == "development" ]]; then
        db_user="hcbs_dev"
        db_password=$(generate_random_string 16)
        redis_password=$(generate_random_string 16)
        jwt_secret=$(generate_random_string 32)
        smtp_user="dev-smtp-user"
        smtp_password=$(generate_random_string 16)
        aws_access_key_id="dev-aws-key"
        aws_secret_access_key=$(generate_random_string 16)
        clearinghouse_api_key="dev-clearinghouse-key"
        clearinghouse_api_secret=$(generate_random_string 16)
        ehr_api_key="dev-ehr-key"
        ehr_api_secret=$(generate_random_string 16)
        encryption_key=$(generate_random_string 32)
        mfa_secret_key=$(generate_random_string 32)
        session_secret=$(generate_random_string 32)
        cookie_secret=$(generate_random_string 32)
    else
        # For staging and production, use more secure random values
        db_user="hcbs_${environment:0:4}"
        db_password=$(generate_random_string 32)
        redis_password=$(generate_random_string 32)
        jwt_secret=$(generate_random_string 64)
        smtp_user="smtp-user-${environment}"
        smtp_password=$(generate_random_string 32)
        aws_access_key_id=$(generate_random_string 20)
        aws_secret_access_key=$(generate_random_string 40)
        clearinghouse_api_key=$(generate_random_string 32)
        clearinghouse_api_secret=$(generate_random_string 32)
        ehr_api_key=$(generate_random_string 32)
        ehr_api_secret=$(generate_random_string 32)
        encryption_key=$(generate_random_string 32)
        mfa_secret_key=$(generate_random_string 32)
        session_secret=$(generate_random_string 64)
        cookie_secret=$(generate_random_string 64)
    fi
    
    # Base64 encode all values for Kubernetes secrets
    local base64_db_user=$(echo -n "$db_user" | base64)
    local base64_db_password=$(echo -n "$db_password" | base64)
    local base64_redis_password=$(echo -n "$redis_password" | base64)
    local base64_jwt_secret=$(echo -n "$jwt_secret" | base64)
    local base64_jwt_private_key=$(echo -n "$jwt_private_key" | base64)
    local base64_jwt_public_key=$(echo -n "$jwt_public_key" | base64)
    local base64_smtp_user=$(echo -n "$smtp_user" | base64)
    local base64_smtp_password=$(echo -n "$smtp_password" | base64)
    local base64_aws_access_key_id=$(echo -n "$aws_access_key_id" | base64)
    local base64_aws_secret_access_key=$(echo -n "$aws_secret_access_key" | base64)
    local base64_clearinghouse_api_key=$(echo -n "$clearinghouse_api_key" | base64)
    local base64_clearinghouse_api_secret=$(echo -n "$clearinghouse_api_secret" | base64)
    local base64_ehr_api_key=$(echo -n "$ehr_api_key" | base64)
    local base64_ehr_api_secret=$(echo -n "$ehr_api_secret" | base64)
    local base64_encryption_key=$(echo -n "$encryption_key" | base64)
    local base64_mfa_secret_key=$(echo -n "$mfa_secret_key" | base64)
    local base64_session_secret=$(echo -n "$session_secret" | base64)
    local base64_cookie_secret=$(echo -n "$cookie_secret" | base64)
    
    # Check if backend secret template exists
    if [[ -f "$backend_secret_template" ]]; then
        # Create backend secret file
        local backend_secret_file="${output_dir}/backend-secret.yaml"
        
        # Replace placeholders in template with actual values
        cat "$backend_secret_template" | \
            sed "s|\${BASE64_DB_USER}|${base64_db_user}|g" | \
            sed "s|\${BASE64_DB_PASSWORD}|${base64_db_password}|g" | \
            sed "s|\${BASE64_REDIS_PASSWORD}|${base64_redis_password}|g" | \
            sed "s|\${BASE64_JWT_SECRET}|${base64_jwt_secret}|g" | \
            sed "s|\${BASE64_JWT_PRIVATE_KEY}|${base64_jwt_private_key}|g" | \
            sed "s|\${BASE64_JWT_PUBLIC_KEY}|${base64_jwt_public_key}|g" | \
            sed "s|\${BASE64_SMTP_USER}|${base64_smtp_user}|g" | \
            sed "s|\${BASE64_SMTP_PASSWORD}|${base64_smtp_password}|g" | \
            sed "s|\${BASE64_AWS_ACCESS_KEY_ID}|${base64_aws_access_key_id}|g" | \
            sed "s|\${BASE64_AWS_SECRET_ACCESS_KEY}|${base64_aws_secret_access_key}|g" | \
            sed "s|\${BASE64_CLEARINGHOUSE_API_KEY}|${base64_clearinghouse_api_key}|g" | \
            sed "s|\${BASE64_CLEARINGHOUSE_API_SECRET}|${base64_clearinghouse_api_secret}|g" | \
            sed "s|\${BASE64_EHR_API_KEY}|${base64_ehr_api_key}|g" | \
            sed "s|\${BASE64_EHR_API_SECRET}|${base64_ehr_api_secret}|g" | \
            sed "s|\${BASE64_ENCRYPTION_KEY}|${base64_encryption_key}|g" | \
            sed "s|\${BASE64_MFA_SECRET_KEY}|${base64_mfa_secret_key}|g" | \
            sed "s|\${BASE64_SESSION_SECRET}|${base64_session_secret}|g" | \
            sed "s|\${BASE64_COOKIE_SECRET}|${base64_cookie_secret}|g" > "$backend_secret_file"
        
        log "INFO" "Backend Kubernetes secret generated at $backend_secret_file"
    else
        log "WARNING" "Backend secret template not found at $backend_secret_template"
    fi
    
    # Check if web secret template exists
    if [[ -f "$web_secret_template" ]]; then
        # Create web secret file
        local web_secret_file="${output_dir}/web-secret.yaml"
        
        # Replace placeholders in template with actual values (frontend usually needs fewer secrets)
        cat "$web_secret_template" | \
            sed "s|\${BASE64_JWT_PUBLIC_KEY}|${base64_jwt_public_key}|g" | \
            sed "s|\${BASE64_AWS_ACCESS_KEY_ID}|${base64_aws_access_key_id}|g" | \
            sed "s|\${BASE64_AWS_SECRET_ACCESS_KEY}|${base64_aws_secret_access_key}|g" | \
            sed "s|\${BASE64_COOKIE_SECRET}|${base64_cookie_secret}|g" > "$web_secret_file"
        
        log "INFO" "Web Kubernetes secret generated at $web_secret_file"
    else
        log "DEBUG" "Web secret template not found at $web_secret_template, skipping"
    fi
    
    # Set appropriate permissions on secret files
    chmod 600 "${output_dir}"/*.yaml
    
    # Clean up temporary files
    rm -rf "$temp_dir"
    
    log "INFO" "Kubernetes secrets generated successfully for $environment environment"
    return 0
}

# Function to generate environment files
generate_env_files() {
    local environment=$1
    local output_dir=$2
    local temp_dir=$(mktemp -d)
    local jwt_keys_dir="${temp_dir}/jwt-keys"
    
    log "INFO" "Generating environment files for ${environment} environment"
    
    # Create output directory if it doesn't exist
    mkdir -p "$output_dir"
    
    # Generate JWT RSA keys
    generate_rsa_keypair "$jwt_keys_dir" "jwt"
    
    # Read the keys into variables
    local jwt_private_key=$(cat "${jwt_keys_dir}/jwt.key")
    local jwt_public_key=$(cat "${jwt_keys_dir}/jwt.pub")
    
    # Generate random values for all required secrets
    local db_user
    local db_password
    local redis_password
    local jwt_secret
    local smtp_user
    local smtp_password
    local aws_access_key_id
    local aws_secret_access_key
    local clearinghouse_api_key
    local clearinghouse_api_secret
    local ehr_api_key
    local ehr_api_secret
    local encryption_key
    local mfa_secret_key
    local session_secret
    local cookie_secret
    
    # For development environment, use fixed values for easier development
    if [[ "$environment" == "development" ]]; then
        db_user="hcbs_dev"
        db_password=$(generate_random_string 16)
        redis_password=$(generate_random_string 16)
        jwt_secret=$(generate_random_string 32)
        smtp_user="dev-smtp-user"
        smtp_password=$(generate_random_string 16)
        aws_access_key_id="dev-aws-key"
        aws_secret_access_key=$(generate_random_string 16)
        clearinghouse_api_key="dev-clearinghouse-key"
        clearinghouse_api_secret=$(generate_random_string 16)
        ehr_api_key="dev-ehr-key"
        ehr_api_secret=$(generate_random_string 16)
        encryption_key=$(generate_random_string 32)
        mfa_secret_key=$(generate_random_string 32)
        session_secret=$(generate_random_string 32)
        cookie_secret=$(generate_random_string 32)
    else
        # For staging and production, use more secure random values
        db_user="hcbs_${environment:0:4}"
        db_password=$(generate_random_string 32)
        redis_password=$(generate_random_string 32)
        jwt_secret=$(generate_random_string 64)
        smtp_user="smtp-user-${environment}"
        smtp_password=$(generate_random_string 32)
        aws_access_key_id=$(generate_random_string 20)
        aws_secret_access_key=$(generate_random_string 40)
        clearinghouse_api_key=$(generate_random_string 32)
        clearinghouse_api_secret=$(generate_random_string 32)
        ehr_api_key=$(generate_random_string 32)
        ehr_api_secret=$(generate_random_string 32)
        encryption_key=$(generate_random_string 32)
        mfa_secret_key=$(generate_random_string 32)
        session_secret=$(generate_random_string 64)
        cookie_secret=$(generate_random_string 64)
    fi
    
    # Create backend .env file
    local backend_env_file="${output_dir}/backend.env"
    cat << EOF > "$backend_env_file"
# Database Credentials
DB_USER=${db_user}
DB_PASSWORD=${db_password}

# Redis Credentials
REDIS_PASSWORD=${redis_password}

# JWT Authentication
JWT_SECRET=${jwt_secret}
# The private and public keys below are encoded with special characters
# If you need to use them in a shell command, make sure to properly escape them
JWT_PRIVATE_KEY='${jwt_private_key}'
JWT_PUBLIC_KEY='${jwt_public_key}'

# Email Configuration
SMTP_USER=${smtp_user}
SMTP_PASSWORD=${smtp_password}

# AWS Credentials
AWS_ACCESS_KEY_ID=${aws_access_key_id}
AWS_SECRET_ACCESS_KEY=${aws_secret_access_key}

# Integration Credentials
CLEARINGHOUSE_API_KEY=${clearinghouse_api_key}
CLEARINGHOUSE_API_SECRET=${clearinghouse_api_secret}
EHR_API_KEY=${ehr_api_key}
EHR_API_SECRET=${ehr_api_secret}

# Security Keys
ENCRYPTION_KEY=${encryption_key}
MFA_SECRET_KEY=${mfa_secret_key}
SESSION_SECRET=${session_secret}
COOKIE_SECRET=${cookie_secret}

# Environment
NODE_ENV=${environment}
EOF
    
    # Create web .env file
    local web_env_file="${output_dir}/web.env"
    cat << EOF > "$web_env_file"
# JWT Authentication
NEXT_PUBLIC_JWT_PUBLIC_KEY='${jwt_public_key}'

# AWS Credentials
NEXT_PUBLIC_AWS_ACCESS_KEY_ID=${aws_access_key_id}
NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY=${aws_secret_access_key}

# Security Keys
NEXT_PUBLIC_COOKIE_SECRET=${cookie_secret}

# Environment
NEXT_PUBLIC_NODE_ENV=${environment}
EOF
    
    # Set appropriate permissions on .env files
    chmod 600 "${output_dir}"/*.env
    
    # Clean up temporary files
    rm -rf "$temp_dir"
    
    log "INFO" "Environment files generated successfully for $environment environment"
    log "INFO" "Backend .env: $backend_env_file"
    log "INFO" "Web .env: $web_env_file"
    
    return 0
}

# Function to apply Kubernetes secrets to the cluster
apply_kubernetes_secrets() {
    local environment=$1
    local secrets_dir=$2
    local backend_secret_file="${secrets_dir}/backend-secret.yaml"
    local web_secret_file="${secrets_dir}/web-secret.yaml"
    
    log "INFO" "Applying Kubernetes secrets for ${environment} environment"
    
    # Check if kubectl is configured for the correct cluster
    local current_context=$(kubectl config current-context 2>/dev/null || echo "unknown")
    log "INFO" "Current kubectl context: $current_context"
    
    # Check if namespace exists, create if not
    if ! kubectl get namespace hcbs &>/dev/null; then
        log "INFO" "Creating hcbs namespace"
        
        # Check if namespace template exists
        local namespace_template="${K8S_MANIFESTS_DIR}/common/namespace.yaml"
        if [[ -f "$namespace_template" ]]; then
            # Replace environment placeholder in namespace template
            cat "$namespace_template" | sed "s|\${ENVIRONMENT}|${environment}|g" | kubectl apply -f -
        else
            # Create namespace directly
            kubectl create namespace hcbs
        fi
    fi
    
    # Apply backend secret
    if [[ -f "$backend_secret_file" ]]; then
        log "INFO" "Applying backend secret"
        kubectl apply -f "$backend_secret_file"
    else
        log "ERROR" "Backend secret file not found at $backend_secret_file"
        return 1
    fi
    
    # Apply web secret if it exists
    if [[ -f "$web_secret_file" ]]; then
        log "INFO" "Applying web secret"
        kubectl apply -f "$web_secret_file"
    else
        log "DEBUG" "Web secret file not found at $web_secret_file, skipping"
    fi
    
    # Verify secrets were created
    log "INFO" "Verifying secrets were created successfully"
    if ! kubectl get secret hcbs-backend-secret -n hcbs &>/dev/null; then
        log "ERROR" "Backend secret was not created successfully"
        return 1
    fi
    
    log "INFO" "Kubernetes secrets applied successfully for $environment environment"
    return 0
}

# Function to clean up temporary files
cleanup() {
    log "DEBUG" "Cleaning up temporary files"
    # Add any cleanup operations here if needed
}

# Main function
main() {
    log "INFO" "Starting secret generation for HCBS Revenue Management System"
    
    # Check prerequisites
    if ! check_prerequisites; then
        log "ERROR" "Failed to meet prerequisites"
        return 1
    fi
    
    # Validate environment
    if [[ "$ENVIRONMENT" != "development" && "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
        log "ERROR" "Invalid environment: $ENVIRONMENT"
        log "ERROR" "Environment must be one of: development, staging, production"
        usage
        return 1
    fi
    
    # Validate mode
    if [[ "$MODE" != "kubernetes" && "$MODE" != "env" ]]; then
        log "ERROR" "Invalid mode: $MODE"
        log "ERROR" "Mode must be one of: kubernetes, env"
        usage
        return 1
    fi
    
    # Generate secrets based on mode
    if [[ "$MODE" == "kubernetes" ]]; then
        log "INFO" "Generating Kubernetes secrets for $ENVIRONMENT environment"
        
        # Create output directory for specific environment
        local k8s_secrets_dir="${SECRETS_OUTPUT_DIR}/${ENVIRONMENT}"
        
        # Generate Kubernetes secrets
        if ! generate_kubernetes_secrets "$ENVIRONMENT" "$k8s_secrets_dir"; then
            log "ERROR" "Failed to generate Kubernetes secrets"
            return 1
        fi
        
        # Apply secrets if requested
        if [[ "$APPLY_SECRETS" == "true" ]]; then
            if ! apply_kubernetes_secrets "$ENVIRONMENT" "$k8s_secrets_dir"; then
                log "ERROR" "Failed to apply Kubernetes secrets"
                return 1
            fi
        fi
    else
        log "INFO" "Generating environment files for $ENVIRONMENT environment"
        
        # Create output directory for specific environment
        local env_output_dir="${ENV_OUTPUT_DIR}/${ENVIRONMENT}"
        
        # Generate environment files
        if ! generate_env_files "$ENVIRONMENT" "$env_output_dir"; then
            log "ERROR" "Failed to generate environment files"
            return 1
        fi
    fi
    
    log "INFO" "Secret generation completed successfully"
    return 0
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        -h|--help)
            usage
            exit 0
            ;;
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -m|--mode)
            MODE="$2"
            shift 2
            ;;
        -a|--apply)
            APPLY_SECRETS=true
            shift
            ;;
        -d|--debug)
            DEBUG=true
            shift
            ;;
        *)
            log "ERROR" "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Ensure environment is provided
if [[ -z "$ENVIRONMENT" ]]; then
    log "ERROR" "Environment (-e) is required"
    usage
    exit 1
fi

# Execute main function and capture exit code
main
exit_code=$?

# Exit with appropriate code
exit $exit_code