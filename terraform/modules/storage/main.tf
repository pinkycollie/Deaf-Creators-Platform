# Storage Module - Cloudflare R2 with Zero Trust Protection

terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

# Cloudflare R2 Bucket
resource "cloudflare_r2_bucket" "main" {
  account_id = var.cloudflare_account_id
  name       = var.bucket_name
  location   = "auto"
}

output "bucket_name" {
  value = cloudflare_r2_bucket.main.name
}

output "bucket_domain" {
  value = "${var.cloudflare_account_id}.r2.cloudflarestorage.com"
}

output "access_key_id" {
  value     = "r2-access-key-id"
  sensitive = true
}
