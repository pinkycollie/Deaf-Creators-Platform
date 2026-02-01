# Outputs from Terraform configuration
# These values can be used by other tools or displayed after deployment

# Frontend Outputs
output "frontend_url" {
  description = "Frontend application URL"
  value       = module.frontend.url
}

output "frontend_deployment_id" {
  description = "Frontend deployment identifier"
  value       = module.frontend.deployment_id
}

# Backend Outputs
output "backend_endpoint" {
  description = "Backend API endpoint URL"
  value       = module.backend.endpoint
}

output "backend_api_gateway_id" {
  description = "API Gateway ID (if applicable)"
  value       = module.backend.api_gateway_id
}

# Database Outputs
output "database_endpoint" {
  description = "Database connection endpoint"
  value       = module.database.endpoint
  sensitive   = true
}

output "database_name" {
  description = "Database name"
  value       = module.database.database_name
}

output "database_connection_string" {
  description = "Database connection string"
  value       = module.database.connection_string
  sensitive   = true
}

# Storage Outputs
output "storage_bucket_name" {
  description = "Object storage bucket name"
  value       = module.storage.bucket_name
}

output "storage_bucket_endpoint" {
  description = "Object storage bucket endpoint"
  value       = module.storage.bucket_endpoint
}

output "storage_cdn_url" {
  description = "CDN URL for storage bucket"
  value       = module.storage.cdn_url
}

# DNS Outputs
output "domain_name" {
  description = "Primary domain name"
  value       = module.dns.domain_name
}

output "cdn_endpoint" {
  description = "CDN endpoint URL"
  value       = module.dns.cdn_endpoint
}

# Secrets Outputs
output "secrets_manager_arn" {
  description = "Secrets manager ARN (if using AWS)"
  value       = module.secrets.secrets_manager_arn
  sensitive   = true
}

# Monitoring Outputs
output "monitoring_dashboard_url" {
  description = "Monitoring dashboard URL"
  value       = module.monitoring.dashboard_url
}

output "log_group_name" {
  description = "CloudWatch log group name"
  value       = module.monitoring.log_group_name
}

# CI/CD Outputs
output "github_actions_role_arn" {
  description = "IAM role ARN for GitHub Actions"
  value       = module.cicd.github_actions_role_arn
}

output "deployment_status" {
  description = "Overall deployment status"
  value = {
    frontend_ready  = module.frontend.id != ""
    backend_ready   = module.backend.id != ""
    database_ready  = module.database.id != ""
    storage_ready   = module.storage.id != ""
    dns_configured  = module.dns.id != ""
  }
}

# Combined Environment Information
output "environment_info" {
  description = "Environment configuration summary"
  value = {
    project     = var.project_name
    environment = var.environment
    region      = var.aws_region
    providers = {
      frontend = var.frontend_hosting_provider
      backend  = var.backend_hosting_provider
      database = var.database_provider
      storage  = var.storage_provider
      dns      = var.dns_provider
    }
  }
}
