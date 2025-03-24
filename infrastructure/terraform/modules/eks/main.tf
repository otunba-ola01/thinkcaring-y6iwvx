# EKS Cluster Module for HCBS Revenue Management System
# This module provisions and configures an Amazon EKS cluster with multiple node groups
# for different workload types, along with necessary IAM roles and security configurations.

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.67.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.20.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0.4"
    }
  }
}

# Data sources
data "aws_caller_identity" "current" {}

data "tls_certificate" "eks_oidc_certificate" {
  url = "${aws_eks_cluster.eks_cluster.identity[0].oidc[0].issuer}"
}

# Local variables
locals {
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# IAM role for EKS cluster
resource "aws_iam_role" "eks_cluster_role" {
  name = "${var.project_name}-${var.environment}-eks-cluster-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "eks.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-eks-cluster-role"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# Attach required policies to EKS cluster role
resource "aws_iam_role_policy_attachment" "eks_cluster_policy_attachment" {
  role       = aws_iam_role.eks_cluster_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
}

resource "aws_iam_role_policy_attachment" "eks_vpc_resource_controller_policy_attachment" {
  role       = aws_iam_role.eks_cluster_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSVPCResourceController"
}

# Security group for EKS cluster
resource "aws_security_group" "eks_cluster_security_group" {
  name        = "${var.project_name}-${var.environment}-eks-cluster-sg"
  description = "Security group for the EKS cluster"
  vpc_id      = var.vpc_id
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-eks-cluster-sg"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# KMS key for EKS cluster encryption
resource "aws_kms_key" "eks_encryption_key" {
  description             = "KMS key for EKS cluster encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Effect = "Allow"
        Principal = {
          Service = "eks.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-eks-encryption-key"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

resource "aws_kms_alias" "eks_encryption_key_alias" {
  name          = "alias/${var.project_name}-${var.environment}-eks-encryption-key"
  target_key_id = aws_kms_key.eks_encryption_key.key_id
}

# EKS cluster
resource "aws_eks_cluster" "eks_cluster" {
  name     = "${var.project_name}-${var.environment}"
  role_arn = aws_iam_role.eks_cluster_role.arn
  version  = var.cluster_version
  
  enabled_cluster_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]
  
  vpc_config {
    subnet_ids              = var.subnet_ids
    security_group_ids      = [aws_security_group.eks_cluster_security_group.id]
    endpoint_private_access = true
    endpoint_public_access  = true
    public_access_cidrs     = ["0.0.0.0/0"]
  }
  
  encryption_config {
    provider {
      key_arn = aws_kms_key.eks_encryption_key.arn
    }
    resources = ["secrets"]
  }
  
  tags = {
    Name        = "${var.project_name}-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# IAM role for EKS node groups
resource "aws_iam_role" "eks_node_role" {
  name = "${var.project_name}-${var.environment}-eks-node-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-eks-node-role"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# Attach required policies to EKS node role
resource "aws_iam_role_policy_attachment" "eks_worker_node_policy_attachment" {
  role       = aws_iam_role.eks_node_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
}

resource "aws_iam_role_policy_attachment" "eks_cni_policy_attachment" {
  role       = aws_iam_role.eks_node_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
}

resource "aws_iam_role_policy_attachment" "ecr_read_only_policy_attachment" {
  role       = aws_iam_role.eks_node_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

# Security group for EKS node groups
resource "aws_security_group" "eks_node_security_group" {
  name        = "${var.project_name}-${var.environment}-eks-node-sg"
  description = "Security group for the EKS node groups"
  vpc_id      = var.vpc_id
  
  ingress {
    from_port       = 0
    to_port         = 0
    protocol        = "-1"
    security_groups = [aws_security_group.eks_cluster_security_group.id]
    description     = "Allow all traffic from the EKS cluster security group"
  }
  
  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    self        = true
    description = "Allow all traffic between nodes"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-eks-node-sg"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# Allow the EKS cluster to communicate with worker nodes
resource "aws_security_group_rule" "eks_cluster_security_group_ingress" {
  security_group_id        = aws_security_group.eks_cluster_security_group.id
  type                     = "ingress"
  from_port                = 0
  to_port                  = 0
  protocol                 = "-1"
  source_security_group_id = aws_security_group.eks_node_security_group.id
  description              = "Allow worker nodes to communicate with the cluster API Server"
}

# System node group for system services (monitoring, ingress controllers, etc.)
resource "aws_eks_node_group" "system_node_group" {
  cluster_name    = aws_eks_cluster.eks_cluster.name
  node_group_name = "${var.project_name}-${var.environment}-system"
  node_role_arn   = aws_iam_role.eks_node_role.arn
  subnet_ids      = var.subnet_ids
  
  instance_types = ["m5.large"]
  ami_type       = "AL2_x86_64"
  disk_size      = 50
  
  scaling_config {
    desired_size = 2
    min_size     = 2
    max_size     = 4
  }
  
  update_config {
    max_unavailable = 1
  }
  
  labels = {
    role = "system"
  }
  
  tags = {
    Name                                                        = "${var.project_name}-${var.environment}-system-node-group"
    Environment                                                 = var.environment
    Project                                                     = var.project_name
    ManagedBy                                                   = "Terraform"
    "k8s.io/cluster-autoscaler/enabled"                         = "true"
    "k8s.io/cluster-autoscaler/${var.project_name}-${var.environment}" = "owned"
  }
}

# Application node group for core application workloads
resource "aws_eks_node_group" "application_node_group" {
  cluster_name    = aws_eks_cluster.eks_cluster.name
  node_group_name = "${var.project_name}-${var.environment}-application"
  node_role_arn   = aws_iam_role.eks_node_role.arn
  subnet_ids      = var.subnet_ids
  
  instance_types = var.node_group_instance_types
  ami_type       = "AL2_x86_64"
  disk_size      = 100
  
  scaling_config {
    desired_size = var.node_group_desired_size
    min_size     = var.node_group_min_size
    max_size     = var.node_group_max_size
  }
  
  update_config {
    max_unavailable = 1
  }
  
  labels = {
    role = "application"
  }
  
  tags = {
    Name                                                        = "${var.project_name}-${var.environment}-application-node-group"
    Environment                                                 = var.environment
    Project                                                     = var.project_name
    ManagedBy                                                   = "Terraform"
    "k8s.io/cluster-autoscaler/enabled"                         = "true"
    "k8s.io/cluster-autoscaler/${var.project_name}-${var.environment}" = "owned"
  }
}

# Batch node group for batch processing workloads (claim processing, report generation)
resource "aws_eks_node_group" "batch_node_group" {
  cluster_name    = aws_eks_cluster.eks_cluster.name
  node_group_name = "${var.project_name}-${var.environment}-batch"
  node_role_arn   = aws_iam_role.eks_node_role.arn
  subnet_ids      = var.subnet_ids
  
  instance_types = ["c5.xlarge"]
  ami_type       = "AL2_x86_64"
  disk_size      = 100
  
  scaling_config {
    desired_size = 0
    min_size     = 0
    max_size     = 5
  }
  
  update_config {
    max_unavailable = 1
  }
  
  labels = {
    role = "batch"
  }
  
  taint {
    key    = "dedicated"
    value  = "batch"
    effect = "NO_SCHEDULE"
  }
  
  tags = {
    Name                                                        = "${var.project_name}-${var.environment}-batch-node-group"
    Environment                                                 = var.environment
    Project                                                     = var.project_name
    ManagedBy                                                   = "Terraform"
    "k8s.io/cluster-autoscaler/enabled"                         = "true"
    "k8s.io/cluster-autoscaler/${var.project_name}-${var.environment}" = "owned"
  }
}

# OpenID Connect provider for EKS IAM roles for service accounts
resource "aws_iam_openid_connect_provider" "eks_oidc_provider" {
  url             = aws_eks_cluster.eks_cluster.identity[0].oidc[0].issuer
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.eks_oidc_certificate.certificates[0].sha1_fingerprint]
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-eks-oidc-provider"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# IAM policy for the Kubernetes Cluster Autoscaler
resource "aws_iam_policy" "cluster_autoscaler_policy" {
  name        = "${var.project_name}-${var.environment}-cluster-autoscaler-policy"
  description = "IAM policy for the Kubernetes Cluster Autoscaler"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "autoscaling:DescribeAutoScalingGroups",
          "autoscaling:DescribeAutoScalingInstances",
          "autoscaling:DescribeLaunchConfigurations",
          "autoscaling:DescribeTags",
          "autoscaling:SetDesiredCapacity",
          "autoscaling:TerminateInstanceInAutoScalingGroup",
          "ec2:DescribeLaunchTemplateVersions"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAM role for the Kubernetes Cluster Autoscaler
resource "aws_iam_role" "cluster_autoscaler_role" {
  name = "${var.project_name}-${var.environment}-cluster-autoscaler-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.eks_oidc_provider.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "${replace(aws_iam_openid_connect_provider.eks_oidc_provider.url, "https://", "")}:sub" = "system:serviceaccount:kube-system:cluster-autoscaler"
          }
        }
      }
    ]
  })
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-cluster-autoscaler-role"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# Attach the Cluster Autoscaler policy to the role
resource "aws_iam_role_policy_attachment" "cluster_autoscaler_policy_attachment" {
  role       = aws_iam_role.cluster_autoscaler_role.name
  policy_arn = aws_iam_policy.cluster_autoscaler_policy.arn
}

# IAM policy for the AWS Load Balancer Controller
resource "aws_iam_policy" "aws_load_balancer_controller_policy" {
  name        = "${var.project_name}-${var.environment}-aws-load-balancer-controller-policy"
  description = "IAM policy for the AWS Load Balancer Controller"
  
  policy = file("${path.module}/policies/aws-load-balancer-controller-policy.json")
}

# IAM role for the AWS Load Balancer Controller
resource "aws_iam_role" "aws_load_balancer_controller_role" {
  name = "${var.project_name}-${var.environment}-aws-load-balancer-controller-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.eks_oidc_provider.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "${replace(aws_iam_openid_connect_provider.eks_oidc_provider.url, "https://", "")}:sub" = "system:serviceaccount:kube-system:aws-load-balancer-controller"
          }
        }
      }
    ]
  })
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-aws-load-balancer-controller-role"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# Attach the AWS Load Balancer Controller policy to the role
resource "aws_iam_role_policy_attachment" "aws_load_balancer_controller_policy_attachment" {
  role       = aws_iam_role.aws_load_balancer_controller_role.name
  policy_arn = aws_iam_policy.aws_load_balancer_controller_policy.arn
}

# IAM policy for ExternalDNS
resource "aws_iam_policy" "external_dns_policy" {
  name        = "${var.project_name}-${var.environment}-external-dns-policy"
  description = "IAM policy for ExternalDNS"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "route53:ChangeResourceRecordSets"
        ]
        Resource = [
          "arn:aws:route53:::hostedzone/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "route53:ListHostedZones",
          "route53:ListResourceRecordSets"
        ]
        Resource = [
          "*"
        ]
      }
    ]
  })
}

# IAM role for ExternalDNS
resource "aws_iam_role" "external_dns_role" {
  name = "${var.project_name}-${var.environment}-external-dns-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.eks_oidc_provider.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "${replace(aws_iam_openid_connect_provider.eks_oidc_provider.url, "https://", "")}:sub" = "system:serviceaccount:kube-system:external-dns"
          }
        }
      }
    ]
  })
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-external-dns-role"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# Attach the ExternalDNS policy to the role
resource "aws_iam_role_policy_attachment" "external_dns_policy_attachment" {
  role       = aws_iam_role.external_dns_role.name
  policy_arn = aws_iam_policy.external_dns_policy.arn
}

# Outputs
output "cluster_name" {
  description = "Name of the EKS cluster"
  value       = aws_eks_cluster.eks_cluster.name
}

output "cluster_endpoint" {
  description = "Endpoint for the EKS cluster API server"
  value       = aws_eks_cluster.eks_cluster.endpoint
}

output "cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data for the EKS cluster"
  value       = aws_eks_cluster.eks_cluster.certificate_authority[0].data
}

output "cluster_security_group_id" {
  description = "Security group ID for the EKS cluster"
  value       = aws_security_group.eks_cluster_security_group.id
}

output "node_security_group_id" {
  description = "Security group ID for the EKS node groups"
  value       = aws_security_group.eks_node_security_group.id
}

output "oidc_provider_arn" {
  description = "ARN of the OIDC provider for IAM roles for service accounts"
  value       = aws_iam_openid_connect_provider.eks_oidc_provider.arn
}

output "cluster_autoscaler_role_arn" {
  description = "ARN of the IAM role for the Kubernetes Cluster Autoscaler"
  value       = aws_iam_role.cluster_autoscaler_role.arn
}

output "aws_load_balancer_controller_role_arn" {
  description = "ARN of the IAM role for the AWS Load Balancer Controller"
  value       = aws_iam_role.aws_load_balancer_controller_role.arn
}

output "external_dns_role_arn" {
  description = "ARN of the IAM role for ExternalDNS"
  value       = aws_iam_role.external_dns_role.arn
}