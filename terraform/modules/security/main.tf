# Security Module - WAF, Firewall, DDoS Protection, and Encryption

terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# KMS Key for encryption at rest
resource "aws_kms_key" "main" {
  count = var.create_kms_key ? 1 : 0
  
  description             = "KMS key for ${var.project_name} ${var.environment}"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  
  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-kms"
    }
  )
}

resource "aws_kms_alias" "main" {
  count = var.create_kms_key ? 1 : 0
  
  name          = "alias/${var.kms_key_alias}"
  target_key_id = aws_kms_key.main[0].key_id
}

# Cloudflare WAF (Web Application Firewall)
resource "cloudflare_ruleset" "waf_managed_rules" {
  count = var.enable_waf ? 1 : 0
  
  zone_id     = var.zone_id
  name        = "${var.environment}-waf-managed-rules"
  description = "Managed WAF rules for ${var.environment}"
  kind        = "zone"
  phase       = "http_request_firewall_managed"
  
  dynamic "rules" {
    for_each = var.waf_rule_sets
    content {
      action = "execute"
      action_parameters {
        id = rules.value
      }
      expression = "true"
      description = "Execute ${rules.value}"
      enabled = true
    }
  }
}

# Custom WAF Rules
resource "cloudflare_ruleset" "waf_custom_rules" {
  count = var.enable_waf && length(var.custom_waf_rules) > 0 ? 1 : 0
  
  zone_id     = var.zone_id
  name        = "${var.environment}-waf-custom-rules"
  description = "Custom WAF rules for ${var.environment}"
  kind        = "zone"
  phase       = "http_request_firewall_custom"
  
  dynamic "rules" {
    for_each = var.custom_waf_rules
    content {
      action      = rules.value.action
      expression  = rules.value.expression
      description = rules.value.description
      enabled     = lookup(rules.value, "enabled", true)
      
      dynamic "action_parameters" {
        for_each = lookup(rules.value, "action_parameters", null) != null ? [rules.value.action_parameters] : []
        content {
          response {
            status_code  = lookup(action_parameters.value, "status_code", 403)
            content      = lookup(action_parameters.value, "content", "Access denied")
            content_type = lookup(action_parameters.value, "content_type", "text/plain")
          }
        }
      }
    }
  }
}

# Rate Limiting Rules
resource "cloudflare_rate_limit" "api_rate_limits" {
  for_each = var.enable_waf ? var.waf_rate_limits : {}
  
  zone_id   = var.zone_id
  threshold = each.value.threshold
  period    = each.value.period
  
  match {
    request {
      url_pattern = lookup(each.value, "url_pattern", "*")
    }
  }
  
  action {
    mode    = each.value.action
    timeout = lookup(each.value, "timeout", 60)
    
    dynamic "response" {
      for_each = each.value.action == "challenge" || each.value.action == "js_challenge" ? [1] : []
      content {
        content_type = "text/plain"
        body         = "Rate limit exceeded. Please try again later."
      }
    }
  }
  
  description = each.value.description
  disabled    = false
}

# Firewall Rules
resource "cloudflare_ruleset" "firewall_rules" {
  count = length(var.firewall_rules) > 0 ? 1 : 0
  
  zone_id     = var.zone_id
  name        = "${var.environment}-firewall-rules"
  description = "Firewall rules for ${var.environment}"
  kind        = "zone"
  phase       = "http_request_firewall_custom"
  
  dynamic "rules" {
    for_each = var.firewall_rules
    content {
      action      = rules.value.action
      expression  = rules.value.expression
      description = rules.value.description
      enabled     = true
    }
  }
}

# DDoS Protection Settings
resource "cloudflare_zone_settings_override" "ddos_protection" {
  count = var.enable_ddos_protection ? 1 : 0
  
  zone_id = var.zone_id
  
  settings {
    # Security settings
    security_level = "high"
    
    # Challenge settings
    challenge_ttl = 1800
    
    # Browser integrity check
    browser_check = "on"
    
    # Bot management
    bot_fight_mode = var.bot_fight_mode
    
    # SSL/TLS settings
    ssl = var.ssl_mode
    min_tls_version = var.minimum_tls_version
    tls_1_3 = "on"
    automatic_https_rewrites = "on"
    
    # Security headers
    security_header {
      enabled            = true
      preload            = true
      max_age            = 31536000
      include_subdomains = true
      nosniff            = true
    }
    
    # HSTS
    always_use_https = "on"
  }
}

# Bot Management
resource "cloudflare_bot_management" "main" {
  count = var.enable_bot_management ? 1 : 0
  
  zone_id                       = var.zone_id
  enable_js                     = true
  fight_mode                    = true
  suppress_session_score        = false
  
  # Auto update model
  auto_update_model = true
}

# Page Rules for additional security
resource "cloudflare_page_rule" "security_headers" {
  zone_id  = var.zone_id
  target   = "*.${var.domain}/*"
  priority = 1
  
  actions {
    security_level = "high"
    
    # Cache settings for security
    cache_level = "aggressive"
    
    # SSL settings
    ssl = "strict"
  }
}

# Security Groups for AWS resources
resource "aws_security_group" "backend" {
  count = var.create_security_groups ? 1 : 0
  
  name        = "${var.project_name}-${var.environment}-backend-sg"
  description = "Security group for backend services"
  vpc_id      = var.vpc_id
  
  # HTTPS inbound
  ingress {
    description = "HTTPS from VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }
  
  # HTTP inbound (for load balancer health checks)
  ingress {
    description = "HTTP from VPC"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }
  
  # All outbound
  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-backend-sg"
    }
  )
}

resource "aws_security_group" "database" {
  count = var.create_security_groups ? 1 : 0
  
  name        = "${var.project_name}-${var.environment}-database-sg"
  description = "Security group for database"
  vpc_id      = var.vpc_id
  
  # PostgreSQL inbound from backend only
  ingress {
    description     = "PostgreSQL from backend"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = var.create_security_groups ? [aws_security_group.backend[0].id] : []
  }
  
  # No outbound rules needed for database
  
  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-database-sg"
    }
  )
}

# WAF IP Sets for allowlisting/denylisting
resource "cloudflare_list" "ip_allowlist" {
  count = var.enable_ip_allowlist ? 1 : 0
  
  account_id  = var.account_id
  name        = "${var.environment}-ip-allowlist"
  description = "IP allowlist for ${var.environment}"
  kind        = "ip"
  
  dynamic "item" {
    for_each = var.ip_allowlist
    content {
      value {
        ip = item.value
      }
      comment = "Allowed IP"
    }
  }
}

resource "cloudflare_list" "ip_denylist" {
  count = var.enable_ip_denylist ? 1 : 0
  
  account_id  = var.account_id
  name        = "${var.environment}-ip-denylist"
  description = "IP denylist for ${var.environment}"
  kind        = "ip"
  
  dynamic "item" {
    for_each = var.ip_denylist
    content {
      value {
        ip = item.value
      }
      comment = "Denied IP"
    }
  }
}

# Secrets encryption using KMS
resource "aws_secretsmanager_secret" "app_secrets" {
  for_each = var.encrypt_secrets ? var.app_secrets : {}
  
  name        = "${var.project_name}-${var.environment}-${each.key}"
  description = "Encrypted secret for ${each.key}"
  kms_key_id  = var.create_kms_key ? aws_kms_key.main[0].id : var.kms_key_id
  
  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-${each.key}"
    }
  )
}

resource "aws_secretsmanager_secret_version" "app_secrets" {
  for_each = var.encrypt_secrets ? var.app_secrets : {}
  
  secret_id     = aws_secretsmanager_secret.app_secrets[each.key].id
  secret_string = each.value
}
