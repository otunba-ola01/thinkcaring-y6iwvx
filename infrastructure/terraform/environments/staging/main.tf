# ==============================================================================
# Staging Environment Configuration for HCBS Revenue Management System
# ==============================================================================

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.67.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5.1"
    }
  }

  # S3 backend for state management
  backend "s3" {
    bucket         = "thinkcaring-staging-terraform-state"
    key            = "staging/terraform.tfstate"
    region         = "us-east-1"
    profile        = "default"
    encrypt        = true
    dynamodb_table = "thinkcaring-staging-terraform-locks"
  }
}

# Primary region provider
provider "aws" {
  region  = var.aws_region
  profile = var.aws_profile
  
  default_tags {
    tags = {
      Environment = "staging"
      Project     = "thinkcaring"
      ManagedBy   = "Terraform"
    }
  }
}

# Disaster recovery region provider
provider "aws" {
  alias   = "dr"
  region  = var.dr_region
  profile = var.aws_profile
  
  default_tags {
    tags = {
      Environment = "staging"
      Project     = "thinkcaring"
      ManagedBy   = "Terraform"
    }
  }
}

# Random provider for generating unique identifiers
provider "random" {}

# Environment-specific configuration
locals {
  environment_config = {
    # VPC Configuration
    vpc_cidr = "10.0.0.0/16"
    availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
    
    # EKS Configuration - sized for staging environment
    eks_node_group_min_size = 2
    eks_node_group_max_size = 6
    eks_node_group_desired_size = 3
    eks_node_group_instance_types = ["m5.xlarge"] # 4 vCPU, 16GB RAM
    
    # RDS Configuration - sized for staging environment
    db_instance_class = "db.m5.large"
    db_allocated_storage = 250
    db_max_allocated_storage = 500
    db_multi_az = true
    
    # ElastiCache Configuration
    redis_node_type = "cache.m5.large"
    redis_num_cache_nodes = 2
    redis_multi_az_enabled = true
    
    # Security and Content Delivery
    enable_waf = true
    enable_cloudfront = true
    
    # Monitoring and Logs
    log_retention_days = 60
  }
}

# ==============================================================================
# Infrastructure Modules
# ==============================================================================

# Networking module: VPC, subnets, security groups, etc.
module "networking" {
  source = "../../modules/networking"
  
  environment        = "staging"
  project_name       = var.project_name
  vpc_cidr           = local.environment_config.vpc_cidr
  availability_zones = local.environment_config.availability_zones
  tags               = var.tags
}

# EKS module: Kubernetes cluster and node groups
module "eks" {
  source = "../../modules/eks"
  
  environment               = "staging"
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

# RDS module: PostgreSQL database
module "rds" {
  source = "../../modules/rds"
  
  environment                        = "staging"
  project_name                       = var.project_name
  vpc_id                             = module.networking.vpc_id
  subnet_ids                         = module.networking.data_subnet_ids
  engine                             = "postgres"
  engine_version                     = "15.3"
  instance_class                     = local.environment_config.db_instance_class
  allocated_storage                  = local.environment_config.db_allocated_storage
  max_allocated_storage              = local.environment_config.db_max_allocated_storage
  multi_az                           = local.environment_config.db_multi_az
  backup_retention_period            = 14
  deletion_protection                = true
  skip_final_snapshot                = false
  apply_immediately                  = false
  monitoring_interval                = 60
  performance_insights_enabled       = true
  performance_insights_retention_period = 7
  tags                               = var.tags
}

# ElastiCache module: Redis cache
module "elasticache" {
  source = "../../modules/elasticache"
  
  environment                 = "staging"
  project_name                = var.project_name
  vpc_id                      = module.networking.vpc_id
  subnet_ids                  = module.networking.data_subnet_ids
  node_type                   = local.environment_config.redis_node_type
  engine_version              = "7.0"
  num_cache_nodes             = local.environment_config.redis_num_cache_nodes
  automatic_failover_enabled  = true
  at_rest_encryption_enabled  = true
  transit_encryption_enabled  = true
  multi_az_enabled            = local.environment_config.redis_multi_az_enabled
  apply_immediately           = false
  auto_minor_version_upgrade  = true
  snapshot_retention_limit    = 7
  snapshot_window             = "03:00-05:00"
  maintenance_window          = "sun:05:00-sun:07:00"
  tags                        = var.tags
}

# S3 module: Document storage and backups
module "s3" {
  source = "../../modules/s3"
  
  environment            = "staging"
  project_name           = var.project_name
  versioning_enabled     = true
  encryption_enabled     = true
  replication_enabled    = true
  replication_region     = var.dr_region
  lifecycle_rules_enabled = true
  tags                   = var.tags
  
  providers = {
    aws.dr = aws.dr
  }
}

# CloudFront module: Content delivery network
module "cloudfront" {
  count  = local.environment_config.enable_cloudfront ? 1 : 0
  source = "../../modules/cloudfront"
  
  environment     = "staging"
  project_name    = var.project_name
  domain_name     = "staging.thinkcaring.com"
  s3_origin_bucket = module.s3.document_bucket_name
  enable_waf      = local.environment_config.enable_waf
  tags            = var.tags
}

# WAF module: Web Application Firewall
module "waf" {
  count  = local.environment_config.enable_waf ? 1 : 0
  source = "../../modules/waf"
  
  environment               = "staging"
  project_name              = var.project_name
  cloudfront_distribution_arn = local.environment_config.enable_cloudfront ? module.cloudfront[0].distribution_arn : ""
  tags                      = var.tags
}

# Route53 module: DNS management
module "route53" {
  count  = local.environment_config.enable_cloudfront ? 1 : 0
  source = "../../modules/route53"
  
  environment           = "staging"
  project_name          = var.project_name
  domain_name           = "staging.thinkcaring.com"
  cloudfront_domain_name = local.environment_config.enable_cloudfront ? module.cloudfront[0].domain_name : ""
  tags                  = var.tags
}

# Monitoring module: CloudWatch dashboards, alarms, and logs
module "monitoring" {
  source = "../../modules/monitoring"
  
  environment              = "staging"
  project_name             = var.project_name
  vpc_id                   = module.networking.vpc_id
  eks_cluster_name         = module.eks.cluster_name
  db_instance_id           = module.rds.db_instance_id
  redis_replication_group_id = module.elasticache.redis_replication_group_id
  log_retention_days       = local.environment_config.log_retention_days
  tags                     = var.tags
}

# ==============================================================================
# Outputs
# ==============================================================================

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

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = local.environment_config.enable_cloudfront ? module.cloudfront[0].distribution_id : ""
}

output "application_url" {
  description = "URL of the application"
  value       = local.environment_config.enable_cloudfront ? "https://staging.thinkcaring.com" : ""
}