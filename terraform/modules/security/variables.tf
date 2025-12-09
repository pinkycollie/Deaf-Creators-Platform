# Variables for Security Module

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "zone_id" {
  description = "Cloudflare zone ID"
  type        = string
  default     = ""
}

variable "account_id" {
  description = "Cloudflare account ID"
  type        = string
  default     = ""
}

variable "domain" {
  description = "Primary domain"
  type        = string
  default     = ""
}

# WAF Configuration
variable "enable_waf" {
  description = "Enable Web Application Firewall"
  type        = bool
  default     = true
}

variable "waf_rule_sets" {
  description = "WAF managed rule set IDs"
  type        = list(string)
  default     = []
}

variable "custom_waf_rules" {
  description = "Custom WAF rules"
  type = list(object({
    action      = string
    expression  = string
    description = string
    enabled     = bool
    action_parameters = optional(map(any))
  }))
  default = []
}

variable "waf_rate_limits" {
  description = "Rate limiting configurations"
  type = map(object({
    threshold   = number
    period      = number
    action      = string
    description = string
    url_pattern = optional(string)
    timeout     = optional(number)
  }))
  default = {}
}

# Firewall Configuration
variable "firewall_rules" {
  description = "Firewall rule configurations"
  type = list(object({
    description = string
    expression  = string
    action      = string
    priority    = number
  }))
  default = []
}

# DDoS Protection
variable "enable_ddos_protection" {
  description = "Enable DDoS protection"
  type        = bool
  default     = true
}

# Bot Management
variable "enable_bot_management" {
  description = "Enable bot management"
  type        = bool
  default     = true
}

variable "bot_fight_mode" {
  description = "Bot fight mode setting"
  type        = string
  default     = "on"
}

# SSL/TLS Configuration
variable "ssl_mode" {
  description = "SSL mode (off, flexible, full, strict)"
  type        = string
  default     = "strict"
}

variable "minimum_tls_version" {
  description = "Minimum TLS version"
  type        = string
  default     = "1.2"
}

# KMS Configuration
variable "create_kms_key" {
  description = "Create KMS key for encryption"
  type        = bool
  default     = true
}

variable "kms_key_alias" {
  description = "Alias for KMS key"
  type        = string
  default     = ""
}

variable "kms_key_id" {
  description = "Existing KMS key ID (if not creating new)"
  type        = string
  default     = ""
}

# Security Groups
variable "create_security_groups" {
  description = "Create AWS security groups"
  type        = bool
  default     = false
}

variable "vpc_id" {
  description = "VPC ID for security groups"
  type        = string
  default     = ""
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

# IP Lists
variable "enable_ip_allowlist" {
  description = "Enable IP allowlist"
  type        = bool
  default     = false
}

variable "ip_allowlist" {
  description = "List of allowed IPs"
  type        = list(string)
  default     = []
}

variable "enable_ip_denylist" {
  description = "Enable IP denylist"
  type        = bool
  default     = false
}

variable "ip_denylist" {
  description = "List of denied IPs"
  type        = list(string)
  default     = []
}

# Secrets Management
variable "encrypt_secrets" {
  description = "Encrypt application secrets"
  type        = bool
  default     = true
}

variable "app_secrets" {
  description = "Application secrets to encrypt"
  type        = map(string)
  default     = {}
  sensitive   = true
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
