# DNS and Networking Module
# Supports Cloudflare and AWS Route53

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

# Cloudflare DNS Records
resource "cloudflare_record" "frontend" {
  count = var.dns_provider == "cloudflare" ? 1 : 0

  zone_id = var.cloudflare_zone_id
  name    = var.subdomain_prefix
  value   = var.frontend_endpoint
  type    = "CNAME"
  proxied = var.cdn_enabled
  ttl     = var.cdn_enabled ? 1 : 300

  comment = "Frontend application (${var.project_name})"
}

resource "cloudflare_record" "api" {
  count = var.dns_provider == "cloudflare" ? 1 : 0

  zone_id = var.cloudflare_zone_id
  name    = "${var.subdomain_prefix}-api"
  value   = var.backend_endpoint
  type    = "CNAME"
  proxied = var.cdn_enabled
  ttl     = var.cdn_enabled ? 1 : 300

  comment = "Backend API (${var.project_name})"
}

# Cloudflare Page Rules for caching and security
resource "cloudflare_page_rule" "cache_everything" {
  count = var.dns_provider == "cloudflare" && var.cdn_enabled ? 1 : 0

  zone_id = var.cloudflare_zone_id
  target  = "${var.subdomain_prefix}.${var.domain_name}/static/*"
  priority = 1

  actions {
    cache_level = "cache_everything"
    edge_cache_ttl = 86400
  }
}

# AWS Route53 DNS Records
resource "aws_route53_record" "frontend" {
  count = var.dns_provider == "route53" ? 1 : 0

  zone_id = var.route53_zone_id
  name    = var.subdomain_prefix
  type    = "CNAME"
  ttl     = 300
  records = [var.frontend_endpoint]
}

resource "aws_route53_record" "api" {
  count = var.dns_provider == "route53" ? 1 : 0

  zone_id = var.route53_zone_id
  name    = "${var.subdomain_prefix}-api"
  type    = "CNAME"
  ttl     = 300
  records = [var.backend_endpoint]
}

# AWS Certificate Manager (ACM) for HTTPS
resource "aws_acm_certificate" "main" {
  count = var.dns_provider == "route53" ? 1 : 0

  domain_name       = "${var.subdomain_prefix}.${var.domain_name}"
  validation_method = "DNS"

  subject_alternative_names = [
    "${var.subdomain_prefix}-api.${var.domain_name}",
    "*.${var.subdomain_prefix}.${var.domain_name}"
  ]

  lifecycle {
    create_before_destroy = true
  }

  tags = var.tags
}

resource "aws_route53_record" "cert_validation" {
  count = var.dns_provider == "route53" ? 1 : 0

  for_each = {
    for dvo in aws_acm_certificate.main[0].domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = var.route53_zone_id
}
