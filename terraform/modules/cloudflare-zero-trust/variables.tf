# Variables for Cloudflare Zero Trust Access Module

variable "account_id" {
  description = "Cloudflare account ID"
  type        = string
}

variable "zone_id" {
  description = "Cloudflare zone ID"
  type        = string
}

variable "domain" {
  description = "Primary domain"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "enable_zero_trust" {
  description = "Enable Zero Trust Access"
  type        = bool
  default     = true
}

variable "zero_trust_applications" {
  description = "Zero Trust applications configuration"
  type = map(object({
    name             = string
    domain           = string
    type             = string
    session_duration = string
    allowed_idps     = list(string)
    auto_redirect    = bool
  }))
  default = {}
}

variable "identity_providers" {
  description = "Identity provider configurations"
  type = map(object({
    name   = string
    type   = string
    config = map(string)
  }))
  default = {}
}

variable "access_policies" {
  description = "Access policy configurations"
  type = map(object({
    name        = string
    application = string
    decision    = string
    precedence  = number
    include     = list(map(string))
    exclude     = list(map(string))
    require     = list(map(string))
  }))
  default = {}
}

variable "service_tokens" {
  description = "Service token configurations for machine-to-machine auth"
  type = map(object({
    name     = string
    duration = string
  }))
  default = {}
}

variable "gateway_rules" {
  description = "Zero Trust Gateway rules"
  type = map(object({
    name        = string
    description = string
    precedence  = number
    action      = string
    filters     = list(string)
    enabled     = bool
  }))
  default = {}
}

variable "create_tunnel" {
  description = "Create Cloudflare Tunnel for secure backend access"
  type        = bool
  default     = false
}

variable "tunnel_secret" {
  description = "Secret for Cloudflare Tunnel"
  type        = string
  default     = ""
  sensitive   = true
}

variable "tunnel_ingress_rules" {
  description = "Ingress rules for Cloudflare Tunnel"
  type = list(object({
    hostname = string
    service  = string
    origin_request = optional(map(any))
  }))
  default = []
}

variable "admin_email_domain" {
  description = "Email domain for admin users"
  type        = string
  default     = ""
}

variable "developer_email_domain" {
  description = "Email domain for developer users"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
