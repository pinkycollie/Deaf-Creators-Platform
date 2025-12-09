output "id" {
  description = "Monitoring configuration identifier"
  value       = "${var.project_name}-monitoring"
}

output "log_group_name" {
  description = "CloudWatch log group name"
  value = (
    var.monitoring_enabled && length(aws_cloudwatch_log_group.application) > 0 ? 
      aws_cloudwatch_log_group.application[0].name :
    null
  )
}

output "dashboard_url" {
  description = "CloudWatch dashboard URL"
  value = (
    var.monitoring_enabled && length(aws_cloudwatch_dashboard.main) > 0 ? 
      "https://console.aws.amazon.com/cloudwatch/home?region=${data.aws_region.current.name}#dashboards:name=${aws_cloudwatch_dashboard.main[0].dashboard_name}" :
    null
  )
}

output "alarm_topic_arn" {
  description = "SNS topic ARN for alarms"
  value = (
    var.monitoring_enabled && var.alarm_email != "" && length(aws_sns_topic.alarms) > 0 ? 
      aws_sns_topic.alarms[0].arn :
    null
  )
}

output "log_groups" {
  description = "Map of log group names"
  value = var.monitoring_enabled ? {
    application = length(aws_cloudwatch_log_group.application) > 0 ? aws_cloudwatch_log_group.application[0].name : null
    frontend    = length(aws_cloudwatch_log_group.frontend) > 0 ? aws_cloudwatch_log_group.frontend[0].name : null
    backend     = length(aws_cloudwatch_log_group.backend) > 0 ? aws_cloudwatch_log_group.backend[0].name : null
  } : {}
}
