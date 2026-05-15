# Monitoring Module

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "main" {
  count = var.enable_cloudwatch ? 1 : 0
  
  name              = "/aws/${var.project_name}/${var.environment}"
  retention_in_days = var.metrics_retention_days
  
  tags = var.tags
}

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  count = var.alert_email != "" ? 1 : 0
  
  name = "${var.project_name}-${var.environment}-alerts"
  
  tags = var.tags
}

resource "aws_sns_topic_subscription" "email" {
  count = var.alert_email != "" ? 1 : 0
  
  topic_arn = aws_sns_topic.alerts[0].arn
  protocol  = "email"
  endpoint  = var.alert_email
}

output "dashboard_url" {
  value = "https://console.aws.amazon.com/cloudwatch"
}

output "log_group_name" {
  value = var.enable_cloudwatch ? aws_cloudwatch_log_group.main[0].name : null
}
