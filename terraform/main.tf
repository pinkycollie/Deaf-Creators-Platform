# Main Terraform configuration for v0-deaf-creator-platform-multi-tenants
# This is a generalized infrastructure skeleton that can be customized for various cloud providers

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
    vercel = {
      source  = "vercel/vercel"
      version = "~> 1.0"
    }
    github = {
      source  = "integrations/github"
      version = "~> 5.0"
    }
  }

  # Configure backend for state management
  # Uncomment and configure based on your preference
  # backend "s3" {
  #   bucket = "your-terraform-state-bucket"
  #   key    = "deaf-creator-platform/terraform.tfstate"
  #   region = "us-east-1"
  # }
}

# Provider configurations
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

provider "vercel" {
  api_token = var.vercel_api_token
}

provider "github" {
  token = var.github_token
}

# Frontend Hosting Module
module "frontend" {
  source = "./modules/frontend"

  project_name     = var.project_name
  environment      = var.environment
  hosting_provider = var.frontend_hosting_provider

  # Vercel-specific configurations
  vercel_project_name = var.vercel_project_name
  vercel_framework    = var.vercel_framework
  vercel_build_command = var.vercel_build_command
  vercel_output_directory = var.vercel_output_directory

  # AWS S3-specific configurations
  s3_bucket_name = var.s3_frontend_bucket_name
  cloudfront_enabled = var.cloudfront_enabled

  # Cloudflare Pages-specific configurations
  cloudflare_account_id = var.cloudflare_account_id
  cloudflare_pages_project = var.cloudflare_pages_project

  tags = var.tags
}

# Backend API Module
module "backend" {
  source = "./modules/backend"

  project_name     = var.project_name
  environment      = var.environment
  backend_provider = var.backend_hosting_provider

  # AWS Lambda configurations
  lambda_runtime     = var.lambda_runtime
  lambda_memory_size = var.lambda_memory_size
  lambda_timeout     = var.lambda_timeout

  # EC2 configurations
  ec2_instance_type = var.ec2_instance_type
  ec2_ami_id        = var.ec2_ami_id

  # Cloudflare Workers configurations
  cloudflare_account_id = var.cloudflare_account_id
  worker_script_path    = var.worker_script_path

  tags = var.tags
}

# Database Module
module "database" {
  source = "./modules/database"

  project_name     = var.project_name
  environment      = var.environment
  database_provider = var.database_provider

  # PostgreSQL configurations
  postgres_version     = var.postgres_version
  postgres_instance_class = var.postgres_instance_class
  database_name        = var.database_name
  master_username      = var.database_master_username

  # Neon-specific configurations
  neon_project_name = var.neon_project_name
  neon_region       = var.neon_region

  # RDS-specific configurations
  allocated_storage     = var.database_allocated_storage
  multi_az              = var.database_multi_az
  backup_retention_days = var.database_backup_retention

  tags = var.tags
}

# Object Storage Module
module "storage" {
  source = "./modules/storage"

  project_name      = var.project_name
  environment       = var.environment
  storage_provider  = var.storage_provider

  # S3 configurations
  s3_bucket_name    = var.s3_storage_bucket_name
  s3_versioning     = var.s3_versioning_enabled
  s3_lifecycle_rules = var.s3_lifecycle_rules

  # Cloudflare R2 configurations
  cloudflare_account_id = var.cloudflare_account_id
  r2_bucket_name        = var.r2_bucket_name

  # CORS configuration
  cors_allowed_origins = var.cors_allowed_origins
  cors_allowed_methods = var.cors_allowed_methods

  tags = var.tags
}

# DNS and Networking Module
module "dns" {
  source = "./modules/dns"

  project_name     = var.project_name
  environment      = var.environment
  dns_provider     = var.dns_provider

  # Domain configuration
  domain_name      = var.domain_name
  subdomain_prefix = var.subdomain_prefix

  # Cloudflare-specific configurations
  cloudflare_zone_id = var.cloudflare_zone_id

  # Route53-specific configurations
  route53_zone_id = var.route53_zone_id

  # CDN configuration
  cdn_enabled = var.cdn_enabled

  # Frontend endpoint
  frontend_endpoint = module.frontend.endpoint

  # Backend endpoint
  backend_endpoint = module.backend.endpoint

  tags = var.tags
}

# Secrets Management Module
module "secrets" {
  source = "./modules/secrets"

  project_name       = var.project_name
  environment        = var.environment
  secrets_provider   = var.secrets_provider

  # Secrets to manage
  secrets_list = var.secrets_to_manage

  # AWS Secrets Manager configurations
  aws_recovery_window_days = var.secrets_recovery_window

  # Azure Key Vault configurations (if using Azure)
  # azure_key_vault_name = var.azure_key_vault_name

  tags = var.tags
}

# Monitoring and Observability Module
module "monitoring" {
  source = "./modules/monitoring"

  project_name     = var.project_name
  environment      = var.environment
  monitoring_enabled = var.monitoring_enabled

  # CloudWatch configurations
  log_retention_days = var.log_retention_days
  alarm_email        = var.alarm_email

  # Resources to monitor
  frontend_id = module.frontend.id
  backend_id  = module.backend.id
  database_id = module.database.id

  tags = var.tags
}

# CI/CD Module for GitHub Actions
module "cicd" {
  source = "./modules/cicd"

  project_name     = var.project_name
  environment      = var.environment
  cicd_enabled     = var.cicd_enabled

  # GitHub repository configuration
  github_repository = var.github_repository
  github_owner      = var.github_owner

  # Deployment secrets
  vercel_token     = var.vercel_api_token
  aws_access_key   = var.cicd_aws_access_key
  aws_secret_key   = var.cicd_aws_secret_key

  # Workflow configuration
  workflow_triggers = var.cicd_workflow_triggers

  tags = var.tags
}
