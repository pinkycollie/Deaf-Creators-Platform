# Frontend Hosting Module
# Supports Vercel, AWS S3 + CloudFront, and Cloudflare Pages

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
    vercel = {
      source  = "vercel/vercel"
      version = "~> 1.0"
    }
  }
}

# Vercel Deployment
resource "vercel_project" "frontend" {
  count = var.hosting_provider == "vercel" ? 1 : 0

  name      = var.vercel_project_name
  framework = var.vercel_framework

  build_command        = var.vercel_build_command
  output_directory     = var.vercel_output_directory
  install_command      = "npm ci"
  
  environment = [
    {
      key    = "NEXT_PUBLIC_APP_URL"
      value  = "https://${var.vercel_project_name}.vercel.app"
      target = ["production", "preview"]
    }
  ]
}

# AWS S3 Bucket for Static Hosting
resource "aws_s3_bucket" "frontend" {
  count = var.hosting_provider == "s3" ? 1 : 0

  bucket = var.s3_bucket_name

  tags = merge(var.tags, {
    Name = "${var.project_name}-frontend"
  })
}

resource "aws_s3_bucket_website_configuration" "frontend" {
  count = var.hosting_provider == "s3" ? 1 : 0

  bucket = aws_s3_bucket.frontend[0].id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "404.html"
  }
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  count = var.hosting_provider == "s3" ? 1 : 0

  bucket = aws_s3_bucket.frontend[0].id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "frontend" {
  count = var.hosting_provider == "s3" ? 1 : 0

  bucket = aws_s3_bucket.frontend[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.frontend[0].arn}/*"
      }
    ]
  })
}

# CloudFront Distribution for S3
resource "aws_cloudfront_distribution" "frontend" {
  count = var.hosting_provider == "s3" && var.cloudfront_enabled ? 1 : 0

  origin {
    domain_name = aws_s3_bucket.frontend[0].bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.frontend[0].id}"
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.frontend[0].id}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
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
    Name = "${var.project_name}-frontend-cdn"
  })
}

# Cloudflare Pages Project
# Note: Cloudflare Pages typically uses the Cloudflare Dashboard or Pages API
# This is a placeholder for configuration management
locals {
  cloudflare_pages_config = var.hosting_provider == "cloudflare_pages" ? {
    project_name = var.cloudflare_pages_project
    account_id   = var.cloudflare_account_id
    production_branch = "main"
    build_config = {
      build_command       = "npm run build"
      destination_dir     = ".next"
      root_dir            = ""
    }
  } : null
}

# Output the Cloudflare Pages configuration
output "cloudflare_pages_config" {
  description = "Cloudflare Pages configuration (manual setup required)"
  value       = local.cloudflare_pages_config
}
