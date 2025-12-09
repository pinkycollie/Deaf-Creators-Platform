# Variables for v0-deaf-creator-platform-multi-tenants infrastructure
# Customize these values in terraform.tfvars

# General Configuration
variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "deaf-creator-platform"
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
  default     = "production"
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

# Provider Configuration
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "cloudflare_api_token" {
  description = "Cloudflare API token"
  type        = string
  sensitive   = true
  default     = ""
}

variable "cloudflare_account_id" {
  description = "Cloudflare account ID"
  type        = string
  default     = ""
}

variable "vercel_api_token" {
  description = "Vercel API token"
  type        = string
  sensitive   = true
  default     = ""
}

variable "github_token" {
  description = "GitHub personal access token"
  type        = string
  sensitive   = true
  default     = ""
}

# Frontend Configuration
variable "frontend_hosting_provider" {
  description = "Frontend hosting provider (vercel, s3, cloudflare_pages)"
  type        = string
  default     = "vercel"
  validation {
    condition     = contains(["vercel", "s3", "cloudflare_pages"], var.frontend_hosting_provider)
    error_message = "Frontend hosting provider must be one of: vercel, s3, cloudflare_pages"
  }
}

variable "vercel_project_name" {
  description = "Vercel project name"
  type        = string
  default     = "deaf-creator-platform"
}

variable "vercel_framework" {
  description = "Framework for Vercel deployment"
  type        = string
  default     = "nextjs"
}

variable "vercel_build_command" {
  description = "Build command for Vercel"
  type        = string
  default     = "npm run build"
}

variable "vercel_output_directory" {
  description = "Output directory for Vercel"
  type        = string
  default     = ".next"
}

variable "s3_frontend_bucket_name" {
  description = "S3 bucket name for frontend hosting"
  type        = string
  default     = ""
}

variable "cloudfront_enabled" {
  description = "Enable CloudFront CDN for S3 frontend"
  type        = bool
  default     = true
}

variable "cloudflare_pages_project" {
  description = "Cloudflare Pages project name"
  type        = string
  default     = ""
}

# Backend Configuration
variable "backend_hosting_provider" {
  description = "Backend hosting provider (lambda, ec2, cloudflare_workers)"
  type        = string
  default     = "lambda"
  validation {
    condition     = contains(["lambda", "ec2", "cloudflare_workers"], var.backend_hosting_provider)
    error_message = "Backend hosting provider must be one of: lambda, ec2, cloudflare_workers"
  }
}

variable "lambda_runtime" {
  description = "Lambda runtime environment"
  type        = string
  default     = "nodejs20.x"
}

variable "lambda_memory_size" {
  description = "Lambda memory size in MB"
  type        = number
  default     = 1024
}

variable "lambda_timeout" {
  description = "Lambda timeout in seconds"
  type        = number
  default     = 60
}

variable "ec2_instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.small"
}

variable "ec2_ami_id" {
  description = "EC2 AMI ID"
  type        = string
  default     = ""
}

variable "worker_script_path" {
  description = "Path to Cloudflare Worker script"
  type        = string
  default     = ""
}

# Database Configuration
variable "database_provider" {
  description = "Database provider (neon, rds, supabase)"
  type        = string
  default     = "neon"
  validation {
    condition     = contains(["neon", "rds", "supabase"], var.database_provider)
    error_message = "Database provider must be one of: neon, rds, supabase"
  }
}

variable "postgres_version" {
  description = "PostgreSQL version"
  type        = string
  default     = "15"
}

variable "postgres_instance_class" {
  description = "Database instance class"
  type        = string
  default     = "db.t4g.micro"
}

variable "database_name" {
  description = "Database name"
  type        = string
  default     = "deaf_creator_platform"
}

variable "database_master_username" {
  description = "Database master username"
  type        = string
  default     = "dbadmin"
}

variable "neon_project_name" {
  description = "Neon project name"
  type        = string
  default     = "deaf-creator-platform"
}

variable "neon_region" {
  description = "Neon region"
  type        = string
  default     = "aws-us-east-2"
}

variable "database_allocated_storage" {
  description = "Allocated storage for database in GB"
  type        = number
  default     = 20
}

variable "database_multi_az" {
  description = "Enable multi-AZ deployment for database"
  type        = bool
  default     = false
}

variable "database_backup_retention" {
  description = "Database backup retention period in days"
  type        = number
  default     = 7
}

# Storage Configuration
variable "storage_provider" {
  description = "Object storage provider (s3, cloudflare_r2)"
  type        = string
  default     = "cloudflare_r2"
  validation {
    condition     = contains(["s3", "cloudflare_r2"], var.storage_provider)
    error_message = "Storage provider must be one of: s3, cloudflare_r2"
  }
}

variable "s3_storage_bucket_name" {
  description = "S3 bucket name for object storage"
  type        = string
  default     = ""
}

variable "s3_versioning_enabled" {
  description = "Enable versioning for S3 bucket"
  type        = bool
  default     = true
}

variable "s3_lifecycle_rules" {
  description = "S3 lifecycle rules"
  type        = list(object({
    id      = string
    enabled = bool
    prefix  = string
    expiration_days = number
  }))
  default     = []
}

variable "r2_bucket_name" {
  description = "Cloudflare R2 bucket name"
  type        = string
  default     = "deaf-creator-platform-uploads"
}

variable "cors_allowed_origins" {
  description = "CORS allowed origins"
  type        = list(string)
  default     = ["*"]
}

variable "cors_allowed_methods" {
  description = "CORS allowed methods"
  type        = list(string)
  default     = ["GET", "PUT", "POST", "DELETE"]
}

# DNS Configuration
variable "dns_provider" {
  description = "DNS provider (cloudflare, route53)"
  type        = string
  default     = "cloudflare"
  validation {
    condition     = contains(["cloudflare", "route53"], var.dns_provider)
    error_message = "DNS provider must be one of: cloudflare, route53"
  }
}

variable "domain_name" {
  description = "Primary domain name"
  type        = string
  default     = "example.com"
}

variable "subdomain_prefix" {
  description = "Subdomain prefix for the application"
  type        = string
  default     = "creators"
}

variable "cloudflare_zone_id" {
  description = "Cloudflare zone ID"
  type        = string
  default     = ""
}

variable "route53_zone_id" {
  description = "Route53 hosted zone ID"
  type        = string
  default     = ""
}

variable "cdn_enabled" {
  description = "Enable CDN for the application"
  type        = bool
  default     = true
}

# Secrets Management Configuration
variable "secrets_provider" {
  description = "Secrets management provider (aws_secrets_manager, azure_key_vault)"
  type        = string
  default     = "aws_secrets_manager"
  validation {
    condition     = contains(["aws_secrets_manager", "azure_key_vault"], var.secrets_provider)
    error_message = "Secrets provider must be one of: aws_secrets_manager, azure_key_vault"
  }
}

variable "secrets_to_manage" {
  description = "List of secrets to manage"
  type        = list(string)
  default     = [
    "database_url",
    "nextauth_secret",
    "stripe_secret_key",
    "pinksync_api_key",
    "cloudflare_access_key"
  ]
}

variable "secrets_recovery_window" {
  description = "Number of days to retain deleted secrets"
  type        = number
  default     = 30
}

# Monitoring Configuration
variable "monitoring_enabled" {
  description = "Enable monitoring and observability"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "alarm_email" {
  description = "Email address for alarm notifications"
  type        = string
  default     = ""
}

# CI/CD Configuration
variable "cicd_enabled" {
  description = "Enable CI/CD pipeline setup"
  type        = bool
  default     = true
}

variable "github_repository" {
  description = "GitHub repository name"
  type        = string
  default     = "v0-deaf-creator-platform-multi-tenants"
}

variable "github_owner" {
  description = "GitHub repository owner"
  type        = string
  default     = "pinkycollie"
}

variable "cicd_aws_access_key" {
  description = "AWS access key for CI/CD"
  type        = string
  sensitive   = true
  default     = ""
}

variable "cicd_aws_secret_key" {
  description = "AWS secret key for CI/CD"
  type        = string
  sensitive   = true
  default     = ""
}

variable "cicd_workflow_triggers" {
  description = "GitHub Actions workflow triggers"
  type        = list(string)
  default     = ["push", "pull_request"]
}
