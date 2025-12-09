# Secrets Management Module
# Supports AWS Secrets Manager and Azure Key Vault

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# AWS Secrets Manager
resource "aws_secretsmanager_secret" "app_secrets" {
  for_each = var.secrets_provider == "aws_secrets_manager" ? toset(var.secrets_list) : []

  name                    = "${var.project_name}-${var.environment}-${each.key}"
  recovery_window_in_days = var.aws_recovery_window_days

  tags = merge(var.tags, {
    Name   = each.key
    Secret = "true"
  })
}

# Placeholder values for secrets (to be updated manually or via automation)
resource "aws_secretsmanager_secret_version" "app_secrets" {
  for_each = var.secrets_provider == "aws_secrets_manager" ? toset(var.secrets_list) : []

  secret_id = aws_secretsmanager_secret.app_secrets[each.key].id
  secret_string = jsonencode({
    value       = "PLACEHOLDER_${upper(replace(each.key, "-", "_"))}"
    description = "Secret for ${each.key}. Update this value after deployment."
    updated_at  = timestamp()
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}

# IAM Policy for accessing secrets
resource "aws_iam_policy" "secrets_access" {
  count = var.secrets_provider == "aws_secrets_manager" ? 1 : 0

  name        = "${var.project_name}-${var.environment}-secrets-access"
  description = "Policy for accessing application secrets"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [
          for secret in aws_secretsmanager_secret.app_secrets : secret.arn
        ]
      }
    ]
  })

  tags = var.tags
}

# Azure Key Vault Configuration (Placeholder)
# Note: Requires Azure provider to be configured
locals {
  azure_keyvault_config = var.secrets_provider == "azure_key_vault" ? {
    name                = "${var.project_name}-${var.environment}-kv"
    resource_group_name = "${var.project_name}-${var.environment}-rg"
    secrets             = var.secrets_list
  } : null
}

output "azure_keyvault_config" {
  description = "Azure Key Vault configuration (manual setup required)"
  value       = local.azure_keyvault_config
}
