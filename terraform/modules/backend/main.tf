# Backend Module - Lambda/Workers/EC2 with Zero Trust Protection

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# VPC for backend resources
resource "aws_vpc" "main" {
  count = var.backend_type == "ec2" ? 1 : 0
  
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-vpc"
    }
  )
}

# Subnets
resource "aws_subnet" "private" {
  count = var.backend_type == "ec2" ? length(var.availability_zones) : 0
  
  vpc_id            = aws_vpc.main[0].id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone = var.availability_zones[count.index]
  
  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-private-${count.index + 1}"
    }
  )
}

# Lambda function placeholder (for lambda backend_type)
# EC2 instance placeholder (for ec2 backend_type)
# Cloudflare Worker placeholder (for workers backend_type)

output "endpoint" {
  description = "Backend endpoint URL"
  value       = "https://api.${var.domain}"
}

output "vpc_id" {
  description = "VPC ID"
  value       = var.backend_type == "ec2" ? aws_vpc.main[0].id : null
}
