# Network Outputs
output "vpc_id" {
  description = "ID of the VPC created for the HCBS Revenue Management System"
  value       = module.networking.vpc_id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = module.networking.vpc_cidr_block
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = module.networking.public_subnet_ids
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = module.networking.private_subnet_ids
}

output "data_subnet_ids" {
  description = "List of data subnet IDs"
  value       = module.networking.data_subnet_ids
}

output "integration_subnet_ids" {
  description = "List of integration subnet IDs"
  value       = module.networking.integration_subnet_ids
}

output "public_security_group_id" {
  description = "ID of the security group for public-facing resources"
  value       = module.networking.public_security_group_id
}

output "app_security_group_id" {
  description = "ID of the security group for application tier resources"
  value       = module.networking.app_security_group_id
}

output "data_security_group_id" {
  description = "ID of the security group for data tier resources"
  value       = module.networking.data_security_group_id
}

output "integration_security_group_id" {
  description = "ID of the security group for integration resources"
  value       = module.networking.integration_security_group_id
}

# EKS Cluster Outputs
output "eks_cluster_name" {
  description = "Name of the EKS cluster"
  value       = module.eks.cluster_name
}

output "eks_cluster_endpoint" {
  description = "Endpoint URL of the EKS cluster"
  value       = module.eks.cluster_endpoint
}

output "eks_cluster_certificate_authority_data" {
  description = "Certificate authority data for the EKS cluster"
  value       = module.eks.cluster_certificate_authority_data
}

output "eks_cluster_security_group_id" {
  description = "ID of the security group for the EKS cluster"
  value       = module.eks.cluster_security_group_id
}

output "eks_node_security_group_id" {
  description = "ID of the security group for the EKS node groups"
  value       = module.eks.node_security_group_id
}

output "eks_oidc_provider_arn" {
  description = "ARN of the OIDC provider for the EKS cluster"
  value       = module.eks.oidc_provider_arn
}

# Database Outputs
output "db_endpoint" {
  description = "Endpoint of the RDS PostgreSQL instance"
  value       = module.rds.db_instance_endpoint
}

output "db_instance_id" {
  description = "ID of the RDS PostgreSQL instance"
  value       = module.rds.db_instance_id
}

output "db_instance_arn" {
  description = "ARN of the RDS PostgreSQL instance"
  value       = module.rds.db_instance_arn
}

output "db_security_group_id" {
  description = "ID of the security group for the RDS PostgreSQL instance"
  value       = module.rds.db_security_group_id
}

output "db_password_secret_arn" {
  description = "ARN of the Secrets Manager secret containing the database password"
  value       = module.rds.db_password_secret_arn
}

# ElastiCache Redis Outputs
output "redis_endpoint" {
  description = "Endpoint of the ElastiCache Redis cluster"
  value       = module.elasticache.redis_endpoint
}

output "redis_port" {
  description = "Port number for the ElastiCache Redis cluster"
  value       = module.elasticache.redis_port
}

output "redis_security_group_id" {
  description = "ID of the security group for the ElastiCache Redis cluster"
  value       = module.elasticache.redis_security_group_id
}

output "redis_replication_group_id" {
  description = "ID of the ElastiCache Redis replication group"
  value       = module.elasticache.redis_replication_group_id
}

# S3 Storage Outputs
output "document_bucket_name" {
  description = "Name of the S3 bucket for document storage"
  value       = module.s3.document_bucket_name
}

output "document_bucket_arn" {
  description = "ARN of the S3 bucket for document storage"
  value       = module.s3.document_bucket_arn
}

output "backup_bucket_name" {
  description = "Name of the S3 bucket for backups"
  value       = module.s3.backup_bucket_name
}

output "backup_bucket_arn" {
  description = "ARN of the S3 bucket for backups"
  value       = module.s3.backup_bucket_arn
}

output "document_bucket_replica_name" {
  description = "Name of the replica S3 bucket for document storage in DR region"
  value       = module.s3.document_bucket_replica_name
}

output "backup_bucket_replica_name" {
  description = "Name of the replica S3 bucket for backups in DR region"
  value       = module.s3.backup_bucket_replica_name
}

# Kubernetes Configuration
output "kubeconfig" {
  description = "Generated kubeconfig content for Kubernetes CLI access"
  value       = <<KUBECONFIG
apiVersion: v1
kind: Config
clusters:
- cluster:
    server: ${module.eks.cluster_endpoint}
    certificate-authority-data: ${module.eks.cluster_certificate_authority_data}
  name: ${module.eks.cluster_name}
contexts:
- context:
    cluster: ${module.eks.cluster_name}
    user: ${module.eks.cluster_name}
  name: ${module.eks.cluster_name}
current-context: ${module.eks.cluster_name}
users:
- name: ${module.eks.cluster_name}
  user:
    exec:
      apiVersion: client.authentication.k8s.io/v1beta1
      command: aws
      args:
      - eks
      - get-token
      - --cluster-name
      - ${module.eks.cluster_name}
      - --region
      - ${var.aws_region}
KUBECONFIG
  sensitive   = true
}