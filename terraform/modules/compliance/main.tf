# Compliance Module - HIPAA, GDPR, SOC 2, PCI-DSS

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# CloudTrail for audit logging (required for HIPAA, SOC 2)
resource "aws_cloudtrail" "main" {
  count = var.enable_cloudtrail ? 1 : 0
  
  name                          = "${var.project_name}-${var.environment}-trail"
  s3_bucket_name               = aws_s3_bucket.audit_logs[0].id
  include_global_service_events = true
  is_multi_region_trail        = true
  enable_logging               = true
  enable_log_file_validation   = true
  
  event_selector {
    read_write_type           = "All"
    include_management_events = true
    
    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::*/"]
    }
    
    data_resource {
      type   = "AWS::Lambda::Function"
      values = ["arn:aws:lambda:*:*:function/*"]
    }
  }
  
  insight_selector {
    insight_type = "ApiCallRateInsight"
  }
  
  tags = merge(
    var.tags,
    {
      Name       = "${var.project_name}-${var.environment}-cloudtrail"
      Compliance = join(",", var.compliance_standards)
    }
  )
  
  depends_on = [aws_s3_bucket_policy.audit_logs]
}

# S3 bucket for audit logs
resource "aws_s3_bucket" "audit_logs" {
  count = var.enable_cloudtrail ? 1 : 0
  
  bucket = "${var.project_name}-${var.environment}-audit-logs"
  
  tags = merge(
    var.tags,
    {
      Name       = "${var.project_name}-${var.environment}-audit-logs"
      Purpose    = "Audit Logs"
      Compliance = join(",", var.compliance_standards)
    }
  )
}

# Enable versioning for audit logs (compliance requirement)
resource "aws_s3_bucket_versioning" "audit_logs" {
  count = var.enable_cloudtrail ? 1 : 0
  
  bucket = aws_s3_bucket.audit_logs[0].id
  
  versioning_configuration {
    status = "Enabled"
  }
}

# Server-side encryption for audit logs
resource "aws_s3_bucket_server_side_encryption_configuration" "audit_logs" {
  count = var.enable_cloudtrail ? 1 : 0
  
  bucket = aws_s3_bucket.audit_logs[0].id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = var.kms_key_id
    }
    bucket_key_enabled = true
  }
}

# Block public access for audit logs
resource "aws_s3_bucket_public_access_block" "audit_logs" {
  count = var.enable_cloudtrail ? 1 : 0
  
  bucket = aws_s3_bucket.audit_logs[0].id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Lifecycle policy for audit logs
resource "aws_s3_bucket_lifecycle_configuration" "audit_logs" {
  count = var.enable_cloudtrail ? 1 : 0
  
  bucket = aws_s3_bucket.audit_logs[0].id
  
  rule {
    id     = "archive-old-logs"
    status = "Enabled"
    
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
    
    transition {
      days          = 90
      storage_class = "GLACIER"
    }
    
    expiration {
      days = var.log_retention_days
    }
  }
}

# S3 bucket policy for CloudTrail
resource "aws_s3_bucket_policy" "audit_logs" {
  count = var.enable_cloudtrail ? 1 : 0
  
  bucket = aws_s3_bucket.audit_logs[0].id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.audit_logs[0].arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.audit_logs[0].arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# CloudWatch Log Group for application logs
resource "aws_cloudwatch_log_group" "app_logs" {
  count = var.enable_cloudwatch_logs ? 1 : 0
  
  name              = "/aws/${var.project_name}/${var.environment}"
  retention_in_days = var.log_retention_days
  kms_key_id        = var.kms_key_id
  
  tags = merge(
    var.tags,
    {
      Name       = "${var.project_name}-${var.environment}-logs"
      Compliance = join(",", var.compliance_standards)
    }
  )
}

# CloudWatch Log Stream for different services
resource "aws_cloudwatch_log_stream" "services" {
  for_each = var.enable_cloudwatch_logs ? toset(["api", "frontend", "backend", "database"]) : toset([])
  
  name           = each.key
  log_group_name = aws_cloudwatch_log_group.app_logs[0].name
}

# Config for continuous compliance monitoring
resource "aws_config_configuration_recorder" "main" {
  count = contains(var.compliance_standards, "HIPAA") || contains(var.compliance_standards, "SOC2") ? 1 : 0
  
  name     = "${var.project_name}-${var.environment}-config-recorder"
  role_arn = aws_iam_role.config[0].arn
  
  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }
}

resource "aws_config_delivery_channel" "main" {
  count = contains(var.compliance_standards, "HIPAA") || contains(var.compliance_standards, "SOC2") ? 1 : 0
  
  name           = "${var.project_name}-${var.environment}-config-delivery"
  s3_bucket_name = aws_s3_bucket.config_logs[0].id
  
  depends_on = [aws_config_configuration_recorder.main]
}

# S3 bucket for Config logs
resource "aws_s3_bucket" "config_logs" {
  count = contains(var.compliance_standards, "HIPAA") || contains(var.compliance_standards, "SOC2") ? 1 : 0
  
  bucket = "${var.project_name}-${var.environment}-config-logs"
  
  tags = merge(
    var.tags,
    {
      Name       = "${var.project_name}-${var.environment}-config-logs"
      Purpose    = "Config Logs"
      Compliance = join(",", var.compliance_standards)
    }
  )
}

# IAM role for AWS Config
resource "aws_iam_role" "config" {
  count = contains(var.compliance_standards, "HIPAA") || contains(var.compliance_standards, "SOC2") ? 1 : 0
  
  name = "${var.project_name}-${var.environment}-config-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
      }
    ]
  })
  
  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "config" {
  count = contains(var.compliance_standards, "HIPAA") || contains(var.compliance_standards, "SOC2") ? 1 : 0
  
  role       = aws_iam_role.config[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/ConfigRole"
}

# Config Rules for compliance
resource "aws_config_config_rule" "encryption_at_rest" {
  count = var.enforce_encryption_at_rest ? 1 : 0
  
  name = "${var.project_name}-${var.environment}-encryption-at-rest"
  
  source {
    owner             = "AWS"
    source_identifier = "ENCRYPTED_VOLUMES"
  }
  
  depends_on = [aws_config_configuration_recorder.main]
}

resource "aws_config_config_rule" "s3_encryption" {
  count = var.enforce_encryption_at_rest ? 1 : 0
  
  name = "${var.project_name}-${var.environment}-s3-encryption"
  
  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
  }
  
  depends_on = [aws_config_configuration_recorder.main]
}

resource "aws_config_config_rule" "mfa_enabled" {
  count = var.enable_mfa_requirement ? 1 : 0
  
  name = "${var.project_name}-${var.environment}-mfa-enabled"
  
  source {
    owner             = "AWS"
    source_identifier = "IAM_USER_MFA_ENABLED"
  }
  
  depends_on = [aws_config_configuration_recorder.main]
}

# GDPR-specific: Data retention policy
resource "aws_s3_bucket_lifecycle_configuration" "gdpr_data_retention" {
  count = contains(var.compliance_standards, "GDPR") && var.create_data_bucket ? 1 : 0
  
  bucket = var.data_bucket_id
  
  rule {
    id     = "gdpr-data-retention"
    status = "Enabled"
    
    expiration {
      days = 2555 # 7 years as per GDPR Article 17
    }
    
    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

# Compliance report as a local file
resource "local_file" "compliance_report" {
  filename = "${path.module}/compliance-report-${var.environment}.json"
  
  content = jsonencode({
    project_name         = var.project_name
    environment          = var.environment
    compliance_standards = var.compliance_standards
    timestamp           = timestamp()
    
    encryption = {
      at_rest    = var.enforce_encryption_at_rest
      in_transit = var.enforce_encryption_in_transit
    }
    
    logging = {
      cloudtrail_enabled = var.enable_cloudtrail
      cloudwatch_enabled = var.enable_cloudwatch_logs
      retention_days     = var.log_retention_days
    }
    
    access_controls = {
      mfa_required = var.enable_mfa_requirement
    }
    
    data_residency = {
      region = var.data_residency_region
    }
    
    audit_logging = {
      enabled        = var.enable_cloudtrail
      bucket         = var.enable_cloudtrail ? aws_s3_bucket.audit_logs[0].id : null
      cloudtrail_arn = var.enable_cloudtrail ? aws_cloudtrail.main[0].arn : null
    }
  })
}
