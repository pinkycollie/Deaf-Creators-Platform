# Monitoring and Observability Module
# Supports AWS CloudWatch and basic monitoring setup

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "application" {
  count = var.monitoring_enabled ? 1 : 0

  name              = "/aws/application/${var.project_name}-${var.environment}"
  retention_in_days = var.log_retention_days

  tags = merge(var.tags, {
    Name = "${var.project_name}-logs"
  })
}

resource "aws_cloudwatch_log_group" "frontend" {
  count = var.monitoring_enabled ? 1 : 0

  name              = "/aws/frontend/${var.project_name}-${var.environment}"
  retention_in_days = var.log_retention_days

  tags = merge(var.tags, {
    Name        = "${var.project_name}-frontend-logs"
    Component   = "frontend"
  })
}

resource "aws_cloudwatch_log_group" "backend" {
  count = var.monitoring_enabled ? 1 : 0

  name              = "/aws/backend/${var.project_name}-${var.environment}"
  retention_in_days = var.log_retention_days

  tags = merge(var.tags, {
    Name      = "${var.project_name}-backend-logs"
    Component = "backend"
  })
}

# SNS Topic for Alarms
resource "aws_sns_topic" "alarms" {
  count = var.monitoring_enabled && var.alarm_email != "" ? 1 : 0

  name = "${var.project_name}-${var.environment}-alarms"

  tags = var.tags
}

resource "aws_sns_topic_subscription" "alarm_email" {
  count = var.monitoring_enabled && var.alarm_email != "" ? 1 : 0

  topic_arn = aws_sns_topic.alarms[0].arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  count = var.monitoring_enabled && var.alarm_email != "" ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors application error rate"
  alarm_actions       = [aws_sns_topic.alarms[0].arn]

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "high_latency" {
  count = var.monitoring_enabled && var.alarm_email != "" ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-high-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Average"
  threshold           = "3000"
  alarm_description   = "This metric monitors application latency"
  alarm_actions       = [aws_sns_topic.alarms[0].arn]

  tags = var.tags
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  count = var.monitoring_enabled ? 1 : 0

  dashboard_name = "${var.project_name}-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", { stat = "Sum" }],
            [".", "Errors", { stat = "Sum" }],
            [".", "Duration", { stat = "Average" }]
          ]
          period = 300
          stat   = "Average"
          region = data.aws_region.current.name
          title  = "Lambda Metrics"
        }
      },
      {
        type = "log"
        properties = {
          query   = "fields @timestamp, @message | sort @timestamp desc | limit 20"
          region  = data.aws_region.current.name
          title   = "Recent Logs"
        }
      }
    ]
  })
}

data "aws_region" "current" {}

# CloudWatch Insights Queries
resource "aws_cloudwatch_query_definition" "error_logs" {
  count = var.monitoring_enabled ? 1 : 0

  name = "${var.project_name}-${var.environment}-error-logs"

  log_group_names = [
    aws_cloudwatch_log_group.application[0].name,
    aws_cloudwatch_log_group.backend[0].name
  ]

  query_string = <<-QUERY
    fields @timestamp, @message, @logStream
    | filter @message like /ERROR/
    | sort @timestamp desc
    | limit 100
  QUERY
}

resource "aws_cloudwatch_query_definition" "performance_metrics" {
  count = var.monitoring_enabled ? 1 : 0

  name = "${var.project_name}-${var.environment}-performance"

  log_group_names = [
    aws_cloudwatch_log_group.application[0].name
  ]

  query_string = <<-QUERY
    fields @timestamp, @message
    | filter @message like /duration/
    | stats avg(duration), max(duration), min(duration) by bin(5m)
  QUERY
}
