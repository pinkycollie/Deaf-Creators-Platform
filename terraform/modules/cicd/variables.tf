variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "cicd_enabled" {
  description = "Enable CI/CD pipeline setup"
  type        = bool
  default     = true
}

variable "github_repository" {
  description = "GitHub repository name"
  type        = string
}

variable "github_owner" {
  description = "GitHub repository owner"
  type        = string
}

variable "vercel_token" {
  description = "Vercel API token for deployments"
  type        = string
  sensitive   = true
  default     = ""
}

variable "aws_access_key" {
  description = "AWS access key for CI/CD"
  type        = string
  sensitive   = true
  default     = ""
}

variable "aws_secret_key" {
  description = "AWS secret key for CI/CD"
  type        = string
  sensitive   = true
  default     = ""
}

variable "workflow_triggers" {
  description = "GitHub Actions workflow triggers"
  type        = list(string)
  default     = ["push", "pull_request"]
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
