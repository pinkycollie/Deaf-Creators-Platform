# Variables for Compliance Module

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "compliance_standards" {
  description = "List of compliance standards to adhere to"
  type        = list(string)
  default     = []
  validation {
    condition = alltrue([
      for standard in var.compliance_standards :
      contains(["HIPAA", "GDPR", "SOC2", "PCI-DSS"], standard)
    ])
    error_message = "Compliance standards must be one or more of: HIPAA, GDPR, SOC2, PCI-DSS"
  }
}

# CloudTrail Configuration
variable "enable_cloudtrail" {
  description = "Enable AWS CloudTrail for audit logging"
  type        = bool
  default     = true
}

# CloudWatch Configuration
variable "enable_cloudwatch_logs" {
  description = "Enable CloudWatch Logs"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "Number of days to retain logs"
  type        = number
  default     = 90
  validation {
    condition     = var.log_retention_days >= 30
    error_message = "Log retention must be at least 30 days for compliance"
  }
}

# Encryption Requirements
variable "enforce_encryption_at_rest" {
  description = "Enforce encryption at rest for all data stores"
  type        = bool
  default     = true
}

variable "enforce_encryption_in_transit" {
  description = "Enforce encryption in transit for all communications"
  type        = bool
  default     = true
}

variable "kms_key_id" {
  description = "KMS key ID for encryption"
  type        = string
  default     = ""
}

# Access Control
variable "enable_mfa_requirement" {
  description = "Require MFA for all users"
  type        = bool
  default     = false
}

# Data Residency
variable "data_residency_region" {
  description = "AWS region for data residency compliance"
  type        = string
  default     = "us-east-1"
}

# GDPR-specific
variable "create_data_bucket" {
  description = "Create data bucket with GDPR-compliant lifecycle"
  type        = bool
  default     = false
}

variable "data_bucket_id" {
  description = "Existing data bucket ID for GDPR lifecycle policy"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
