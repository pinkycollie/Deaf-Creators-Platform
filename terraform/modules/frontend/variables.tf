variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "domain" {
  type = string
}

variable "git_repository" {
  type    = string
  default = ""
}

variable "cloudflare_zone_id" {
  type    = string
  default = ""
}

variable "enable_zero_trust" {
  type    = bool
  default = false
}

variable "zero_trust_policies" {
  type    = any
  default = {}
}

variable "environment_variables" {
  type      = map(string)
  sensitive = true
  default   = {}
}

variable "tags" {
  type    = map(string)
  default = {}
}
