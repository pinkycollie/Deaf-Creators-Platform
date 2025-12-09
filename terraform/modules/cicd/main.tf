# CI/CD Pipeline Module
# Supports GitHub Actions integration with AWS and Vercel

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    github = {
      source  = "integrations/github"
      version = "~> 5.0"
    }
  }
}

# IAM Role for GitHub Actions (OIDC)
resource "aws_iam_openid_connect_provider" "github" {
  count = var.cicd_enabled ? 1 : 0

  url = "https://token.actions.githubusercontent.com"

  client_id_list = ["sts.amazonaws.com"]

  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]

  tags = var.tags
}

resource "aws_iam_role" "github_actions" {
  count = var.cicd_enabled ? 1 : 0

  name = "${var.project_name}-${var.environment}-github-actions"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github[0].arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            "token.actions.githubusercontent.com:sub" = "repo:${var.github_owner}/${var.github_repository}:*"
          }
        }
      }
    ]
  })

  tags = var.tags
}

# IAM Policy for GitHub Actions
resource "aws_iam_role_policy" "github_actions" {
  count = var.cicd_enabled ? 1 : 0

  name = "${var.project_name}-${var.environment}-github-actions-policy"
  role = aws_iam_role.github_actions[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.project_name}-*",
          "arn:aws:s3:::${var.project_name}-*/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "lambda:UpdateFunctionCode",
          "lambda:GetFunction",
          "lambda:PublishVersion"
        ]
        Resource = "arn:aws:lambda:*:*:function:${var.project_name}-*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudfront:CreateInvalidation",
          "cloudfront:GetInvalidation"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = "arn:aws:secretsmanager:*:*:secret:${var.project_name}-*"
      }
    ]
  })
}

# GitHub Repository Secrets
resource "github_actions_secret" "aws_access_key" {
  count = var.cicd_enabled && var.aws_access_key != "" ? 1 : 0

  repository      = var.github_repository
  secret_name     = "AWS_ACCESS_KEY_ID"
  plaintext_value = var.aws_access_key
}

resource "github_actions_secret" "aws_secret_key" {
  count = var.cicd_enabled && var.aws_secret_key != "" ? 1 : 0

  repository      = var.github_repository
  secret_name     = "AWS_SECRET_ACCESS_KEY"
  plaintext_value = var.aws_secret_key
}

resource "github_actions_secret" "vercel_token" {
  count = var.cicd_enabled && var.vercel_token != "" ? 1 : 0

  repository      = var.github_repository
  secret_name     = "VERCEL_TOKEN"
  plaintext_value = var.vercel_token
}

resource "github_actions_secret" "github_actions_role" {
  count = var.cicd_enabled ? 1 : 0

  repository      = var.github_repository
  secret_name     = "GITHUB_ACTIONS_ROLE_ARN"
  plaintext_value = aws_iam_role.github_actions[0].arn
}

# Example GitHub Actions Workflow Configuration
locals {
  workflow_config = var.cicd_enabled ? {
    name = "CI/CD Pipeline"
    triggers = var.workflow_triggers
    jobs = {
      build_and_deploy = {
        runs_on = "ubuntu-latest"
        permissions = {
          contents = "read"
          id-token = "write"
        }
        steps = [
          {
            name = "Checkout code"
            uses = "actions/checkout@v4"
          },
          {
            name = "Configure AWS credentials"
            uses = "aws-actions/configure-aws-credentials@v4"
            with = {
              role-to-assume = aws_iam_role.github_actions[0].arn
              aws-region     = data.aws_region.current.name
            }
          },
          {
            name = "Deploy to Vercel"
            uses = "amondnet/vercel-action@v25"
            with = {
              vercel-token = "${{ secrets.VERCEL_TOKEN }}"
              vercel-org-id = "${{ secrets.VERCEL_ORG_ID }}"
              vercel-project-id = "${{ secrets.VERCEL_PROJECT_ID }}"
            }
          }
        ]
      }
    }
  } : null
}

data "aws_region" "current" {}

output "workflow_config" {
  description = "GitHub Actions workflow configuration template"
  value       = local.workflow_config
}
