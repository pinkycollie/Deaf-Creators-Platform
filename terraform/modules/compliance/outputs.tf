# Outputs for Compliance Module

output "cloudtrail_arn" {
  description = "CloudTrail ARN"
  value       = var.enable_cloudtrail ? aws_cloudtrail.main[0].arn : null
}

output "audit_log_bucket" {
  description = "Audit log bucket name"
  value       = var.enable_cloudtrail ? aws_s3_bucket.audit_logs[0].id : null
}

output "config_recorder_name" {
  description = "AWS Config recorder name"
  value = (
    contains(var.compliance_standards, "HIPAA") || contains(var.compliance_standards, "SOC2")
    ? aws_config_configuration_recorder.main[0].name
    : null
  )
}

output "log_group_name" {
  description = "CloudWatch log group name"
  value       = var.enable_cloudwatch_logs ? aws_cloudwatch_log_group.app_logs[0].name : null
}

output "log_group_arn" {
  description = "CloudWatch log group ARN"
  value       = var.enable_cloudwatch_logs ? aws_cloudwatch_log_group.app_logs[0].arn : null
}

output "compliance_report" {
  description = "Compliance configuration report"
  value = {
    standards            = var.compliance_standards
    encryption_at_rest   = var.enforce_encryption_at_rest
    encryption_in_transit = var.enforce_encryption_in_transit
    cloudtrail_enabled   = var.enable_cloudtrail
    log_retention_days   = var.log_retention_days
    mfa_required         = var.enable_mfa_requirement
    data_residency       = var.data_residency_region
  }
}

output "config_rules" {
  description = "AWS Config rule names"
  value = {
    encryption_at_rest = var.enforce_encryption_at_rest ? aws_config_config_rule.encryption_at_rest[0].name : null
    s3_encryption      = var.enforce_encryption_at_rest ? aws_config_config_rule.s3_encryption[0].name : null
    mfa_enabled        = var.enable_mfa_requirement ? aws_config_config_rule.mfa_enabled[0].name : null
  }
}
