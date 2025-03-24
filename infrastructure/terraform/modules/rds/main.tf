# AWS provider version ~> 4.67.0
# Random provider version ~> 3.5.1

# Generate a random password for the RDS master user
resource "random_password" "db_password" {
  length           = 16
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# Subnet group for the RDS instance
resource "aws_db_subnet_group" "db_subnet_group" {
  name       = "${var.project_name}-${var.environment}-db-subnet-group"
  subnet_ids = var.subnet_ids
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-db-subnet-group"
    Environment = "${var.environment}"
    Project     = "${var.project_name}"
    ManagedBy   = "Terraform"
  }
}

# Parameter group for the RDS instance
resource "aws_db_parameter_group" "db_parameter_group" {
  name        = "${var.project_name}-${var.environment}-db-parameter-group"
  family      = "postgres15"
  description = "Parameter group for ${var.project_name} ${var.environment} PostgreSQL database"
  
  parameter {
    name  = "log_connections"
    value = "1"
  }
  
  parameter {
    name  = "log_disconnections"
    value = "1"
  }
  
  parameter {
    name  = "log_statement"
    value = "ddl"
  }
  
  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }
  
  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }
  
  parameter {
    name  = "pg_stat_statements.track"
    value = "ALL"
  }
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-db-parameter-group"
    Environment = "${var.environment}"
    Project     = "${var.project_name}"
    ManagedBy   = "Terraform"
  }
}

# Option group for the RDS instance
resource "aws_db_option_group" "db_option_group" {
  name                = "${var.project_name}-${var.environment}-db-option-group"
  engine_name         = "${var.engine}"
  major_engine_version = "${split(".", var.engine_version)[0]}"
  
  option = []
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-db-option-group"
    Environment = "${var.environment}"
    Project     = "${var.project_name}"
    ManagedBy   = "Terraform"
  }
}

# Get the application security group ID
data "aws_security_group" "app_security_group" {
  filter {
    name   = "tag:Name"
    values = ["${var.project_name}-${var.environment}-app-sg"]
  }
  
  filter {
    name   = "vpc-id"
    values = ["${var.vpc_id}"]
  }
}

# Security group for the RDS instance
resource "aws_security_group" "db_security_group" {
  name        = "${var.project_name}-${var.environment}-db-sg"
  description = "Security group for ${var.project_name} ${var.environment} RDS instance"
  vpc_id      = "${var.vpc_id}"
  
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = ["${data.aws_security_group.app_security_group.id}"]
    description     = "PostgreSQL access from application security group"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-db-sg"
    Environment = "${var.environment}"
    Project     = "${var.project_name}"
    ManagedBy   = "Terraform"
  }
}

# IAM role for RDS enhanced monitoring
resource "aws_iam_role" "monitoring_role" {
  name = "${var.project_name}-${var.environment}-rds-monitoring-role"
  
  assume_role_policy = "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Principal\":{\"Service\":\"monitoring.rds.amazonaws.com\"},\"Action\":\"sts:AssumeRole\"}]}"
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-rds-monitoring-role"
    Environment = "${var.environment}"
    Project     = "${var.project_name}"
    ManagedBy   = "Terraform"
  }
}

# Attach the RDS monitoring policy to the monitoring role
resource "aws_iam_role_policy_attachment" "monitoring_role_policy_attachment" {
  role       = "${aws_iam_role.monitoring_role.name}"
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# KMS key for RDS encryption
resource "aws_kms_key" "db_encryption_key" {
  description             = "KMS key for ${var.project_name} ${var.environment} RDS encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-db-encryption-key"
    Environment = "${var.environment}"
    Project     = "${var.project_name}"
    ManagedBy   = "Terraform"
  }
}

# Alias for the KMS key
resource "aws_kms_alias" "db_encryption_key_alias" {
  name          = "alias/${var.project_name}-${var.environment}-db-encryption-key"
  target_key_id = "${aws_kms_key.db_encryption_key.key_id}"
}

# RDS PostgreSQL instance for the application
resource "aws_db_instance" "db_instance" {
  identifier                  = "${var.project_name}-${var.environment}-db"
  engine                      = "${var.engine}"
  engine_version              = "${var.engine_version}"
  instance_class              = "${var.instance_class}"
  allocated_storage           = "${var.allocated_storage}"
  max_allocated_storage       = "${var.max_allocated_storage}"
  storage_type                = "gp3"
  storage_encrypted           = true
  kms_key_id                  = "${aws_kms_key.db_encryption_key.arn}"
  db_name                     = "${replace(var.project_name, "-", "_")}_${var.environment}"
  username                    = "dbadmin"
  password                    = "${random_password.db_password.result}"
  port                        = 5432
  multi_az                    = "${var.multi_az}"
  db_subnet_group_name        = "${aws_db_subnet_group.db_subnet_group.name}"
  vpc_security_group_ids      = ["${aws_security_group.db_security_group.id}"]
  parameter_group_name        = "${aws_db_parameter_group.db_parameter_group.name}"
  option_group_name           = "${aws_db_option_group.db_option_group.name}"
  backup_retention_period     = "${var.backup_retention_period}"
  backup_window               = "03:00-05:00"
  maintenance_window          = "sun:05:00-sun:07:00"
  deletion_protection         = "${var.deletion_protection}"
  skip_final_snapshot         = "${var.skip_final_snapshot}"
  final_snapshot_identifier   = "${var.project_name}-${var.environment}-db-final-snapshot"
  apply_immediately           = "${var.apply_immediately}"
  auto_minor_version_upgrade  = true
  monitoring_interval         = "${var.monitoring_interval}"
  monitoring_role_arn         = "${aws_iam_role.monitoring_role.arn}"
  performance_insights_enabled = "${var.performance_insights_enabled}"
  performance_insights_kms_key_id = "${aws_kms_key.db_encryption_key.arn}"
  performance_insights_retention_period = "${var.performance_insights_retention_period}"
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  copy_tags_to_snapshot       = true
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-db"
    Environment = "${var.environment}"
    Project     = "${var.project_name}"
    ManagedBy   = "Terraform"
  }
}

# Store database credentials in Secrets Manager
resource "aws_secretsmanager_secret" "db_secret" {
  name        = "${var.project_name}/${var.environment}/db-credentials"
  description = "Database credentials for ${var.project_name} ${var.environment}"
  kms_key_id  = "${aws_kms_key.db_encryption_key.arn}"
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-db-credentials"
    Environment = "${var.environment}"
    Project     = "${var.project_name}"
    ManagedBy   = "Terraform"
  }
}

# Store the current version of database credentials
resource "aws_secretsmanager_secret_version" "db_secret_version" {
  secret_id = "${aws_secretsmanager_secret.db_secret.id}"
  secret_string = "{\"username\":\"dbadmin\",\"password\":\"${random_password.db_password.result}\",\"engine\":\"${var.engine}\",\"host\":\"${aws_db_instance.db_instance.endpoint}\",\"port\":5432,\"dbname\":\"${replace(var.project_name, "-", "_")}_${var.environment}\"}"
}

# Define outputs
output "db_instance_id" {
  description = "ID of the RDS instance"
  value       = "${aws_db_instance.db_instance.id}"
}

output "db_instance_endpoint" {
  description = "Endpoint of the RDS instance"
  value       = "${aws_db_instance.db_instance.endpoint}"
}

output "db_instance_arn" {
  description = "ARN of the RDS instance"
  value       = "${aws_db_instance.db_instance.arn}"
}

output "db_subnet_group_name" {
  description = "Name of the DB subnet group"
  value       = "${aws_db_subnet_group.db_subnet_group.name}"
}

output "db_security_group_id" {
  description = "ID of the DB security group"
  value       = "${aws_security_group.db_security_group.id}"
}

output "db_secret_arn" {
  description = "ARN of the DB credentials secret"
  value       = "${aws_secretsmanager_secret.db_secret.arn}"
}

variable "environment" {
  description = "Deployment environment (development, staging, production)"
  type        = string
}

variable "project_name" {
  description = "Name of the project for resource naming and tagging"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC where the RDS instance will be deployed"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs for the DB subnet group"
  type        = list(string)
}

variable "engine" {
  description = "Database engine type"
  type        = string
  default     = "postgres"
}

variable "engine_version" {
  description = "Database engine version"
  type        = string
  default     = "15.3"
}

variable "instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.m5.2xlarge"
}

variable "allocated_storage" {
  description = "Initial storage allocation for RDS in GB"
  type        = number
  default     = 100
}

variable "max_allocated_storage" {
  description = "Maximum storage allocation for RDS in GB"
  type        = number
  default     = 1000
}

variable "multi_az" {
  description = "Enable Multi-AZ deployment for RDS"
  type        = bool
  default     = true
}

variable "backup_retention_period" {
  description = "Number of days to retain database backups"
  type        = number
  default     = 30
}

variable "deletion_protection" {
  description = "Enable deletion protection for the RDS instance"
  type        = bool
  default     = true
}

variable "skip_final_snapshot" {
  description = "Skip final snapshot when deleting the RDS instance"
  type        = bool
  default     = false
}

variable "apply_immediately" {
  description = "Apply changes immediately or during maintenance window"
  type        = bool
  default     = false
}

variable "monitoring_interval" {
  description = "Interval in seconds for enhanced monitoring"
  type        = number
  default     = 60
}

variable "performance_insights_enabled" {
  description = "Enable Performance Insights for RDS"
  type        = bool
  default     = true
}

variable "performance_insights_retention_period" {
  description = "Retention period for Performance Insights in days"
  type        = number
  default     = 7
}

variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}

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
  required_version = ">= 1.0.0"
}