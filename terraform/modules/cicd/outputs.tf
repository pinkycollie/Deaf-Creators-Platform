output "id" {
  description = "CI/CD configuration identifier"
  value       = "${var.project_name}-cicd"
}

output "github_actions_role_arn" {
  description = "IAM role ARN for GitHub Actions"
  value = (
    var.cicd_enabled && length(aws_iam_role.github_actions) > 0 ? 
      aws_iam_role.github_actions[0].arn :
    null
  )
}

output "github_oidc_provider_arn" {
  description = "GitHub OIDC provider ARN"
  value = (
    var.cicd_enabled && length(aws_iam_openid_connect_provider.github) > 0 ? 
      aws_iam_openid_connect_provider.github[0].arn :
    null
  )
}

output "repository_secrets_configured" {
  description = "List of configured repository secrets"
  value = var.cicd_enabled ? [
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "VERCEL_TOKEN",
    "GITHUB_ACTIONS_ROLE_ARN"
  ] : []
}
