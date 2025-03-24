#!/usr/bin/env bash
# deploy.sh - Deployment script for the HCBS Revenue Management System
# 
# This script automates the deployment process to different environments
# (development, staging, production) using a blue-green deployment strategy
# with Kubernetes and AWS infrastructure.

# Exit immediately if a command exits with a non-zero status
set -eo pipefail

# =========================================================================
# Global variables
# =========================================================================

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
PROJECT_ROOT=$(cd "${SCRIPT_DIR}/../.." && pwd)
TERRAFORM_DIR="${PROJECT_ROOT}/infrastructure/terraform"
K8S_MANIFESTS_DIR="${PROJECT_ROOT}/infrastructure/kubernetes/manifests"
LOG_FILE="/tmp/deploy-$(date +%Y%m%d-%H%M%S).log"

# Default values
ENVIRONMENT=""
VERSION=""
REGION="us-east-1"
REGISTRY_URL=""
SKIP_TERRAFORM=false
SKIP_VERIFICATION=false

# Color codes for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =========================================================================
# Functions
# =========================================================================

# Display script usage information
usage() {
    echo -e "${BLUE}NAME${NC}"
    echo "    deploy.sh - Deployment script for the HCBS Revenue Management System"
    echo
    echo -e "${BLUE}SYNOPSIS${NC}"
    echo "    ./deploy.sh -e ENVIRONMENT -v VERSION [-r REGION] [-i REGISTRY_URL] [-s] [-t] [-h]"
    echo
    echo -e "${BLUE}DESCRIPTION${NC}"
    echo "    This script automates the deployment process to different environments"
    echo "    (development, staging, production) using a blue-green deployment strategy"
    echo "    with Kubernetes and AWS infrastructure."
    echo
    echo -e "${BLUE}OPTIONS${NC}"
    echo "    -e ENVIRONMENT     Specify the target environment (development, staging, production)"
    echo "    -v VERSION         Specify the version to deploy (e.g., 1.2.3)"
    echo "    -r REGION          AWS region (default: us-east-1)"
    echo "    -i REGISTRY_URL    Docker registry URL (default: AWS ECR in the specified region)"
    echo "    -s                 Skip Terraform infrastructure deployment"
    echo "    -t                 Skip post-deployment verification"
    echo "    -h                 Display this help message"
    echo
    echo -e "${BLUE}EXAMPLES${NC}"
    echo "    ./deploy.sh -e development -v 1.2.3"
    echo "    ./deploy.sh -e production -v 1.5.0 -r us-west-2 -s"
    echo
    exit 1
}

# Log messages to both stdout and log file
log() {
    local level=$1
    local message=$2
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    local log_message="[${timestamp}] [${level}] ${message}"
    
    case ${level} in
        INFO)
            echo -e "${GREEN}${log_message}${NC}"
            ;;
        WARN)
            echo -e "${YELLOW}${log_message}${NC}"
            ;;
        ERROR)
            echo -e "${RED}${log_message}${NC}"
            ;;
        *)
            echo -e "${log_message}"
            ;;
    esac
    
    echo "${log_message}" >> "${LOG_FILE}"
}

# Check if required tools are installed
check_prerequisites() {
    log "INFO" "Checking prerequisites..."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        log "ERROR" "AWS CLI is not installed. Please install it and try again."
        return 1
    fi
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        log "ERROR" "kubectl is not installed. Please install it and try again."
        return 1
    fi
    
    # Check terraform
    if ! command -v terraform &> /dev/null; then
        log "ERROR" "terraform is not installed. Please install it and try again."
        return 1
    fi
    
    # Check jq
    if ! command -v jq &> /dev/null; then
        log "ERROR" "jq is not installed. Please install it and try again."
        return 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log "ERROR" "AWS credentials are not configured or invalid. Please configure valid AWS credentials."
        return 1
    fi
    
    log "INFO" "All prerequisites are met."
    return 0
}

# Configure kubectl to connect to the EKS cluster
setup_kubeconfig() {
    local environment=$1
    local region=$2
    
    log "INFO" "Setting up kubectl configuration for ${environment} environment in ${region} region..."
    
    # Get EKS cluster name from Terraform output
    local cluster_name
    pushd "${TERRAFORM_DIR}/${environment}" > /dev/null
    
    if ! cluster_name=$(terraform output -json eks_cluster_name | jq -r '.'); then
        log "ERROR" "Failed to get EKS cluster name from Terraform output."
        popd > /dev/null
        return 1
    fi
    
    popd > /dev/null
    
    if [[ -z "${cluster_name}" || "${cluster_name}" == "null" ]]; then
        log "ERROR" "EKS cluster name is empty or null."
        return 1
    fi
    
    # Update kubeconfig
    if ! aws eks update-kubeconfig --name "${cluster_name}" --region "${region}"; then
        log "ERROR" "Failed to update kubeconfig for cluster ${cluster_name}."
        return 1
    fi
    
    # Verify connection to the cluster
    if ! kubectl cluster-info; then
        log "ERROR" "Failed to connect to the EKS cluster."
        return 1
    fi
    
    log "INFO" "kubectl configured successfully for cluster ${cluster_name}."
    return 0
}

# Apply Terraform configuration for the specified environment
deploy_terraform() {
    local environment=$1
    local region=$2
    
    log "INFO" "Deploying Terraform infrastructure for ${environment} environment in ${region} region..."
    
    # Change to the appropriate Terraform directory
    pushd "${TERRAFORM_DIR}/${environment}" > /dev/null
    
    # Initialize Terraform
    log "INFO" "Initializing Terraform..."
    if ! terraform init; then
        log "ERROR" "Terraform initialization failed."
        popd > /dev/null
        return 1
    fi
    
    # Plan Terraform changes
    log "INFO" "Planning Terraform changes..."
    if ! terraform plan -var="region=${region}" -out=tfplan; then
        log "ERROR" "Terraform plan failed."
        popd > /dev/null
        return 1
    fi
    
    # Apply Terraform changes
    log "INFO" "Applying Terraform changes..."
    if ! terraform apply -auto-approve tfplan; then
        log "ERROR" "Terraform apply failed."
        popd > /dev/null
        return 1
    fi
    
    log "INFO" "Terraform infrastructure deployed successfully."
    popd > /dev/null
    return 0
}

# Update Kubernetes manifest files with environment-specific values
update_k8s_manifests() {
    local environment=$1
    local version=$2
    local registry_url=$3
    
    log "INFO" "Updating Kubernetes manifests for ${environment} environment with version ${version}..."
    
    # Create a temporary directory for modified manifests
    local temp_dir=$(mktemp -d)
    log "INFO" "Created temporary directory for manifests: ${temp_dir}"
    
    # Copy original manifests to the temporary directory
    cp -r "${K8S_MANIFESTS_DIR}"/* "${temp_dir}/"
    
    # If registry URL is not provided, get it from AWS ECR
    if [[ -z "${registry_url}" ]]; then
        local account_id
        if ! account_id=$(aws sts get-caller-identity --query Account --output text); then
            log "ERROR" "Failed to get AWS account ID."
            return 1
        fi
        registry_url="${account_id}.dkr.ecr.${REGION}.amazonaws.com"
        log "INFO" "Using ECR registry URL: ${registry_url}"
    fi
    
    # Replace placeholders in manifest files
    find "${temp_dir}" -type f -name "*.yaml" -exec sed -i "s|__ENVIRONMENT__|${environment}|g" {} \;
    find "${temp_dir}" -type f -name "*.yaml" -exec sed -i "s|__VERSION__|${version}|g" {} \;
    find "${temp_dir}" -type f -name "*.yaml" -exec sed -i "s|__REGISTRY_URL__|${registry_url}|g" {} \;
    
    # Additional environment-specific configurations
    case ${environment} in
        development)
            # Set development-specific values (e.g., fewer replicas, debug mode)
            find "${temp_dir}" -type f -name "*.yaml" -exec sed -i "s|replicas: .*|replicas: 1|g" {} \;
            ;;
        staging)
            # Set staging-specific values
            find "${temp_dir}" -type f -name "*.yaml" -exec sed -i "s|replicas: .*|replicas: 2|g" {} \;
            ;;
        production)
            # Set production-specific values
            find "${temp_dir}" -type f -name "*.yaml" -exec sed -i "s|replicas: .*|replicas: 3|g" {} \;
            ;;
    esac
    
    log "INFO" "Kubernetes manifests updated successfully."
    echo "${temp_dir}"
    return 0
}

# Deploy using blue-green deployment strategy
deploy_blue_green() {
    local environment=$1
    local manifests_dir=$2
    
    log "INFO" "Starting blue-green deployment for ${environment} environment..."
    
    # Determine the current active deployment (blue or green)
    local current_color=""
    if kubectl get service main-service -n "${environment}" &> /dev/null; then
        current_color=$(kubectl get service main-service -n "${environment}" -o jsonpath='{.spec.selector.deployment}' 2>/dev/null || echo "")
    fi
    
    # If no current deployment or error, default to blue
    if [[ -z "${current_color}" || "${current_color}" == "green" ]]; then
        new_color="blue"
    else
        new_color="green"
    fi
    
    log "INFO" "Current active deployment: ${current_color:-none}, deploying to: ${new_color}"
    
    # Create namespace if it doesn't exist
    if ! kubectl get namespace "${environment}" &> /dev/null; then
        log "INFO" "Creating namespace: ${environment}"
        kubectl create namespace "${environment}"
    fi
    
    # Deploy the new version to the inactive deployment
    log "INFO" "Deploying new version to ${new_color} deployment..."
    find "${manifests_dir}" -type f -name "*.yaml" -exec sed -i "s|__DEPLOYMENT_COLOR__|${new_color}|g" {} \;
    
    # Apply all manifests
    if ! kubectl apply -f "${manifests_dir}" -n "${environment}"; then
        log "ERROR" "Failed to apply Kubernetes manifests."
        return 1
    fi
    
    # Wait for the new deployment to be ready
    log "INFO" "Waiting for ${new_color} deployment to be ready..."
    if ! kubectl rollout status deployment "${new_color}-deployment" -n "${environment}" --timeout=300s; then
        log "ERROR" "Deployment rollout timed out or failed."
        return 1
    fi
    
    # Switch traffic to the new deployment
    log "INFO" "Switching traffic to ${new_color} deployment..."
    kubectl patch service main-service -n "${environment}" -p "{\"spec\":{\"selector\":{\"deployment\":\"${new_color}\"}}}" || {
        log "ERROR" "Failed to switch traffic to ${new_color} deployment."
        return 1
    }
    
    # Verify the new deployment is serving traffic
    log "INFO" "Verifying new deployment is serving traffic..."
    sleep 10  # Give some time for the switch to take effect
    
    # Get the service endpoint
    local service_endpoint
    if [[ "${environment}" == "production" ]]; then
        service_endpoint=$(kubectl get service main-service -n "${environment}" -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
    else
        service_endpoint=$(kubectl get service main-service -n "${environment}" -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
    fi
    
    if [[ -z "${service_endpoint}" ]]; then
        log "ERROR" "Failed to get service endpoint."
        return 1
    fi
    
    log "INFO" "Service endpoint: ${service_endpoint}"
    log "INFO" "Blue-green deployment completed successfully."
    
    # Store deployment info for potential rollback
    echo "${current_color}" > "/tmp/${environment}_previous_deployment"
    echo "${new_color}" > "/tmp/${environment}_current_deployment"
    
    return 0
}

# Verify deployment health and functionality
verify_deployment() {
    local environment=$1
    
    log "INFO" "Verifying deployment for ${environment} environment..."
    
    # Get the current deployment color
    local current_color
    current_color=$(cat "/tmp/${environment}_current_deployment" 2>/dev/null || echo "")
    
    if [[ -z "${current_color}" ]]; then
        log "ERROR" "Could not determine current deployment color for verification."
        return 1
    fi
    
    # Check deployment status
    log "INFO" "Checking deployment status..."
    if ! kubectl get deployment "${current_color}-deployment" -n "${environment}" &> /dev/null; then
        log "ERROR" "Deployment ${current_color}-deployment not found."
        return 1
    fi
    
    # Check pod health
    log "INFO" "Checking pod health..."
    local ready_pods
    ready_pods=$(kubectl get deployment "${current_color}-deployment" -n "${environment}" -o jsonpath='{.status.readyReplicas}')
    local desired_pods
    desired_pods=$(kubectl get deployment "${current_color}-deployment" -n "${environment}" -o jsonpath='{.spec.replicas}')
    
    if [[ "${ready_pods}" != "${desired_pods}" ]]; then
        log "ERROR" "Not all pods are ready. Ready: ${ready_pods}, Desired: ${desired_pods}"
        return 1
    fi
    
    # Check service endpoints
    log "INFO" "Checking service endpoints..."
    local service_endpoint
    service_endpoint=$(kubectl get service main-service -n "${environment}" -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
    
    if [[ -z "${service_endpoint}" ]]; then
        log "ERROR" "Service endpoint not available."
        return 1
    fi
    
    # Perform basic health checks on APIs
    log "INFO" "Performing health checks..."
    
    # Wait for the DNS to propagate and service to be available
    local max_retries=30
    local retry_count=0
    
    while ! curl -s "http://${service_endpoint}/health" | grep -q "ok"; do
        retry_count=$((retry_count + 1))
        if [[ "${retry_count}" -ge "${max_retries}" ]]; then
            log "ERROR" "Health check failed after ${max_retries} attempts."
            return 1
        fi
        log "WARN" "Health check not ready yet. Retrying in 10 seconds... (${retry_count}/${max_retries})"
        sleep 10
    done
    
    log "INFO" "Health check passed successfully."
    log "INFO" "Deployment verification completed successfully."
    return 0
}

# Rollback to previous deployment if current deployment fails
rollback_deployment() {
    local environment=$1
    
    log "WARN" "Rolling back deployment for ${environment} environment..."
    
    # Get the previous deployment color
    local previous_color
    previous_color=$(cat "/tmp/${environment}_previous_deployment" 2>/dev/null || echo "")
    
    if [[ -z "${previous_color}" ]]; then
        log "ERROR" "Could not determine previous deployment color for rollback."
        return 1
    fi
    
    log "INFO" "Rolling back to ${previous_color} deployment..."
    
    # Switch traffic back to the previous deployment
    kubectl patch service main-service -n "${environment}" -p "{\"spec\":{\"selector\":{\"deployment\":\"${previous_color}\"}}}" || {
        log "ERROR" "Failed to switch traffic back to ${previous_color} deployment."
        return 1
    }
    
    # Verify the previous deployment is serving traffic
    log "INFO" "Verifying previous deployment is serving traffic..."
    sleep 10  # Give some time for the switch to take effect
    
    log "INFO" "Rollback completed successfully."
    
    # Update deployment info after rollback
    local current_color
    current_color=$(cat "/tmp/${environment}_current_deployment" 2>/dev/null || echo "")
    
    # Swap current and previous deployment colors
    echo "${current_color}" > "/tmp/${environment}_previous_deployment"
    echo "${previous_color}" > "/tmp/${environment}_current_deployment"
    
    return 0
}

# Clean up temporary files and resources
cleanup() {
    log "INFO" "Cleaning up temporary files..."
    
    # Clean up temporary manifest files
    if [[ -d "${TEMP_MANIFESTS_DIR}" ]]; then
        rm -rf "${TEMP_MANIFESTS_DIR}"
        log "INFO" "Removed temporary manifest directory: ${TEMP_MANIFESTS_DIR}"
    fi
    
    # Clean up deployment color files
    if [[ -n "${ENVIRONMENT}" ]]; then
        rm -f "/tmp/${ENVIRONMENT}_previous_deployment" "/tmp/${ENVIRONMENT}_current_deployment"
    fi
    
    log "INFO" "Cleanup completed."
}

# Main function that orchestrates the deployment process
main() {
    local args=("$@")
    local exit_code=0
    
    log "INFO" "Starting deployment process..."
    
    # Validate required parameters
    if [[ -z "${ENVIRONMENT}" ]]; then
        log "ERROR" "Environment (-e) is required."
        usage
        return 1
    fi
    
    if [[ -z "${VERSION}" ]]; then
        log "ERROR" "Version (-v) is required."
        usage
        return 1
    fi
    
    # Validate environment parameter
    case ${ENVIRONMENT} in
        development|staging|production)
            # Valid environment
            ;;
        *)
            log "ERROR" "Invalid environment: ${ENVIRONMENT}. Must be one of: development, staging, production."
            return 1
            ;;
    esac
    
    log "INFO" "Deploying version ${VERSION} to ${ENVIRONMENT} environment in ${REGION} region."
    
    # Check prerequisites
    if ! check_prerequisites; then
        log "ERROR" "Prerequisites check failed."
        return 1
    fi
    
    # Deploy Terraform infrastructure if not skipped
    if [[ "${SKIP_TERRAFORM}" == "false" ]]; then
        if ! deploy_terraform "${ENVIRONMENT}" "${REGION}"; then
            log "ERROR" "Terraform deployment failed."
            return 1
        fi
    else
        log "INFO" "Skipping Terraform infrastructure deployment."
    fi
    
    # Setup kubectl configuration
    if ! setup_kubeconfig "${ENVIRONMENT}" "${REGION}"; then
        log "ERROR" "kubectl configuration failed."
        return 1
    fi
    
    # Update Kubernetes manifests
    TEMP_MANIFESTS_DIR=$(update_k8s_manifests "${ENVIRONMENT}" "${VERSION}" "${REGISTRY_URL}")
    if [[ $? -ne 0 || -z "${TEMP_MANIFESTS_DIR}" ]]; then
        log "ERROR" "Failed to update Kubernetes manifests."
        return 1
    fi
    
    # Deploy using blue-green strategy
    if ! deploy_blue_green "${ENVIRONMENT}" "${TEMP_MANIFESTS_DIR}"; then
        log "ERROR" "Blue-green deployment failed."
        return 1
    fi
    
    # Verify deployment if not skipped
    if [[ "${SKIP_VERIFICATION}" == "false" ]]; then
        if ! verify_deployment "${ENVIRONMENT}"; then
            log "ERROR" "Deployment verification failed. Rolling back..."
            
            # Rollback deployment
            if ! rollback_deployment "${ENVIRONMENT}"; then
                log "ERROR" "Rollback failed."
            else
                log "INFO" "Rolled back to previous deployment."
            fi
            
            exit_code=1
        else
            log "INFO" "Deployment verification passed."
        fi
    else
        log "INFO" "Skipping deployment verification."
    fi
    
    # Log deployment result
    if [[ ${exit_code} -eq 0 ]]; then
        log "INFO" "Deployment completed successfully."
    else
        log "ERROR" "Deployment failed."
    fi
    
    return ${exit_code}
}

# =========================================================================
# Trap handlers
# =========================================================================

# Trap ERR signal to ensure proper logging of errors
trap 'log "ERROR" "Command failed with exit code $?: $BASH_COMMAND"' ERR

# Trap EXIT signal to ensure cleanup is performed
trap 'cleanup' EXIT

# =========================================================================
# Parse command-line arguments
# =========================================================================

while getopts ":e:v:r:i:sth" opt; do
    case ${opt} in
        e)
            ENVIRONMENT="${OPTARG}"
            ;;
        v)
            VERSION="${OPTARG}"
            ;;
        r)
            REGION="${OPTARG}"
            ;;
        i)
            REGISTRY_URL="${OPTARG}"
            ;;
        s)
            SKIP_TERRAFORM=true
            ;;
        t)
            SKIP_VERIFICATION=true
            ;;
        h)
            usage
            ;;
        \?)
            log "ERROR" "Invalid option: -${OPTARG}"
            usage
            ;;
        :)
            log "ERROR" "Option -${OPTARG} requires an argument."
            usage
            ;;
    esac
done

# =========================================================================
# Main script execution
# =========================================================================

# Initialize log file
echo "# Deployment Log - $(date)" > "${LOG_FILE}"
log "INFO" "Logging to ${LOG_FILE}"

# Call main function with arguments
main "$@"
exit $?