# Frontend Module - Vercel Deployment with Zero Trust Protection

terraform {
  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 1.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

# Vercel Project
resource "vercel_project" "frontend" {
  name      = "${var.project_name}-${var.environment}"
  framework = "nextjs"
  
  git_repository = var.git_repository != "" ? {
    type = "github"
    repo = var.git_repository
  } : null
  
  build_command    = "npm run build"
  output_directory = ".next"
  
  environment = [
    for key, value in var.environment_variables : {
      key    = key
      value  = value
      target = ["production", "preview"]
    }
  ]
}

# Vercel Domain
resource "vercel_project_domain" "primary" {
  project_id = vercel_project.frontend.id
  domain     = var.domain
}

# Cloudflare DNS for Vercel
resource "cloudflare_record" "vercel_cname" {
  count = var.cloudflare_zone_id != "" ? 1 : 0
  
  zone_id = var.cloudflare_zone_id
  name    = "@"
  value   = "cname.vercel-dns.com"
  type    = "CNAME"
  proxied = var.enable_zero_trust
  ttl     = var.enable_zero_trust ? 1 : 3600
}

# Zero Trust Access for frontend (if enabled)
resource "cloudflare_record" "frontend_access" {
  count = var.enable_zero_trust && var.cloudflare_zone_id != "" ? 1 : 0
  
  zone_id = var.cloudflare_zone_id
  name    = "app"
  value   = var.domain
  type    = "CNAME"
  proxied = true
  ttl     = 1
}

output "url" {
  description = "Frontend URL"
  value       = "https://${var.domain}"
}

output "deployment_id" {
  description = "Vercel project ID"
  value       = vercel_project.frontend.id
}
