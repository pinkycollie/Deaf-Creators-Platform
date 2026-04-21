variable "project_name" { type = string }
variable "environment" { type = string }
variable "database_type" { type = string }
variable "database_name" { type = string }
variable "enable_encryption" { type = bool; default = true }
variable "kms_key_id" { type = string; default = "" }
variable "backup_retention_days" { type = number; default = 30 }
variable "enable_audit_logging" { type = bool; default = false }
variable "tags" { type = map(string); default = {} }
