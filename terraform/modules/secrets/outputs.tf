output "id" {
  description = "Secrets configuration identifier"
  value       = "${var.project_name}-secrets"
}

output "secrets_manager_arn" {
  description = "ARN of secrets (AWS Secrets Manager)"
  value = (
    var.secrets_provider == "aws_secrets_manager" ? 
      { for k, v in aws_secretsmanager_secret.app_secrets : k => v.arn } :
    null
  )
  sensitive = true
}

output "secrets_access_policy_arn" {
  description = "ARN of IAM policy for accessing secrets"
  value = (
    var.secrets_provider == "aws_secrets_manager" && length(aws_iam_policy.secrets_access) > 0 ? 
      aws_iam_policy.secrets_access[0].arn :
    null
  )
}

output "secret_names" {
  description = "List of secret names created"
  value = (
    var.secrets_provider == "aws_secrets_manager" ? 
      [for k, v in aws_secretsmanager_secret.app_secrets : v.name] :
    var.secrets_list
  )
}
