variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "secrets_provider" {
  description = "Secrets management provider (aws_secrets_manager, azure_key_vault)"
  type        = string
}

variable "secrets_list" {
  description = "List of secrets to manage"
  type        = list(string)
}

variable "aws_recovery_window_days" {
  description = "Number of days to retain deleted secrets (AWS)"
  type        = number
  default     = 30
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
