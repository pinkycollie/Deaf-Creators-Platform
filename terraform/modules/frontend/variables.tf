variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "hosting_provider" {
  description = "Frontend hosting provider (vercel, s3, cloudflare_pages)"
  type        = string
}

variable "vercel_project_name" {
  description = "Vercel project name"
  type        = string
  default     = ""
}

variable "vercel_framework" {
  description = "Framework for Vercel deployment"
  type        = string
  default     = "nextjs"
}

variable "vercel_build_command" {
  description = "Build command for Vercel"
  type        = string
  default     = "npm run build"
}

variable "vercel_output_directory" {
  description = "Output directory for Vercel"
  type        = string
  default     = ".next"
}

variable "s3_bucket_name" {
  description = "S3 bucket name for frontend hosting"
  type        = string
  default     = ""
}

variable "cloudfront_enabled" {
  description = "Enable CloudFront CDN for S3 frontend"
  type        = bool
  default     = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare account ID"
  type        = string
  default     = ""
}

variable "cloudflare_pages_project" {
  description = "Cloudflare Pages project name"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
