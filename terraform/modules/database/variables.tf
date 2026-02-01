variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "database_provider" {
  description = "Database provider (neon, rds, supabase)"
  type        = string
}

variable "postgres_version" {
  description = "PostgreSQL version"
  type        = string
  default     = "15"
}

variable "postgres_instance_class" {
  description = "Database instance class (for RDS)"
  type        = string
  default     = "db.t4g.micro"
}

variable "database_name" {
  description = "Database name"
  type        = string
}

variable "master_username" {
  description = "Database master username"
  type        = string
  default     = "dbadmin"
}

variable "allocated_storage" {
  description = "Allocated storage in GB (for RDS)"
  type        = number
  default     = 20
}

variable "multi_az" {
  description = "Enable multi-AZ deployment (for RDS)"
  type        = bool
  default     = false
}

variable "backup_retention_days" {
  description = "Backup retention period in days"
  type        = number
  default     = 7
}

variable "subnet_ids" {
  description = "Subnet IDs for RDS deployment"
  type        = list(string)
  default     = []
}

variable "neon_project_name" {
  description = "Neon project name"
  type        = string
  default     = ""
}

variable "neon_region" {
  description = "Neon region"
  type        = string
  default     = "aws-us-east-2"
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
