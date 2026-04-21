variable "project_name" { type = string }
variable "environment" { type = string }
variable "domain" { type = string; default = "" }
variable "backend_type" { type = string }
variable "vpc_cidr" { type = string }
variable "availability_zones" { type = list(string) }
variable "enable_zero_trust" { type = bool; default = false }
variable "zero_trust_policies" { type = any; default = {} }
variable "tags" { type = map(string); default = {} }
