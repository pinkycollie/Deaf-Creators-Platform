variable "project_name" { type = string }
variable "environment" { type = string }
variable "cloudflare_account_id" { type = string }
variable "bucket_name" { type = string }
variable "enable_zero_trust" { type = bool; default = false }
variable "zero_trust_policies" { type = any; default = {} }
variable "enable_encryption" { type = bool; default = true }
variable "lifecycle_rules" { type = list(any); default = [] }
variable "cors_rules" { type = list(any); default = [] }
variable "tags" { type = map(string); default = {} }
