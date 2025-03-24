# =============================================================================
# General Project Variables
# =============================================================================

variable "project_name" {
  description = "Name of the project for resource naming and tagging"
  type        = string
  default     = "thinkcaring"
}

variable "environment" {
  description = "Deployment environment (development, staging, production)"
  type        = string
  default     = "development"
  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Valid values for environment are development, staging, or production."
  }
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

# =============================================================================
# AWS Configuration Variables
# =============================================================================

variable "aws_region" {
  description = "AWS region for primary deployment"
  type        = string
  default     = "us-east-1"
}

variable "dr_region" {
  description = "AWS region for disaster recovery"
  type        = string
  default     = "us-west-2"
}

variable "aws_profile" {
  description = "AWS profile to use for authentication"
  type        = string
  default     = "default"
}

# =============================================================================
# Networking Variables
# =============================================================================

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones to use for multi-AZ deployment"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

# =============================================================================
# Kubernetes (EKS) Variables
# =============================================================================

variable "eks_cluster_version" {
  description = "Kubernetes version for the EKS cluster"
  type        = string
  default     = "1.27"
}

variable "eks_node_group_instance_types" {
  description = "EC2 instance types for the EKS node groups"
  type        = list(string)
  default     = ["m5.xlarge"]
}

variable "eks_node_group_min_size" {
  description = "Minimum number of nodes in the EKS node group"
  type        = number
  default     = 3
}

variable "eks_node_group_max_size" {
  description = "Maximum number of nodes in the EKS node group"
  type        = number
  default     = 10
}

variable "eks_node_group_desired_size" {
  description = "Desired number of nodes in the EKS node group"
  type        = number
  default     = 3
}

# =============================================================================
# Database (RDS) Variables
# =============================================================================

variable "db_engine" {
  description = "Database engine type"
  type        = string
  default     = "postgres"
}

variable "db_engine_version" {
  description = "Database engine version"
  type        = string
  default     = "15.3"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.m5.2xlarge"
}

variable "db_allocated_storage" {
  description = "Initial storage allocation for RDS in GB"
  type        = number
  default     = 100
}

variable "db_max_allocated_storage" {
  description = "Maximum storage allocation for RDS in GB"
  type        = number
  default     = 1000
}

variable "db_multi_az" {
  description = "Enable Multi-AZ deployment for RDS"
  type        = bool
  default     = true
}

variable "db_backup_retention_period" {
  description = "Number of days to retain database backups"
  type        = number
  default     = 30
}

# =============================================================================
# ElastiCache (Redis) Variables
# =============================================================================

variable "redis_node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.m5.large"
}

variable "redis_engine_version" {
  description = "ElastiCache Redis engine version"
  type        = string
  default     = "7.0"
}

variable "redis_num_cache_nodes" {
  description = "Number of nodes in the ElastiCache Redis cluster"
  type        = number
  default     = 2
}

# =============================================================================
# Storage (S3) Variables
# =============================================================================

variable "s3_versioning_enabled" {
  description = "Enable versioning for S3 buckets"
  type        = bool
  default     = true
}

variable "s3_encryption_enabled" {
  description = "Enable encryption for S3 buckets"
  type        = bool
  default     = true
}

variable "s3_replication_enabled" {
  description = "Enable cross-region replication for S3 buckets"
  type        = bool
  default     = true
}

variable "s3_lifecycle_rules_enabled" {
  description = "Enable lifecycle rules for S3 buckets"
  type        = bool
  default     = true
}

# =============================================================================
# Content Delivery and Security Variables
# =============================================================================

variable "enable_cloudfront" {
  description = "Enable CloudFront distribution for content delivery"
  type        = bool
  default     = true
}

variable "enable_waf" {
  description = "Enable WAF Web ACL for application protection"
  type        = bool
  default     = true
}

# =============================================================================
# DNS, Monitoring, and Logs Variables
# =============================================================================

variable "enable_route53" {
  description = "Enable Route53 for DNS management"
  type        = bool
  default     = true
}

variable "enable_monitoring" {
  description = "Enable CloudWatch monitoring and alerting"
  type        = bool
  default     = true
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "app.thinkcaring.com"
}

variable "log_retention_days" {
  description = "Number of days to retain CloudWatch logs"
  type        = number
  default     = 90
}