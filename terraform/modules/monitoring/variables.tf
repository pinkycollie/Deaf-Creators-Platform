variable "project_name" { type = string }
variable "environment" { type = string }
variable "enable_cloudwatch" { type = bool; default = true }
variable "enable_cloudflare_analytics" { type = bool; default = true }
variable "alert_email" { type = string; default = "" }
variable "alert_slack_webhook" { type = string; default = ""; sensitive = true }
variable "log_aggregation_bucket" { type = string; default = "" }
variable "metrics_retention_days" { type = number; default = 30 }
variable "tags" { type = map(string); default = {} }
