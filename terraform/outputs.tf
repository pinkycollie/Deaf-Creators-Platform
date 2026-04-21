# Outputs for Deaf Creator Platform Terraform Configuration

# ===================
# Cloudflare Zero Trust
# ===================

output "zero_trust_team_name" {
  description = "Cloudflare Zero Trust team name"
  value       = module.cloudflare_zero_trust.team_name
}

output "zero_trust_applications" {
  description = "Zero Trust Access applications"
  value       = module.cloudflare_zero_trust.applications
  sensitive   = true
}

output "zero_trust_access_urls" {
  description = "URLs for Zero Trust Access applications"
  value       = module.cloudflare_zero_trust.access_urls
}

# ===================
# Frontend
# ===================

output "frontend_url" {
  description = "Frontend application URL"
  value       = module.frontend.url
}

output "frontend_deployment_id" {
  description = "Frontend deployment ID"
  value       = module.frontend.deployment_id
}

# ===================
# Backend
# ===================

output "backend_endpoint" {
  description = "Backend API endpoint"
  value       = module.backend.endpoint
  sensitive   = true
}

output "backend_vpc_id" {
  description = "VPC ID for backend infrastructure"
  value       = module.backend.vpc_id
}

# ===================
# Database
# ===================

output "database_endpoint" {
  description = "Database connection endpoint"
  value       = module.database.endpoint
  sensitive   = true
}

output "database_connection_string" {
  description = "Database connection string"
  value       = module.database.connection_string
  sensitive   = true
}

# ===================
# Storage
# ===================

output "storage_bucket_name" {
  description = "Storage bucket name"
  value       = module.storage.bucket_name
}

output "storage_bucket_domain" {
  description = "Storage bucket domain"
  value       = module.storage.bucket_domain
}

output "storage_access_key_id" {
  description = "Storage access key ID"
  value       = module.storage.access_key_id
  sensitive   = true
}

# ===================
# Security
# ===================

output "waf_rule_ids" {
  description = "WAF rule IDs"
  value       = module.security.waf_rule_ids
}

output "kms_key_id" {
  description = "KMS key ID for encryption"
  value       = module.security.kms_key_id
  sensitive   = true
}

output "security_group_ids" {
  description = "Security group IDs"
  value       = module.security.security_group_ids
}

# ===================
# Compliance
# ===================

output "compliance_report" {
  description = "Compliance configuration report"
  value       = module.compliance.compliance_report
}

output "audit_log_bucket" {
  description = "Audit log bucket name"
  value       = module.compliance.audit_log_bucket
}

output "cloudtrail_arn" {
  description = "CloudTrail ARN for audit logging"
  value       = module.compliance.cloudtrail_arn
}

# ===================
# Monitoring
# ===================

output "monitoring_dashboard_url" {
  description = "Monitoring dashboard URL"
  value       = module.monitoring.dashboard_url
}

output "log_group_name" {
  description = "CloudWatch log group name"
  value       = module.monitoring.log_group_name
}

# ===================
# Summary
# ===================

output "deployment_summary" {
  description = "Deployment summary information"
  value = {
    environment          = var.environment
    domain              = var.domain
    zero_trust_enabled  = var.enable_zero_trust
    waf_enabled         = var.enable_waf
    compliance_standards = var.compliance_standards
    backend_type        = var.backend_type
    database_type       = var.database_type
  }
}
