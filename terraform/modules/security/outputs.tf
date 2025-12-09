# Outputs for Security Module

output "kms_key_id" {
  description = "KMS key ID for encryption"
  value       = var.create_kms_key ? aws_kms_key.main[0].id : var.kms_key_id
}

output "kms_key_arn" {
  description = "KMS key ARN"
  value       = var.create_kms_key ? aws_kms_key.main[0].arn : ""
}

output "waf_rule_ids" {
  description = "WAF rule IDs"
  value = {
    managed_rules = var.enable_waf ? cloudflare_ruleset.waf_managed_rules[0].id : null
    custom_rules  = var.enable_waf && length(var.custom_waf_rules) > 0 ? cloudflare_ruleset.waf_custom_rules[0].id : null
    firewall_rules = length(var.firewall_rules) > 0 ? cloudflare_ruleset.firewall_rules[0].id : null
  }
}

output "security_group_ids" {
  description = "Security group IDs"
  value = {
    backend  = var.create_security_groups ? aws_security_group.backend[0].id : null
    database = var.create_security_groups ? aws_security_group.database[0].id : null
  }
}

output "rate_limit_ids" {
  description = "Rate limit rule IDs"
  value = {
    for k, v in cloudflare_rate_limit.api_rate_limits :
    k => v.id
  }
}

output "ip_list_ids" {
  description = "IP list IDs"
  value = {
    allowlist = var.enable_ip_allowlist ? cloudflare_list.ip_allowlist[0].id : null
    denylist  = var.enable_ip_denylist ? cloudflare_list.ip_denylist[0].id : null
  }
}

output "secret_arns" {
  description = "Secret ARNs"
  value = {
    for k, v in aws_secretsmanager_secret.app_secrets :
    k => v.arn
  }
  sensitive = true
}
