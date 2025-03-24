# ==============================================================================
# Development Environment Configuration for HCBS Revenue Management System
# ==============================================================================

terraform {
  backend "s3" {
    bucket         = "thinkcaring-development-terraform-state"
    key            = "development/terraform.tfstate"
    region         = "us-east-1"
    profile        = "default"
    encrypt        = true
    dynamodb_table = "thinkcaring-development-terraform-locks"
  }
}

# Configure terraform providers
provider "aws" {
  region  = var.aws_region
  profile = var.aws_profile
  
  default_tags {
    tags = {
      Environment = "development"
      Project     = "thinkcaring"
      ManagedBy   = "Terraform"
    }
  }
}

provider "aws" {
  alias   = "dr"
  region  = var.dr_region
  profile = var.aws_profile
  
  default_tags {
    tags = {
      Environment = "development"
      Project     = "thinkcaring"
      ManagedBy   = "Terraform"
    }
  }
}

provider "random" {}

# Development environment configuration
locals {
  environment_config = {
    vpc_cidr = "10.0.0.0/16"
    availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
    
    # EKS configuration - smaller instances for development
    eks_node_group_min_size = 2
    eks_node_group_max_size = 5
    eks_node_group_desired_size = 2
    eks_node_group_instance_types = ["m5.large"]
    
    # RDS configuration - smaller instance for development
    db_instance_class = "db.t3.medium"
    db_allocated_storage = 50
    db_max_allocated_storage = 200
    db_multi_az = false
    
    # Redis configuration - smaller instance for development
    redis_node_type = "cache.t3.medium"
    redis_num_cache_nodes = 1
    redis_multi_az_enabled = false
    
    # Feature flags - disable some features in development
    enable_waf = false
    enable_cloudfront = false
    
    # Logging - shorter retention for development
    log_retention_days = 30
  }
}

# Variables
variable "project_name" {
  type        = string
  description = "Name of the project for resource naming and tagging"
  default     = "thinkcaring"
}

variable "environment" {
  type        = string
  description = "Deployment environment"
  default     = "development"
}

variable "aws_region" {
  type        = string
  description = "AWS region for primary deployment"
  default     = "us-east-1"
}

variable "dr_region" {
  type        = string
  description = "AWS region for disaster recovery"
  default     = "us-west-2"
}

variable "aws_profile" {
  type        = string
  description = "AWS profile to use for authentication"
  default     = "default"
}

variable "tags" {
  type        = map(string)
  description = "Additional tags to apply to all resources"
  default     = {
    Environment = "development"
    Project     = "thinkcaring"
    ManagedBy   = "Terraform"
  }
}

# Networking module
module "networking" {
  source = "../../modules/networking"
  
  environment        = "development"
  project_name       = var.project_name
  vpc_cidr           = local.environment_config.vpc_cidr
  availability_zones = local.environment_config.availability_zones
  tags               = var.tags
}

# EKS module
module "eks" {
  source = "../../modules/eks"
  
  environment               = "development"
  project_name              = var.project_name
  vpc_id                    = module.networking.vpc_id
  subnet_ids                = module.networking.private_subnet_ids
  cluster_version           = "1.27"
  node_group_instance_types = local.environment_config.eks_node_group_instance_types
  node_group_min_size       = local.environment_config.eks_node_group_min_size
  node_group_max_size       = local.environment_config.eks_node_group_max_size
  node_group_desired_size   = local.environment_config.eks_node_group_desired_size
  tags                      = var.tags
}

# RDS module
module "rds" {
  source = "../../modules/rds"
  
  environment                          = "development"
  project_name                         = var.project_name
  vpc_id                               = module.networking.vpc_id
  subnet_ids                           = module.networking.data_subnet_ids
  engine                               = "postgres"
  engine_version                       = "15.3"
  instance_class                       = local.environment_config.db_instance_class
  allocated_storage                    = local.environment_config.db_allocated_storage
  max_allocated_storage                = local.environment_config.db_max_allocated_storage
  multi_az                             = local.environment_config.db_multi_az
  backup_retention_period              = 7
  deletion_protection                  = false
  skip_final_snapshot                  = true
  apply_immediately                    = true
  monitoring_interval                  = 60
  performance_insights_enabled         = true
  performance_insights_retention_period = 7
  tags                                 = var.tags
}

# ElastiCache module
module "elasticache" {
  source = "../../modules/elasticache"
  
  environment                = "development"
  project_name               = var.project_name
  vpc_id                     = module.networking.vpc_id
  subnet_ids                 = module.networking.data_subnet_ids
  node_type                  = local.environment_config.redis_node_type
  engine_version             = "7.0"
  num_cache_nodes            = local.environment_config.redis_num_cache_nodes
  automatic_failover_enabled = false
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  multi_az_enabled           = local.environment_config.redis_multi_az_enabled
  apply_immediately          = true
  auto_minor_version_upgrade = true
  snapshot_retention_limit   = 3
  snapshot_window            = "03:00-05:00"
  maintenance_window         = "sun:05:00-sun:07:00"
  tags                       = var.tags
}

# S3 module
module "s3" {
  source = "../../modules/s3"
  
  environment             = "development"
  project_name            = var.project_name
  versioning_enabled      = true
  encryption_enabled      = true
  replication_enabled     = false
  replication_region      = var.dr_region
  lifecycle_rules_enabled = true
  tags                    = var.tags
  
  providers = {
    aws.dr = aws.dr
  }
}

# Monitoring module
module "monitoring" {
  source = "../../modules/monitoring"
  
  environment               = "development"
  project_name              = var.project_name
  vpc_id                    = module.networking.vpc_id
  eks_cluster_name          = module.eks.cluster_name
  db_instance_id            = module.rds.db_instance_id
  redis_replication_group_id = module.elasticache.redis_replication_group_id
  log_retention_days        = local.environment_config.log_retention_days
  tags                      = var.tags
}

# Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.networking.vpc_id
}

output "eks_cluster_name" {
  description = "Name of the EKS cluster"
  value       = module.eks.cluster_name
}

output "eks_cluster_endpoint" {
  description = "Endpoint of the EKS cluster"
  value       = module.eks.cluster_endpoint
}

output "db_instance_endpoint" {
  description = "Endpoint of the RDS instance"
  value       = module.rds.db_instance_endpoint
}

output "redis_endpoint" {
  description = "Endpoint of the ElastiCache Redis cluster"
  value       = module.elasticache.redis_endpoint
}

output "document_bucket_name" {
  description = "Name of the S3 bucket for document storage"
  value       = module.s3.document_bucket_name
}

output "backup_bucket_name" {
  description = "Name of the S3 bucket for backups"
  value       = module.s3.backup_bucket_name
}