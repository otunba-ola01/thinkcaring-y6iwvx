# ==============================================================================
# Main Terraform configuration file for HCBS Revenue Management System
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
  # Note: In actual usage, variables cannot be used in the backend configuration
  # This is for illustration - use terraform init -backend-config options or hardcode actual values
  backend "s3" {
    bucket         = "thinkcaring-development-terraform-state"
    key            = "terraform.tfstate"
    region         = "us-east-1"
    profile        = "default"
    encrypt        = true
    dynamodb_table = "thinkcaring-development-terraform-locks"
  }
}

# Primary region provider
provider "aws" {
  region  = var.aws_region
  profile = var.aws_profile
  
  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
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
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "Terraform"
    }
  }
}

# Random provider for generating unique identifiers
provider "random" {}

# Data sources
data "aws_region" "current_region" {}
data "aws_caller_identity" "current_caller_identity" {}

# Define common tags as local variables
locals {
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# ==============================================================================
# Infrastructure Modules
# ==============================================================================

# Networking module: VPC, subnets, security groups, etc.
module "networking" {
  source = "./modules/networking"
  
  environment        = var.environment
  project_name       = var.project_name
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  tags               = var.tags
}

# EKS module: Kubernetes cluster and node groups
module "eks" {
  source = "./modules/eks"
  
  environment               = var.environment
  project_name              = var.project_name
  vpc_id                    = module.networking.vpc_id
  subnet_ids                = module.networking.private_subnet_ids
  cluster_version           = var.eks_cluster_version
  node_group_instance_types = var.eks_node_group_instance_types
  node_group_min_size       = var.eks_node_group_min_size
  node_group_max_size       = var.eks_node_group_max_size
  node_group_desired_size   = var.eks_node_group_desired_size
  tags                      = var.tags
}

# RDS module: PostgreSQL database
module "rds" {
  source = "./modules/rds"
  
  environment                        = var.environment
  project_name                       = var.project_name
  vpc_id                             = module.networking.vpc_id
  subnet_ids                         = module.networking.data_subnet_ids
  engine                             = var.db_engine
  engine_version                     = var.db_engine_version
  instance_class                     = var.db_instance_class
  allocated_storage                  = var.db_allocated_storage
  max_allocated_storage              = var.db_max_allocated_storage
  multi_az                           = var.db_multi_az
  backup_retention_period            = var.db_backup_retention_period
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
  source = "./modules/elasticache"
  
  environment                 = var.environment
  project_name                = var.project_name
  vpc_id                      = module.networking.vpc_id
  subnet_ids                  = module.networking.data_subnet_ids
  node_type                   = var.redis_node_type
  engine_version              = var.redis_engine_version
  num_cache_nodes             = var.redis_num_cache_nodes
  automatic_failover_enabled  = true
  at_rest_encryption_enabled  = true
  transit_encryption_enabled  = true
  multi_az_enabled            = true
  apply_immediately           = false
  auto_minor_version_upgrade  = true
  snapshot_retention_limit    = 7
  snapshot_window             = "03:00-05:00"
  maintenance_window          = "sun:05:00-sun:07:00"
  tags                        = var.tags
}

# S3 module: Document storage and backups
module "s3" {
  source = "./modules/s3"
  
  environment            = var.environment
  project_name           = var.project_name
  versioning_enabled     = var.s3_versioning_enabled
  encryption_enabled     = var.s3_encryption_enabled
  replication_enabled    = var.s3_replication_enabled
  replication_region     = var.dr_region
  lifecycle_rules_enabled = var.s3_lifecycle_rules_enabled
  tags                   = var.tags
  
  providers = {
    aws.dr = aws.dr
  }
}

# CloudFront module: Content delivery network
module "cloudfront" {
  count  = var.enable_cloudfront ? 1 : 0
  source = "./modules/cloudfront"
  
  environment     = var.environment
  project_name    = var.project_name
  domain_name     = var.domain_name
  s3_origin_bucket = module.s3.document_bucket_name
  enable_waf      = var.enable_waf
  tags            = var.tags
}

# WAF module: Web Application Firewall
module "waf" {
  count  = var.enable_waf ? 1 : 0
  source = "./modules/waf"
  
  environment               = var.environment
  project_name              = var.project_name
  cloudfront_distribution_arn = var.enable_cloudfront ? module.cloudfront[0].distribution_arn : ""
  tags                      = var.tags
}

# Route53 module: DNS management
module "route53" {
  count  = var.enable_route53 ? 1 : 0
  source = "./modules/route53"
  
  environment           = var.environment
  project_name          = var.project_name
  domain_name           = var.domain_name
  cloudfront_domain_name = var.enable_cloudfront ? module.cloudfront[0].domain_name : ""
  tags                  = var.tags
}

# Monitoring module: CloudWatch dashboards, alarms, and logs
module "monitoring" {
  count  = var.enable_monitoring ? 1 : 0
  source = "./modules/monitoring"
  
  environment              = var.environment
  project_name             = var.project_name
  vpc_id                   = module.networking.vpc_id
  eks_cluster_name         = module.eks.cluster_name
  db_instance_id           = module.rds.db_instance_id
  redis_replication_group_id = module.elasticache.redis_replication_group_id
  log_retention_days       = var.log_retention_days
  tags                     = var.tags
}