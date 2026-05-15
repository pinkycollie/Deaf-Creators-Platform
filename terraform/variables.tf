# Variables for Deaf Creator Platform Terraform Configuration

# ===================
# Provider Configuration
# ===================

variable "cloudflare_api_token" {
  description = "Cloudflare API token with appropriate permissions"
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare account ID"
  type        = string
}

variable "cloudflare_zone_id" {
  description = "Cloudflare zone ID for the domain"
  type        = string
}

variable "vercel_api_token" {
  description = "Vercel API token for deployment management"
  type        = string
  sensitive   = true
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

# ===================
# Project Configuration
# ===================

variable "environment" {
  description = "Environment name (mvp, production, enterprise)"
  type        = string
  validation {
    condition     = contains(["mvp", "production", "enterprise", "staging"], var.environment)
    error_message = "Environment must be one of: mvp, production, enterprise, staging"
  }
}

variable "domain" {
  description = "Primary domain for the platform"
  type        = string
}

variable "git_repository" {
  description = "Git repository URL"
  type        = string
}

# ===================
# Cloudflare Zero Trust Access
# ===================

variable "enable_zero_trust" {
  description = "Enable Cloudflare Zero Trust Access"
  type        = bool
  default     = false
}

variable "zero_trust_applications" {
  description = "Zero Trust applications to protect"
  type = map(object({
    name             = string
    domain           = string
    type             = string # self_hosted, saas, ssh, vnc, etc.
    session_duration = string
    allowed_idps     = list(string)
    auto_redirect    = bool
  }))
  default = {}
}

variable "identity_providers" {
  description = "Identity providers for Zero Trust Access"
  type = map(object({
    name = string
    type = string # google, github, azure, okta, onelogin, etc.
    config = map(string)
  }))
  default = {}
}

variable "access_policies" {
  description = "Zero Trust Access policies"
  type = map(object({
    name        = string
    decision    = string # allow, deny, non_identity, bypass
    precedence  = number
    include     = list(map(string))
    exclude     = list(map(string))
    require     = list(map(string))
  }))
  default = {}
}

# ===================
# Backend Configuration
# ===================

variable "backend_type" {
  description = "Backend deployment type (lambda, workers, ec2)"
  type        = string
  default     = "lambda"
  validation {
    condition     = contains(["lambda", "workers", "ec2"], var.backend_type)
    error_message = "Backend type must be one of: lambda, workers, ec2"
  }
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones for multi-AZ deployment"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

# ===================
# Database Configuration
# ===================

variable "database_type" {
  description = "Database type (neon, rds, supabase)"
  type        = string
  default     = "neon"
  validation {
    condition     = contains(["neon", "rds", "supabase"], var.database_type)
    error_message = "Database type must be one of: neon, rds, supabase"
  }
}

variable "backup_retention_days" {
  description = "Number of days to retain database backups"
  type        = number
  default     = 30
}

# ===================
# Storage Configuration
# ===================

variable "storage_lifecycle_rules" {
  description = "Lifecycle rules for object storage"
  type = list(object({
    id          = string
    enabled     = bool
    prefix      = string
    expiration_days = number
  }))
  default = [
    {
      id              = "expire-old-uploads"
      enabled         = true
      prefix          = "temp/"
      expiration_days = 7
    }
  ]
}

variable "storage_cors_rules" {
  description = "CORS rules for object storage"
  type = list(object({
    allowed_origins = list(string)
    allowed_methods = list(string)
    allowed_headers = list(string)
    max_age_seconds = number
  }))
  default = []
}

# ===================
# Security Configuration
# ===================

variable "enable_waf" {
  description = "Enable Web Application Firewall"
  type        = bool
  default     = true
}

variable "waf_rule_sets" {
  description = "WAF rule sets to enable"
  type        = list(string)
  default     = [
    "OWASP_ModSecurity_Core_Rule_Set",
    "Cloudflare_Managed_Ruleset",
    "Cloudflare_OWASP_Core_Ruleset"
  ]
}

variable "waf_rate_limits" {
  description = "Rate limiting rules for WAF"
  type = map(object({
    threshold    = number
    period       = number
    action       = string
    description  = string
  }))
  default = {
    api_rate_limit = {
      threshold   = 100
      period      = 60
      action      = "challenge"
      description = "Rate limit for API endpoints"
    }
  }
}

variable "firewall_rules" {
  description = "Cloudflare firewall rules"
  type = list(object({
    description = string
    expression  = string
    action      = string
    priority    = number
  }))
  default = []
}

variable "enable_ddos_protection" {
  description = "Enable DDoS protection"
  type        = bool
  default     = true
}

variable "enable_bot_management" {
  description = "Enable bot management"
  type        = bool
  default     = true
}

variable "bot_fight_mode" {
  description = "Bot fight mode (on, off)"
  type        = string
  default     = "on"
}

# ===================
# Compliance Configuration
# ===================

variable "compliance_standards" {
  description = "Compliance standards to adhere to"
  type        = list(string)
  default     = []
  validation {
    condition = alltrue([
      for standard in var.compliance_standards :
      contains(["HIPAA", "GDPR", "SOC2", "PCI-DSS"], standard)
    ])
    error_message = "Compliance standards must be one or more of: HIPAA, GDPR, SOC2, PCI-DSS"
  }
}

variable "log_retention_days" {
  description = "Number of days to retain logs for compliance"
  type        = number
  default     = 90
}

variable "data_residency_region" {
  description = "Region for data residency compliance"
  type        = string
  default     = "us-east-1"
}

# ===================
# Secrets Management
# ===================

variable "secrets_backend" {
  description = "Secrets management backend (aws-secrets-manager, cloudflare-workers-kv)"
  type        = string
  default     = "aws-secrets-manager"
}

variable "application_secrets" {
  description = "Application secrets to manage"
  type        = map(string)
  sensitive   = true
  default     = {}
}

# ===================
# Monitoring Configuration
# ===================

variable "enable_cloudwatch" {
  description = "Enable AWS CloudWatch monitoring"
  type        = bool
  default     = true
}

variable "enable_cloudflare_analytics" {
  description = "Enable Cloudflare Analytics"
  type        = bool
  default     = true
}

variable "alert_email" {
  description = "Email address for alerts"
  type        = string
  default     = ""
}

variable "alert_slack_webhook" {
  description = "Slack webhook URL for alerts"
  type        = string
  default     = ""
  sensitive   = true
}

variable "metrics_retention_days" {
  description = "Number of days to retain metrics"
  type        = number
  default     = 30
}

# ===================
# Frontend Configuration
# ===================

variable "frontend_env_vars" {
  description = "Environment variables for frontend deployment"
  type        = map(string)
  sensitive   = true
  default     = {}
}
