variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "dns_provider" {
  description = "DNS provider (cloudflare, route53)"
  type        = string
}

variable "domain_name" {
  description = "Primary domain name"
  type        = string
}

variable "subdomain_prefix" {
  description = "Subdomain prefix for the application"
  type        = string
}

variable "cloudflare_zone_id" {
  description = "Cloudflare zone ID"
  type        = string
  default     = ""
}

variable "route53_zone_id" {
  description = "Route53 hosted zone ID"
  type        = string
  default     = ""
}

variable "cdn_enabled" {
  description = "Enable CDN for the application"
  type        = bool
  default     = true
}

variable "frontend_endpoint" {
  description = "Frontend endpoint to point DNS to"
  type        = string
}

variable "backend_endpoint" {
  description = "Backend endpoint to point DNS to"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
