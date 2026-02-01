# Object Storage Module
# Supports AWS S3 and Cloudflare R2

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

# AWS S3 Bucket for Object Storage
resource "aws_s3_bucket" "storage" {
  count = var.storage_provider == "s3" ? 1 : 0

  bucket = var.s3_bucket_name

  tags = merge(var.tags, {
    Name = "${var.project_name}-storage"
  })
}

resource "aws_s3_bucket_versioning" "storage" {
  count = var.storage_provider == "s3" ? 1 : 0

  bucket = aws_s3_bucket.storage[0].id

  versioning_configuration {
    status = var.s3_versioning ? "Enabled" : "Suspended"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "storage" {
  count = var.storage_provider == "s3" ? 1 : 0

  bucket = aws_s3_bucket.storage[0].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "storage" {
  count = var.storage_provider == "s3" ? 1 : 0

  bucket = aws_s3_bucket.storage[0].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_cors_configuration" "storage" {
  count = var.storage_provider == "s3" ? 1 : 0

  bucket = aws_s3_bucket.storage[0].id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = var.cors_allowed_methods
    allowed_origins = var.cors_allowed_origins
    expose_headers  = ["ETag"]
    max_age_seconds = 3600
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "storage" {
  count = var.storage_provider == "s3" && length(var.s3_lifecycle_rules) > 0 ? 1 : 0

  bucket = aws_s3_bucket.storage[0].id

  dynamic "rule" {
    for_each = var.s3_lifecycle_rules
    content {
      id     = rule.value.id
      status = rule.value.enabled ? "Enabled" : "Disabled"

      filter {
        prefix = rule.value.prefix
      }

      expiration {
        days = rule.value.expiration_days
      }
    }
  }
}

# CloudFront Distribution for S3 Storage (CDN)
resource "aws_cloudfront_origin_access_control" "storage" {
  count = var.storage_provider == "s3" ? 1 : 0

  name                              = "${var.project_name}-storage-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "storage" {
  count = var.storage_provider == "s3" ? 1 : 0

  origin {
    domain_name              = aws_s3_bucket.storage[0].bucket_regional_domain_name
    origin_id                = "S3-${aws_s3_bucket.storage[0].id}"
    origin_access_control_id = aws_cloudfront_origin_access_control.storage[0].id
  }

  enabled = true

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.storage[0].id}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 86400
    max_ttl                = 31536000
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-storage-cdn"
  })
}

# Update S3 bucket policy for CloudFront
resource "aws_s3_bucket_policy" "storage" {
  count = var.storage_provider == "s3" ? 1 : 0

  bucket = aws_s3_bucket.storage[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipal"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.storage[0].arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.storage[0].arn
          }
        }
      }
    ]
  })
}

# Cloudflare R2 Bucket Configuration
# Note: Cloudflare R2 doesn't have full Terraform support yet
# This provides configuration for manual setup or API-based management
locals {
  r2_config = var.storage_provider == "cloudflare_r2" ? {
    account_id  = var.cloudflare_account_id
    bucket_name = var.r2_bucket_name
    cors_config = {
      allowed_origins = var.cors_allowed_origins
      allowed_methods = var.cors_allowed_methods
      allowed_headers = ["*"]
      max_age_seconds = 3600
    }
    # R2 public URL format
    public_url = "https://pub-${var.cloudflare_account_id}.r2.dev/${var.r2_bucket_name}"
  } : null
}

output "r2_config" {
  description = "Cloudflare R2 configuration (manual setup required)"
  value       = local.r2_config
}
