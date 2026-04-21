# Main Terraform Configuration for Deaf Creator Platform
# Multi-tenant platform with Cloudflare Zero Trust Access

terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
    vercel = {
      source  = "vercel/vercel"
      version = "~> 1.0"
    }
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    # Backend configuration should be provided via backend config file
    # terraform init -backend-config=backend.hcl
  }
}

# Provider Configurations
provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

provider "vercel" {
  api_token = var.vercel_api_token
}

provider "aws" {
  region = var.aws_region
}

# Local variables
locals {
  project_name = "deaf-creator-platform"
  environment  = var.environment
  
  common_tags = {
    Project     = local.project_name
    Environment = local.environment
    ManagedBy   = "Terraform"
    Compliance  = join(",", var.compliance_standards)
  }
}

# Cloudflare Zero Trust Access Module
module "cloudflare_zero_trust" {
  source = "./modules/cloudflare-zero-trust"
  
  account_id      = var.cloudflare_account_id
  zone_id         = var.cloudflare_zone_id
  domain          = var.domain
  environment     = var.environment
  
  # Zero Trust Access Configuration
  enable_zero_trust       = var.enable_zero_trust
  zero_trust_applications = var.zero_trust_applications
  
  # Identity Providers
  identity_providers = var.identity_providers
  
  # Access Policies
  access_policies = var.access_policies
  
  tags = local.common_tags
}

# Frontend Module (Vercel)
module "frontend" {
  source = "./modules/frontend"
  
  project_name    = local.project_name
  environment     = var.environment
  domain          = var.domain
  git_repository  = var.git_repository
  
  # Cloudflare integration
  cloudflare_zone_id = var.cloudflare_zone_id
  
  # Zero Trust Access protection
  enable_zero_trust    = var.enable_zero_trust
  zero_trust_policies  = module.cloudflare_zero_trust.frontend_policies
  
  # Environment variables
  environment_variables = merge(
    var.frontend_env_vars,
    {
      NEXT_PUBLIC_ZERO_TRUST_ENABLED = var.enable_zero_trust ? "true" : "false"
    }
  )
  
  tags = local.common_tags
}

# Backend Module
module "backend" {
  source = "./modules/backend"
  
  project_name = local.project_name
  environment  = var.environment
  
  # Backend configuration
  backend_type = var.backend_type # lambda, workers, or ec2
  
  # Zero Trust Access protection
  enable_zero_trust   = var.enable_zero_trust
  zero_trust_policies = module.cloudflare_zero_trust.backend_policies
  
  # VPC and networking
  vpc_cidr            = var.vpc_cidr
  availability_zones  = var.availability_zones
  
  tags = local.common_tags
  
  depends_on = [module.security]
}

# Database Module
module "database" {
  source = "./modules/database"
  
  project_name = local.project_name
  environment  = var.environment
  
  # Database configuration
  database_type = var.database_type # neon, rds, or supabase
  database_name = "${local.project_name}_${var.environment}"
  
  # Encryption at rest
  enable_encryption = true
  kms_key_id       = module.security.kms_key_id
  
  # Backup configuration
  backup_retention_days = var.backup_retention_days
  
  # Compliance settings
  enable_audit_logging = contains(var.compliance_standards, "HIPAA") || contains(var.compliance_standards, "SOC2")
  
  tags = local.common_tags
  
  depends_on = [module.security]
}

# Storage Module (Cloudflare R2)
module "storage" {
  source = "./modules/storage"
  
  project_name    = local.project_name
  environment     = var.environment
  
  # Cloudflare R2 configuration
  cloudflare_account_id = var.cloudflare_account_id
  bucket_name          = "${local.project_name}-${var.environment}-uploads"
  
  # Zero Trust Access protection
  enable_zero_trust    = var.enable_zero_trust
  zero_trust_policies  = module.cloudflare_zero_trust.storage_policies
  
  # Encryption
  enable_encryption = true
  
  # Lifecycle policies
  lifecycle_rules = var.storage_lifecycle_rules
  
  # CORS configuration
  cors_rules = var.storage_cors_rules
  
  tags = local.common_tags
}

# Secrets Management Module
module "secrets" {
  source = "./modules/secrets"
  
  project_name = local.project_name
  environment  = var.environment
  
  # Secrets configuration
  secrets_backend = var.secrets_backend # aws-secrets-manager or cloudflare-workers-kv
  
  # KMS encryption
  kms_key_id = module.security.kms_key_id
  
  # Secrets to manage
  secrets = var.application_secrets
  
  tags = local.common_tags
  
  depends_on = [module.security]
}

# Security Module
module "security" {
  source = "./modules/security"
  
  project_name = local.project_name
  environment  = var.environment
  
  # WAF Configuration
  enable_waf        = var.enable_waf
  waf_rule_sets     = var.waf_rule_sets
  waf_rate_limits   = var.waf_rate_limits
  
  # Firewall Rules
  firewall_rules = var.firewall_rules
  
  # DDoS Protection
  enable_ddos_protection = var.enable_ddos_protection
  
  # Bot Management
  enable_bot_management = var.enable_bot_management
  bot_fight_mode        = var.bot_fight_mode
  
  # SSL/TLS Configuration
  ssl_mode              = "strict"
  minimum_tls_version   = "1.2"
  
  # KMS Key for encryption
  create_kms_key = true
  kms_key_alias  = "${local.project_name}-${var.environment}"
  
  tags = local.common_tags
}

# Compliance Module
module "compliance" {
  source = "./modules/compliance"
  
  project_name = local.project_name
  environment  = var.environment
  
  # Compliance standards
  compliance_standards = var.compliance_standards
  
  # Logging and auditing
  enable_cloudtrail     = contains(var.compliance_standards, "HIPAA") || contains(var.compliance_standards, "SOC2")
  enable_cloudwatch_logs = true
  log_retention_days    = var.log_retention_days
  
  # Data residency
  data_residency_region = var.data_residency_region
  
  # Encryption requirements
  enforce_encryption_at_rest    = true
  enforce_encryption_in_transit = true
  
  # Access controls
  enable_mfa_requirement = contains(var.compliance_standards, "HIPAA")
  
  tags = local.common_tags
}

# Monitoring Module
module "monitoring" {
  source = "./modules/monitoring"
  
  project_name = local.project_name
  environment  = var.environment
  
  # Monitoring configuration
  enable_cloudwatch     = var.enable_cloudwatch
  enable_cloudflare_analytics = var.enable_cloudflare_analytics
  
  # Alerting
  alert_email          = var.alert_email
  alert_slack_webhook  = var.alert_slack_webhook
  
  # Log aggregation
  log_aggregation_bucket = "${local.project_name}-${var.environment}-logs"
  
  # Metrics retention
  metrics_retention_days = var.metrics_retention_days
  
  tags = local.common_tags
}
