# AWS ElastiCache Redis Module for HCBS Revenue Management System
# AWS Provider version: ~> 4.67.0

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.67.0"
    }
  }
}

# ---------------------------------------------------------------------------------------------------------------------
# DATA SOURCES
# ---------------------------------------------------------------------------------------------------------------------
data "aws_security_group" "app_security_group" {
  filter {
    name   = "tag:Name"
    values = ["${var.project_name}-${var.environment}-app-sg"]
  }
  filter {
    name   = "vpc-id"
    values = [var.vpc_id]
  }
}

# ---------------------------------------------------------------------------------------------------------------------
# ELASTICACHE SUBNET GROUP
# ---------------------------------------------------------------------------------------------------------------------
resource "aws_elasticache_subnet_group" "redis_subnet_group" {
  name        = "${var.project_name}-${var.environment}-redis-subnet-group"
  subnet_ids  = var.subnet_ids
  description = "Subnet group for ${var.project_name} ${var.environment} Redis cluster"

  tags = merge(
    {
      Name        = "${var.project_name}-${var.environment}-redis-subnet-group"
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "Terraform"
    },
    var.tags
  )
}

# ---------------------------------------------------------------------------------------------------------------------
# ELASTICACHE PARAMETER GROUP
# ---------------------------------------------------------------------------------------------------------------------
resource "aws_elasticache_parameter_group" "redis_parameter_group" {
  name        = "${var.project_name}-${var.environment}-redis-parameter-group"
  family      = "redis7"
  description = "Parameter group for ${var.project_name} ${var.environment} Redis cluster"

  parameter {
    name  = "maxmemory-policy"
    value = "volatile-lru"
  }

  parameter {
    name  = "notify-keyspace-events"
    value = "Ex"
  }

  tags = merge(
    {
      Name        = "${var.project_name}-${var.environment}-redis-parameter-group"
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "Terraform"
    },
    var.tags
  )
}

# ---------------------------------------------------------------------------------------------------------------------
# SECURITY GROUP FOR REDIS
# ---------------------------------------------------------------------------------------------------------------------
resource "aws_security_group" "redis_security_group" {
  name        = "${var.project_name}-${var.environment}-redis-sg"
  description = "Security group for ${var.project_name} ${var.environment} Redis cluster"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [data.aws_security_group.app_security_group.id]
    description     = "Redis access from application security group"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = merge(
    {
      Name        = "${var.project_name}-${var.environment}-redis-sg"
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "Terraform"
    },
    var.tags
  )
}

# ---------------------------------------------------------------------------------------------------------------------
# KMS KEY FOR ENCRYPTION
# ---------------------------------------------------------------------------------------------------------------------
resource "aws_kms_key" "redis_kms_key" {
  description             = "KMS key for ${var.project_name} ${var.environment} Redis encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = merge(
    {
      Name        = "${var.project_name}-${var.environment}-redis-encryption-key"
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "Terraform"
    },
    var.tags
  )
}

resource "aws_kms_alias" "redis_kms_key_alias" {
  name          = "alias/${var.project_name}-${var.environment}-redis-encryption-key"
  target_key_id = aws_kms_key.redis_kms_key.key_id
}

# ---------------------------------------------------------------------------------------------------------------------
# ELASTICACHE REPLICATION GROUP (REDIS CLUSTER)
# ---------------------------------------------------------------------------------------------------------------------
resource "aws_elasticache_replication_group" "redis_replication_group" {
  replication_group_id       = "${var.project_name}-${var.environment}-redis"
  description                = "Redis cluster for ${var.project_name} ${var.environment}"
  node_type                  = var.node_type
  num_cache_clusters         = var.num_cache_nodes
  engine                     = "redis"
  engine_version             = var.engine_version
  port                       = 6379
  parameter_group_name       = aws_elasticache_parameter_group.redis_parameter_group.name
  subnet_group_name          = aws_elasticache_subnet_group.redis_subnet_group.name
  security_group_ids         = [aws_security_group.redis_security_group.id]
  automatic_failover_enabled = var.automatic_failover_enabled
  at_rest_encryption_enabled = var.at_rest_encryption_enabled
  transit_encryption_enabled = var.transit_encryption_enabled
  kms_key_id                 = aws_kms_key.redis_kms_key.arn
  multi_az_enabled           = var.multi_az_enabled
  apply_immediately          = var.apply_immediately
  auto_minor_version_upgrade = var.auto_minor_version_upgrade
  snapshot_retention_limit   = var.snapshot_retention_limit
  snapshot_window            = var.snapshot_window
  maintenance_window         = var.maintenance_window

  tags = merge(
    {
      Name        = "${var.project_name}-${var.environment}-redis"
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "Terraform"
    },
    var.tags
  )
}

# ---------------------------------------------------------------------------------------------------------------------
# SNS TOPIC FOR ALARMS
# ---------------------------------------------------------------------------------------------------------------------
resource "aws_sns_topic" "redis_alarms" {
  name = "${var.project_name}-${var.environment}-redis-alarms"

  tags = merge(
    {
      Name        = "${var.project_name}-${var.environment}-redis-alarms"
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "Terraform"
    },
    var.tags
  )
}

# ---------------------------------------------------------------------------------------------------------------------
# CLOUDWATCH ALARMS
# ---------------------------------------------------------------------------------------------------------------------
resource "aws_cloudwatch_metric_alarm" "redis_cloudwatch_alarm_cpu" {
  alarm_name          = "${var.project_name}-${var.environment}-redis-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ElastiCache"
  period              = 300
  statistic           = "Average"
  threshold           = 75
  alarm_description   = "This metric monitors Redis CPU utilization"

  dimensions = {
    ReplicationGroupId = aws_elasticache_replication_group.redis_replication_group.id
  }

  alarm_actions = [aws_sns_topic.redis_alarms.arn]
  ok_actions    = [aws_sns_topic.redis_alarms.arn]

  tags = merge(
    {
      Name        = "${var.project_name}-${var.environment}-redis-cpu-alarm"
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "Terraform"
    },
    var.tags
  )
}

resource "aws_cloudwatch_metric_alarm" "redis_cloudwatch_alarm_memory" {
  alarm_name          = "${var.project_name}-${var.environment}-redis-memory-usage"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "DatabaseMemoryUsagePercentage"
  namespace           = "AWS/ElastiCache"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This metric monitors Redis memory usage"

  dimensions = {
    ReplicationGroupId = aws_elasticache_replication_group.redis_replication_group.id
  }

  alarm_actions = [aws_sns_topic.redis_alarms.arn]
  ok_actions    = [aws_sns_topic.redis_alarms.arn]

  tags = merge(
    {
      Name        = "${var.project_name}-${var.environment}-redis-memory-alarm"
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "Terraform"
    },
    var.tags
  )
}

resource "aws_cloudwatch_metric_alarm" "redis_cloudwatch_alarm_connections" {
  alarm_name          = "${var.project_name}-${var.environment}-redis-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CurrConnections"
  namespace           = "AWS/ElastiCache"
  period              = 300
  statistic           = "Average"
  threshold           = 5000
  alarm_description   = "This metric monitors Redis connection count"

  dimensions = {
    ReplicationGroupId = aws_elasticache_replication_group.redis_replication_group.id
  }

  alarm_actions = [aws_sns_topic.redis_alarms.arn]
  ok_actions    = [aws_sns_topic.redis_alarms.arn]

  tags = merge(
    {
      Name        = "${var.project_name}-${var.environment}-redis-connections-alarm"
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "Terraform"
    },
    var.tags
  )
}

# ---------------------------------------------------------------------------------------------------------------------
# OUTPUTS
# ---------------------------------------------------------------------------------------------------------------------
output "redis_replication_group_id" {
  description = "ID of the Redis replication group"
  value       = aws_elasticache_replication_group.redis_replication_group.id
}

output "redis_primary_endpoint" {
  description = "Primary endpoint of the Redis cluster"
  value       = aws_elasticache_replication_group.redis_replication_group.primary_endpoint_address
}

output "redis_reader_endpoint" {
  description = "Reader endpoint of the Redis cluster"
  value       = aws_elasticache_replication_group.redis_replication_group.reader_endpoint_address
}

output "redis_security_group_id" {
  description = "ID of the Redis security group"
  value       = aws_security_group.redis_security_group.id
}

output "redis_port" {
  description = "Port of the Redis cluster"
  value       = aws_elasticache_replication_group.redis_replication_group.port
}

output "redis_parameter_group_name" {
  description = "Name of the Redis parameter group"
  value       = aws_elasticache_parameter_group.redis_parameter_group.name
}