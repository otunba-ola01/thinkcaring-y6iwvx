# S3 Terraform Module for HCBS Revenue Management System
# hashicorp/aws ~> 4.67.0
# This module creates and configures S3 buckets for document storage and backups
# with features like versioning, encryption, cross-region replication, and lifecycle policies.

# Variables
variable "environment" {
  description = "Deployment environment (development, staging, production)"
  type        = string
}

variable "project_name" {
  description = "Name of the project for resource naming and tagging"
  type        = string
}

variable "versioning_enabled" {
  description = "Enable versioning for S3 buckets"
  type        = bool
  default     = true
}

variable "encryption_enabled" {
  description = "Enable encryption for S3 buckets"
  type        = bool
  default     = true
}

variable "replication_enabled" {
  description = "Enable cross-region replication for S3 buckets"
  type        = bool
  default     = true
}

variable "replication_region" {
  description = "AWS region for disaster recovery replication"
  type        = string
}

variable "lifecycle_rules_enabled" {
  description = "Enable lifecycle rules for S3 buckets"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}

# Primary Document Storage Bucket
resource "aws_s3_bucket" "document_bucket" {
  bucket = "${var.project_name}-${var.environment}-documents"
  tags   = merge(var.tags, { Name = "${var.project_name}-${var.environment}-documents" })
}

# Primary Backup Storage Bucket
resource "aws_s3_bucket" "backup_bucket" {
  bucket = "${var.project_name}-${var.environment}-backups"
  tags   = merge(var.tags, { Name = "${var.project_name}-${var.environment}-backups" })
}

# Versioning for Document Bucket
resource "aws_s3_bucket_versioning" "document_bucket_versioning" {
  bucket = aws_s3_bucket.document_bucket.id
  versioning_configuration {
    status = var.versioning_enabled ? "Enabled" : "Suspended"
  }
}

# Versioning for Backup Bucket
resource "aws_s3_bucket_versioning" "backup_bucket_versioning" {
  bucket = aws_s3_bucket.backup_bucket.id
  versioning_configuration {
    status = var.versioning_enabled ? "Enabled" : "Suspended"
  }
}

# Encryption for Document Bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "document_bucket_encryption" {
  count  = var.encryption_enabled ? 1 : 0
  bucket = aws_s3_bucket.document_bucket.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Encryption for Backup Bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "backup_bucket_encryption" {
  count  = var.encryption_enabled ? 1 : 0
  bucket = aws_s3_bucket.backup_bucket.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Block Public Access for Document Bucket
resource "aws_s3_bucket_public_access_block" "document_bucket_public_access_block" {
  bucket                  = aws_s3_bucket.document_bucket.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Block Public Access for Backup Bucket
resource "aws_s3_bucket_public_access_block" "backup_bucket_public_access_block" {
  bucket                  = aws_s3_bucket.backup_bucket.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Lifecycle Configuration for Document Bucket
resource "aws_s3_bucket_lifecycle_configuration" "document_bucket_lifecycle_configuration" {
  count  = var.lifecycle_rules_enabled ? 1 : 0
  bucket = aws_s3_bucket.document_bucket.id

  rule {
    id     = "transition-to-ia"
    status = "Enabled"
    
    transition {
      days          = 90
      storage_class = "STANDARD_IA"
    }
    
    filter {
      prefix = ""
    }
  }

  rule {
    id     = "transition-to-glacier"
    status = "Enabled"
    
    transition {
      days          = 365
      storage_class = "GLACIER"
    }
    
    filter {
      prefix = ""
    }
  }

  rule {
    id     = "noncurrent-version-expiration"
    status = "Enabled"
    
    noncurrent_version_expiration {
      noncurrent_days = 90
    }
    
    filter {
      prefix = ""
    }
  }
}

# Lifecycle Configuration for Backup Bucket
resource "aws_s3_bucket_lifecycle_configuration" "backup_bucket_lifecycle_configuration" {
  count  = var.lifecycle_rules_enabled ? 1 : 0
  bucket = aws_s3_bucket.backup_bucket.id

  rule {
    id     = "transition-to-ia"
    status = "Enabled"
    
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
    
    filter {
      prefix = ""
    }
  }

  rule {
    id     = "transition-to-glacier"
    status = "Enabled"
    
    transition {
      days          = 90
      storage_class = "GLACIER"
    }
    
    filter {
      prefix = ""
    }
  }

  rule {
    id     = "expiration"
    status = "Enabled"
    
    expiration {
      days = 2555  # ~7 years retention for compliance
    }
    
    filter {
      prefix = ""
    }
  }
}

# Document Bucket Replica in DR Region
resource "aws_s3_bucket" "document_bucket_replica" {
  count    = var.replication_enabled ? 1 : 0
  provider = aws.dr
  bucket   = "${var.project_name}-${var.environment}-documents-replica"
  tags     = merge(var.tags, { Name = "${var.project_name}-${var.environment}-documents-replica" })
}

# Backup Bucket Replica in DR Region
resource "aws_s3_bucket" "backup_bucket_replica" {
  count    = var.replication_enabled ? 1 : 0
  provider = aws.dr
  bucket   = "${var.project_name}-${var.environment}-backups-replica"
  tags     = merge(var.tags, { Name = "${var.project_name}-${var.environment}-backups-replica" })
}

# Versioning for Document Bucket Replica
resource "aws_s3_bucket_versioning" "document_bucket_replica_versioning" {
  count    = var.replication_enabled ? 1 : 0
  provider = aws.dr
  bucket   = aws_s3_bucket.document_bucket_replica[0].id
  
  versioning_configuration {
    status = "Enabled"  # Versioning must be enabled for replication
  }
}

# Versioning for Backup Bucket Replica
resource "aws_s3_bucket_versioning" "backup_bucket_replica_versioning" {
  count    = var.replication_enabled ? 1 : 0
  provider = aws.dr
  bucket   = aws_s3_bucket.backup_bucket_replica[0].id
  
  versioning_configuration {
    status = "Enabled"  # Versioning must be enabled for replication
  }
}

# Encryption for Document Bucket Replica
resource "aws_s3_bucket_server_side_encryption_configuration" "document_bucket_replica_encryption" {
  count    = var.replication_enabled && var.encryption_enabled ? 1 : 0
  provider = aws.dr
  bucket   = aws_s3_bucket.document_bucket_replica[0].id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Encryption for Backup Bucket Replica
resource "aws_s3_bucket_server_side_encryption_configuration" "backup_bucket_replica_encryption" {
  count    = var.replication_enabled && var.encryption_enabled ? 1 : 0
  provider = aws.dr
  bucket   = aws_s3_bucket.backup_bucket_replica[0].id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Block Public Access for Document Bucket Replica
resource "aws_s3_bucket_public_access_block" "document_bucket_replica_public_access_block" {
  count                   = var.replication_enabled ? 1 : 0
  provider                = aws.dr
  bucket                  = aws_s3_bucket.document_bucket_replica[0].id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Block Public Access for Backup Bucket Replica
resource "aws_s3_bucket_public_access_block" "backup_bucket_replica_public_access_block" {
  count                   = var.replication_enabled ? 1 : 0
  provider                = aws.dr
  bucket                  = aws_s3_bucket.backup_bucket_replica[0].id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# IAM Role for S3 Replication
resource "aws_iam_role" "replication_role" {
  count = var.replication_enabled ? 1 : 0
  name  = "${var.project_name}-${var.environment}-s3-replication-role"
  
  assume_role_policy = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "s3.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
POLICY

  tags = var.tags
}

# IAM Policy for S3 Replication
resource "aws_iam_policy" "replication_policy" {
  count = var.replication_enabled ? 1 : 0
  name  = "${var.project_name}-${var.environment}-s3-replication-policy"
  
  policy = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetReplicationConfiguration",
        "s3:ListBucket"
      ],
      "Resource": [
        "${aws_s3_bucket.document_bucket.arn}",
        "${aws_s3_bucket.backup_bucket.arn}"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObjectVersionForReplication",
        "s3:GetObjectVersionAcl",
        "s3:GetObjectVersionTagging"
      ],
      "Resource": [
        "${aws_s3_bucket.document_bucket.arn}/*",
        "${aws_s3_bucket.backup_bucket.arn}/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ReplicateObject",
        "s3:ReplicateDelete",
        "s3:ReplicateTags"
      ],
      "Resource": [
        "${aws_s3_bucket.document_bucket_replica[0].arn}/*",
        "${aws_s3_bucket.backup_bucket_replica[0].arn}/*"
      ]
    }
  ]
}
POLICY
}

# Attach the replication policy to the replication role
resource "aws_iam_role_policy_attachment" "replication_role_policy_attachment" {
  count      = var.replication_enabled ? 1 : 0
  role       = aws_iam_role.replication_role[0].name
  policy_arn = aws_iam_policy.replication_policy[0].arn
}

# Replication Configuration for Document Bucket
resource "aws_s3_bucket_replication_configuration" "document_bucket_replication_configuration" {
  count  = var.replication_enabled ? 1 : 0
  bucket = aws_s3_bucket.document_bucket.id
  role   = aws_iam_role.replication_role[0].arn

  rule {
    id     = "document-replication"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.document_bucket_replica[0].arn
      storage_class = "STANDARD"
    }
  }

  # Replication requires that versioning be enabled on both source and destination buckets
  depends_on = [
    aws_s3_bucket_versioning.document_bucket_versioning,
    aws_s3_bucket_versioning.document_bucket_replica_versioning
  ]
}

# Replication Configuration for Backup Bucket
resource "aws_s3_bucket_replication_configuration" "backup_bucket_replication_configuration" {
  count  = var.replication_enabled ? 1 : 0
  bucket = aws_s3_bucket.backup_bucket.id
  role   = aws_iam_role.replication_role[0].arn

  rule {
    id     = "backup-replication"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.backup_bucket_replica[0].arn
      storage_class = "STANDARD"
    }
  }

  # Replication requires that versioning be enabled on both source and destination buckets
  depends_on = [
    aws_s3_bucket_versioning.backup_bucket_versioning,
    aws_s3_bucket_versioning.backup_bucket_replica_versioning
  ]
}

# Outputs
output "document_bucket_name" {
  description = "Name of the S3 bucket for document storage"
  value       = aws_s3_bucket.document_bucket.id
}

output "document_bucket_arn" {
  description = "ARN of the S3 bucket for document storage"
  value       = aws_s3_bucket.document_bucket.arn
}

output "backup_bucket_name" {
  description = "Name of the S3 bucket for backups"
  value       = aws_s3_bucket.backup_bucket.id
}

output "backup_bucket_arn" {
  description = "ARN of the S3 bucket for backups"
  value       = aws_s3_bucket.backup_bucket.arn
}

output "document_bucket_replica_name" {
  description = "Name of the replica S3 bucket for document storage in DR region"
  value       = var.replication_enabled ? aws_s3_bucket.document_bucket_replica[0].id : ""
}

output "backup_bucket_replica_name" {
  description = "Name of the replica S3 bucket for backups in DR region"
  value       = var.replication_enabled ? aws_s3_bucket.backup_bucket_replica[0].id : ""
}