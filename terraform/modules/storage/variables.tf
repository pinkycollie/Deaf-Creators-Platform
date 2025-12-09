variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "storage_provider" {
  description = "Object storage provider (s3, cloudflare_r2)"
  type        = string
}

variable "s3_bucket_name" {
  description = "S3 bucket name for object storage"
  type        = string
  default     = ""
}

variable "s3_versioning" {
  description = "Enable versioning for S3 bucket"
  type        = bool
  default     = true
}

variable "s3_lifecycle_rules" {
  description = "S3 lifecycle rules"
  type        = list(object({
    id              = string
    enabled         = bool
    prefix          = string
    expiration_days = number
  }))
  default = []
}

variable "cloudflare_account_id" {
  description = "Cloudflare account ID"
  type        = string
  default     = ""
}

variable "r2_bucket_name" {
  description = "Cloudflare R2 bucket name"
  type        = string
  default     = ""
}

variable "cors_allowed_origins" {
  description = "CORS allowed origins"
  type        = list(string)
  default     = ["*"]
}

variable "cors_allowed_methods" {
  description = "CORS allowed methods"
  type        = list(string)
  default     = ["GET", "PUT", "POST", "DELETE"]
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
