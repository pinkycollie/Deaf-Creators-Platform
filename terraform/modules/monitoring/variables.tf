variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "monitoring_enabled" {
  description = "Enable monitoring and observability"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "alarm_email" {
  description = "Email address for alarm notifications"
  type        = string
  default     = ""
}

variable "frontend_id" {
  description = "Frontend resource ID to monitor"
  type        = string
}

variable "backend_id" {
  description = "Backend resource ID to monitor"
  type        = string
}

variable "database_id" {
  description = "Database resource ID to monitor"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
