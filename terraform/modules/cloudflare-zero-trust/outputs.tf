# Outputs for Cloudflare Zero Trust Access Module

output "team_name" {
  description = "Zero Trust team name"
  value       = var.enable_zero_trust ? cloudflare_teams_account.main[0].id : null
}

output "applications" {
  description = "Zero Trust Access applications"
  value = {
    for k, v in cloudflare_access_application.apps :
    k => {
      id     = v.id
      name   = v.name
      domain = v.domain
      aud    = v.aud
    }
  }
  sensitive = true
}

output "access_urls" {
  description = "URLs for Zero Trust Access applications"
  value = {
    for k, v in cloudflare_access_application.apps :
    k => "https://${v.domain}"
  }
}

output "identity_providers" {
  description = "Identity provider IDs"
  value = {
    for k, v in cloudflare_access_identity_provider.idp :
    k => v.id
  }
}

output "access_groups" {
  description = "Access group IDs"
  value = {
    for k, v in cloudflare_access_group.groups :
    k => v.id
  }
}

output "service_tokens" {
  description = "Service token information"
  value = {
    for k, v in cloudflare_access_service_token.service_tokens :
    k => {
      id          = v.id
      client_id   = v.client_id
      client_secret = v.client_secret
    }
  }
  sensitive = true
}

output "tunnel_id" {
  description = "Cloudflare Tunnel ID"
  value       = var.enable_zero_trust && var.create_tunnel ? cloudflare_tunnel.backend_tunnel[0].id : null
}

output "tunnel_cname" {
  description = "Cloudflare Tunnel CNAME"
  value       = var.enable_zero_trust && var.create_tunnel ? cloudflare_tunnel.backend_tunnel[0].cname : null
}

output "frontend_policies" {
  description = "Zero Trust policies for frontend"
  value = {
    application_ids = [
      for k, v in cloudflare_access_application.apps :
      v.id if can(regex("^(www\\.|app\\.|)", v.domain))
    ]
  }
}

output "backend_policies" {
  description = "Zero Trust policies for backend"
  value = {
    application_ids = [
      for k, v in cloudflare_access_application.apps :
      v.id if can(regex("api\\.", v.domain))
    ]
  }
}

output "storage_policies" {
  description = "Zero Trust policies for storage"
  value = {
    application_ids = [
      for k, v in cloudflare_access_application.apps :
      v.id if can(regex("(storage\\.|cdn\\.|uploads\\.)", v.domain))
    ]
  }
}
