# Cloudflare Zero Trust Access Module
# Provides enterprise-grade authentication and access control

terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

# Zero Trust Access Team
resource "cloudflare_teams_account" "main" {
  count      = var.enable_zero_trust ? 1 : 0
  account_id = var.account_id
  
  logging {
    redact_pii = true
    settings_by_rule_type {
      dns {
        log_all    = true
        log_blocks = true
      }
      http {
        log_all    = true
        log_blocks = true
      }
      l4 {
        log_all    = true
        log_blocks = true
      }
    }
  }
  
  antivirus {
    enabled_download_phase = true
    enabled_upload_phase   = true
    fail_closed            = true
  }
  
  block_page {
    enabled = true
    name    = "${var.environment} Access Denied"
  }
  
  fips {
    tls = true
  }
}

# Identity Providers
resource "cloudflare_access_identity_provider" "idp" {
  for_each = var.enable_zero_trust ? var.identity_providers : {}
  
  account_id = var.account_id
  name       = each.value.name
  type       = each.value.type
  
  dynamic "config" {
    for_each = each.value.config != null ? [each.value.config] : []
    content {
      client_id     = lookup(config.value, "client_id", null)
      client_secret = lookup(config.value, "client_secret", null)
      api_token     = lookup(config.value, "api_token", null)
      domain        = lookup(config.value, "domain", null)
      okta_account  = lookup(config.value, "okta_account", null)
      onelogin_account = lookup(config.value, "onelogin_account", null)
    }
  }
}

# Zero Trust Applications
resource "cloudflare_access_application" "apps" {
  for_each = var.enable_zero_trust ? var.zero_trust_applications : {}
  
  account_id              = var.account_id
  name                    = each.value.name
  domain                  = each.value.domain
  type                    = each.value.type
  session_duration        = each.value.session_duration
  auto_redirect_to_identity = each.value.auto_redirect
  
  allowed_idps = [
    for idp_name in each.value.allowed_idps :
    cloudflare_access_identity_provider.idp[idp_name].id
    if contains(keys(cloudflare_access_identity_provider.idp), idp_name)
  ]
  
  # CORS settings for API applications
  dynamic "cors_headers" {
    for_each = each.value.type == "self_hosted" && can(regex("api\\.", each.value.domain)) ? [1] : []
    content {
      allowed_methods = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
      allowed_origins = ["https://${var.domain}"]
      allow_credentials = true
      max_age = 3600
    }
  }
  
  # SAML settings for SSO applications
  dynamic "saml_options" {
    for_each = each.value.type == "saas" ? [1] : []
    content {
      idp_public_certs = []
      name_id_format   = "email"
    }
  }
}

# Access Groups for organizing users
resource "cloudflare_access_group" "groups" {
  for_each = var.enable_zero_trust ? local.access_groups : {}
  
  account_id = var.account_id
  name       = each.value.name
  
  dynamic "include" {
    for_each = each.value.include
    content {
      email         = lookup(include.value, "email", null)
      email_domain  = lookup(include.value, "email_domain", null)
      ip            = lookup(include.value, "ip", null)
      ip_list       = lookup(include.value, "ip_list", null)
      everyone      = lookup(include.value, "everyone", null)
      auth_method   = lookup(include.value, "auth_method", null)
      geo           = lookup(include.value, "geo", null)
      
      dynamic "group" {
        for_each = lookup(include.value, "group", null) != null ? [include.value.group] : []
        content {
          id = group.value
        }
      }
    }
  }
  
  dynamic "exclude" {
    for_each = lookup(each.value, "exclude", [])
    content {
      email         = lookup(exclude.value, "email", null)
      email_domain  = lookup(exclude.value, "email_domain", null)
      ip            = lookup(exclude.value, "ip", null)
    }
  }
  
  dynamic "require" {
    for_each = lookup(each.value, "require", [])
    content {
      email         = lookup(require.value, "email", null)
      email_domain  = lookup(require.value, "email_domain", null)
      geo           = lookup(require.value, "geo", null)
      auth_method   = lookup(require.value, "auth_method", null)
    }
  }
}

# Access Policies for applications
resource "cloudflare_access_policy" "policies" {
  for_each = var.enable_zero_trust ? var.access_policies : {}
  
  account_id       = var.account_id
  application_id   = cloudflare_access_application.apps[each.value.application].id
  name             = each.value.name
  decision         = each.value.decision
  precedence       = each.value.precedence
  
  dynamic "include" {
    for_each = each.value.include
    content {
      email         = lookup(include.value, "email", null)
      email_domain  = lookup(include.value, "email_domain", null)
      ip            = lookup(include.value, "ip", null)
      ip_list       = lookup(include.value, "ip_list", null)
      everyone      = lookup(include.value, "everyone", null)
      auth_method   = lookup(include.value, "auth_method", null)
      geo           = lookup(include.value, "geo", null)
      
      dynamic "group" {
        for_each = lookup(include.value, "group", null) != null ? [include.value.group] : []
        content {
          id = cloudflare_access_group.groups[group.value].id
        }
      }
    }
  }
  
  dynamic "exclude" {
    for_each = lookup(each.value, "exclude", [])
    content {
      email         = lookup(exclude.value, "email", null)
      email_domain  = lookup(exclude.value, "email_domain", null)
      ip            = lookup(exclude.value, "ip", null)
    }
  }
  
  dynamic "require" {
    for_each = lookup(each.value, "require", [])
    content {
      email         = lookup(require.value, "email", null)
      email_domain  = lookup(require.value, "email_domain", null)
      geo           = lookup(require.value, "geo", null)
      auth_method   = lookup(require.value, "auth_method", null)
      
      dynamic "group" {
        for_each = lookup(require.value, "group", null) != null ? [require.value.group] : []
        content {
          id = cloudflare_access_group.groups[group.value].id
        }
      }
    }
  }
}

# Service Tokens for machine-to-machine authentication
resource "cloudflare_access_service_token" "service_tokens" {
  for_each = var.enable_zero_trust ? var.service_tokens : {}
  
  account_id = var.account_id
  name       = each.value.name
  duration   = each.value.duration
}

# Zero Trust Gateway policies (DNS, HTTP, Network filtering)
resource "cloudflare_teams_rule" "gateway_rules" {
  for_each = var.enable_zero_trust ? var.gateway_rules : {}
  
  account_id  = var.account_id
  name        = each.value.name
  description = each.value.description
  precedence  = each.value.precedence
  enabled     = lookup(each.value, "enabled", true)
  
  action = each.value.action
  filters = each.value.filters
  
  rule_settings {
    block_page_enabled = lookup(each.value, "block_page_enabled", false)
    block_reason       = lookup(each.value, "block_reason", "")
    override_ips       = lookup(each.value, "override_ips", [])
  }
}

# Cloudflare Tunnel for secure access to backend services
resource "cloudflare_tunnel" "backend_tunnel" {
  count = var.enable_zero_trust && var.create_tunnel ? 1 : 0
  
  account_id = var.account_id
  name       = "${var.environment}-backend-tunnel"
  secret     = var.tunnel_secret
}

resource "cloudflare_tunnel_config" "backend_tunnel_config" {
  count = var.enable_zero_trust && var.create_tunnel ? 1 : 0
  
  account_id = var.account_id
  tunnel_id  = cloudflare_tunnel.backend_tunnel[0].id
  
  config {
    dynamic "ingress_rule" {
      for_each = var.tunnel_ingress_rules
      content {
        hostname = ingress_rule.value.hostname
        service  = ingress_rule.value.service
        
        dynamic "origin_request" {
          for_each = lookup(ingress_rule.value, "origin_request", null) != null ? [ingress_rule.value.origin_request] : []
          content {
            connect_timeout          = lookup(origin_request.value, "connect_timeout", 30)
            tls_timeout             = lookup(origin_request.value, "tls_timeout", 10)
            tcp_keep_alive          = lookup(origin_request.value, "tcp_keep_alive", 30)
            no_happy_eyeballs       = lookup(origin_request.value, "no_happy_eyeballs", false)
            keep_alive_connections  = lookup(origin_request.value, "keep_alive_connections", 100)
            keep_alive_timeout      = lookup(origin_request.value, "keep_alive_timeout", 90)
            http_host_header        = lookup(origin_request.value, "http_host_header", "")
            origin_server_name      = lookup(origin_request.value, "origin_server_name", "")
          }
        }
      }
    }
    
    # Catch-all rule
    ingress_rule {
      service = "http_status:404"
    }
  }
}

# Local variables for access groups
locals {
  access_groups = {
    admin = {
      name = "${var.environment}-admins"
      include = [
        {
          email_domain = var.admin_email_domain
        }
      ]
      require = [
        {
          auth_method = "mfa"
        }
      ]
    }
    
    developers = {
      name = "${var.environment}-developers"
      include = [
        {
          email_domain = var.developer_email_domain
        }
      ]
    }
    
    users = {
      name = "${var.environment}-users"
      include = [
        {
          everyone = true
        }
      ]
      require = [
        {
          email_domain = var.domain
        }
      ]
    }
  }
}
