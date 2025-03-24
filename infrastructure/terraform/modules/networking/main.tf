# AWS provider required by this module
provider "aws" {
  # Provider version constraint
  # version = "~> 4.67.0" - This should be specified in the root module
}

# Data source to get current AWS region information
data "aws_region" "current" {}

# Input variables for the networking module
variable "environment" {
  description = "Deployment environment (development, staging, production)"
  type        = string
}

variable "project_name" {
  description = "Name of the project for resource naming and tagging"
  type        = string
}

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

variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}

# VPC resource for the HCBS Revenue Management System
resource "aws_vpc" "vpc" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true
  
  tags = merge({
    Name        = "${var.project_name}-${var.environment}-vpc"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }, var.tags)
}

# Internet Gateway for the VPC
resource "aws_internet_gateway" "internet_gateway" {
  vpc_id = aws_vpc.vpc.id
  
  tags = merge({
    Name        = "${var.project_name}-${var.environment}-igw"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }, var.tags)
}

# Public subnets for load balancers and NAT gateways
resource "aws_subnet" "public_subnet" {
  count                   = length(var.availability_zones)
  vpc_id                  = aws_vpc.vpc.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true
  
  tags = merge({
    Name                     = "${var.project_name}-${var.environment}-public-subnet-${count.index + 1}"
    Environment              = var.environment
    Project                  = var.project_name
    ManagedBy                = "Terraform"
    "kubernetes.io/role/elb" = "1"
  }, var.tags)
}

# Private subnets for application tier
resource "aws_subnet" "private_subnet" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.vpc.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + length(var.availability_zones))
  availability_zone = var.availability_zones[count.index]
  
  tags = merge({
    Name                            = "${var.project_name}-${var.environment}-private-subnet-${count.index + 1}"
    Environment                     = var.environment
    Project                         = var.project_name
    ManagedBy                       = "Terraform"
    "kubernetes.io/role/internal-elb" = "1"
  }, var.tags)
}

# Data subnets for database and cache tiers
resource "aws_subnet" "data_subnet" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.vpc.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 2 * length(var.availability_zones))
  availability_zone = var.availability_zones[count.index]
  
  tags = merge({
    Name        = "${var.project_name}-${var.environment}-data-subnet-${count.index + 1}"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }, var.tags)
}

# Integration subnets for external connectivity
resource "aws_subnet" "integration_subnet" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.vpc.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 3 * length(var.availability_zones))
  availability_zone = var.availability_zones[count.index]
  
  tags = merge({
    Name        = "${var.project_name}-${var.environment}-integration-subnet-${count.index + 1}"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }, var.tags)
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "eip" {
  count = length(var.availability_zones)
  vpc   = true
  
  tags = merge({
    Name        = "${var.project_name}-${var.environment}-eip-${count.index + 1}"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }, var.tags)
}

# NAT Gateways for private subnet internet access
resource "aws_nat_gateway" "nat_gateway" {
  count         = length(var.availability_zones)
  allocation_id = aws_eip.eip[count.index].id
  subnet_id     = aws_subnet.public_subnet[count.index].id
  
  tags = merge({
    Name        = "${var.project_name}-${var.environment}-nat-${count.index + 1}"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }, var.tags)
}

# Route table for public subnets
resource "aws_route_table" "public_route_table" {
  vpc_id = aws_vpc.vpc.id
  
  tags = merge({
    Name        = "${var.project_name}-${var.environment}-public-rt"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }, var.tags)
}

# Route to internet gateway for public subnets
resource "aws_route" "public_internet_route" {
  route_table_id         = aws_route_table.public_route_table.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.internet_gateway.id
}

# Route tables for private subnets
resource "aws_route_table" "private_route_table" {
  count  = length(var.availability_zones)
  vpc_id = aws_vpc.vpc.id
  
  tags = merge({
    Name        = "${var.project_name}-${var.environment}-private-rt-${count.index + 1}"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }, var.tags)
}

# Route to NAT gateway for private subnets
resource "aws_route" "private_nat_route" {
  count                  = length(var.availability_zones)
  route_table_id         = aws_route_table.private_route_table[count.index].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.nat_gateway[count.index].id
}

# Route tables for data subnets
resource "aws_route_table" "data_route_table" {
  count  = length(var.availability_zones)
  vpc_id = aws_vpc.vpc.id
  
  tags = merge({
    Name        = "${var.project_name}-${var.environment}-data-rt-${count.index + 1}"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }, var.tags)
}

# Route to NAT gateway for data subnets
resource "aws_route" "data_nat_route" {
  count                  = length(var.availability_zones)
  route_table_id         = aws_route_table.data_route_table[count.index].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.nat_gateway[count.index].id
}

# Route tables for integration subnets
resource "aws_route_table" "integration_route_table" {
  count  = length(var.availability_zones)
  vpc_id = aws_vpc.vpc.id
  
  tags = merge({
    Name        = "${var.project_name}-${var.environment}-integration-rt-${count.index + 1}"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }, var.tags)
}

# Route to NAT gateway for integration subnets
resource "aws_route" "integration_nat_route" {
  count                  = length(var.availability_zones)
  route_table_id         = aws_route_table.integration_route_table[count.index].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.nat_gateway[count.index].id
}

# Associate public subnets with public route table
resource "aws_route_table_association" "public_route_table_association" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.public_subnet[count.index].id
  route_table_id = aws_route_table.public_route_table.id
}

# Associate private subnets with private route tables
resource "aws_route_table_association" "private_route_table_association" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.private_subnet[count.index].id
  route_table_id = aws_route_table.private_route_table[count.index].id
}

# Associate data subnets with data route tables
resource "aws_route_table_association" "data_route_table_association" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.data_subnet[count.index].id
  route_table_id = aws_route_table.data_route_table[count.index].id
}

# Associate integration subnets with integration route tables
resource "aws_route_table_association" "integration_route_table_association" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.integration_subnet[count.index].id
  route_table_id = aws_route_table.integration_route_table[count.index].id
}

# Security group for Application Load Balancer
resource "aws_security_group" "alb_security_group" {
  name        = "${var.project_name}-${var.environment}-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.vpc.id
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP from internet"
  }
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS from internet"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }
  
  tags = merge({
    Name        = "${var.project_name}-${var.environment}-alb-sg"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }, var.tags)
}

# Security group for application tier
resource "aws_security_group" "app_security_group" {
  name        = "${var.project_name}-${var.environment}-app-sg"
  description = "Security group for application tier"
  vpc_id      = aws_vpc.vpc.id
  
  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_security_group.id]
    description     = "HTTP from ALB"
  }
  
  ingress {
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_security_group.id]
    description     = "HTTPS from ALB"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }
  
  tags = merge({
    Name        = "${var.project_name}-${var.environment}-app-sg"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }, var.tags)
}

# CloudWatch Log Group for VPC Flow Logs
resource "aws_cloudwatch_log_group" "flow_logs" {
  name              = "/aws/vpc/flow-logs/${var.project_name}-${var.environment}"
  retention_in_days = 90
  
  tags = merge({
    Name        = "${var.project_name}-${var.environment}-flow-logs"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }, var.tags)
}

# IAM role for VPC Flow Logs
resource "aws_iam_role" "flow_logs_role" {
  name = "${var.project_name}-${var.environment}-flow-logs-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
  
  tags = merge({
    Name        = "${var.project_name}-${var.environment}-flow-logs-role"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }, var.tags)
}

# IAM policy for VPC Flow Logs
resource "aws_iam_role_policy" "flow_logs_policy" {
  name = "${var.project_name}-${var.environment}-flow-logs-policy"
  role = aws_iam_role.flow_logs_role.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = "*"
      }
    ]
  })
}

# VPC Flow Logs for network traffic monitoring
resource "aws_flow_log" "vpc_flow_logs" {
  iam_role_arn   = aws_iam_role.flow_logs_role.arn
  log_destination = aws_cloudwatch_log_group.flow_logs.arn
  traffic_type   = "ALL"
  vpc_id         = aws_vpc.vpc.id
  
  tags = merge({
    Name        = "${var.project_name}-${var.environment}-vpc-flow-logs"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }, var.tags)
}

# VPC Endpoint for S3 access
resource "aws_vpc_endpoint" "vpc_endpoint_s3" {
  vpc_id       = aws_vpc.vpc.id
  service_name = "com.amazonaws.${data.aws_region.current.name}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids = concat(
    aws_route_table.private_route_table[*].id,
    aws_route_table.data_route_table[*].id
  )
  
  tags = merge({
    Name        = "${var.project_name}-${var.environment}-s3-endpoint"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }, var.tags)
}

# VPC Endpoint for DynamoDB access
resource "aws_vpc_endpoint" "vpc_endpoint_dynamodb" {
  vpc_id       = aws_vpc.vpc.id
  service_name = "com.amazonaws.${data.aws_region.current.name}.dynamodb"
  vpc_endpoint_type = "Gateway"
  route_table_ids = concat(
    aws_route_table.private_route_table[*].id,
    aws_route_table.data_route_table[*].id
  )
  
  tags = merge({
    Name        = "${var.project_name}-${var.environment}-dynamodb-endpoint"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }, var.tags)
}

# Network ACL for public subnets
resource "aws_network_acl" "network_acl_public" {
  vpc_id     = aws_vpc.vpc.id
  subnet_ids = aws_subnet.public_subnet[*].id
  
  # Inbound rules
  ingress {
    rule_no    = 100
    action     = "allow"
    protocol   = "tcp"
    cidr_block = "0.0.0.0/0"
    from_port  = 80
    to_port    = 80
  }
  
  ingress {
    rule_no    = 110
    action     = "allow"
    protocol   = "tcp"
    cidr_block = "0.0.0.0/0"
    from_port  = 443
    to_port    = 443
  }
  
  ingress {
    rule_no    = 120
    action     = "allow"
    protocol   = "tcp"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }
  
  # Outbound rules
  egress {
    rule_no    = 100
    action     = "allow"
    protocol   = "tcp"
    cidr_block = "0.0.0.0/0"
    from_port  = 80
    to_port    = 80
  }
  
  egress {
    rule_no    = 110
    action     = "allow"
    protocol   = "tcp"
    cidr_block = "0.0.0.0/0"
    from_port  = 443
    to_port    = 443
  }
  
  egress {
    rule_no    = 120
    action     = "allow"
    protocol   = "tcp"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }
  
  tags = merge({
    Name        = "${var.project_name}-${var.environment}-public-nacl"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }, var.tags)
}

# Network ACL for private subnets
resource "aws_network_acl" "network_acl_private" {
  vpc_id     = aws_vpc.vpc.id
  subnet_ids = aws_subnet.private_subnet[*].id
  
  # Inbound rules
  ingress {
    rule_no    = 100
    action     = "allow"
    protocol   = "tcp"
    cidr_block = var.vpc_cidr
    from_port  = 0
    to_port    = 65535
  }
  
  ingress {
    rule_no    = 110
    action     = "allow"
    protocol   = "tcp"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }
  
  # Outbound rules
  egress {
    rule_no    = 100
    action     = "allow"
    protocol   = "tcp"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 65535
  }
  
  tags = merge({
    Name        = "${var.project_name}-${var.environment}-private-nacl"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }, var.tags)
}

# Network ACL for data subnets
resource "aws_network_acl" "network_acl_data" {
  vpc_id     = aws_vpc.vpc.id
  subnet_ids = aws_subnet.data_subnet[*].id
  
  # Inbound rules
  ingress {
    rule_no    = 100
    action     = "allow"
    protocol   = "tcp"
    cidr_block = var.vpc_cidr
    from_port  = 0
    to_port    = 65535
  }
  
  # Outbound rules
  egress {
    rule_no    = 100
    action     = "allow"
    protocol   = "tcp"
    cidr_block = var.vpc_cidr
    from_port  = 0
    to_port    = 65535
  }
  
  egress {
    rule_no    = 110
    action     = "allow"
    protocol   = "tcp"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }
  
  tags = merge({
    Name        = "${var.project_name}-${var.environment}-data-nacl"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }, var.tags)
}

# Output values from the networking module
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.vpc.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public_subnet[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private_subnet[*].id
}

output "data_subnet_ids" {
  description = "IDs of the data subnets"
  value       = aws_subnet.data_subnet[*].id
}

output "integration_subnet_ids" {
  description = "IDs of the integration subnets"
  value       = aws_subnet.integration_subnet[*].id
}

output "nat_gateway_ids" {
  description = "IDs of the NAT gateways"
  value       = aws_nat_gateway.nat_gateway[*].id
}

output "app_security_group_id" {
  description = "ID of the application security group"
  value       = aws_security_group.app_security_group.id
}

output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb_security_group.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.vpc.cidr_block
}

output "availability_zones" {
  description = "List of availability zones used"
  value       = var.availability_zones
}