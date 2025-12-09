output "id" {
  description = "Frontend resource identifier"
  value = (
    var.hosting_provider == "vercel" && length(vercel_project.frontend) > 0 ? vercel_project.frontend[0].id :
    var.hosting_provider == "s3" && length(aws_s3_bucket.frontend) > 0 ? aws_s3_bucket.frontend[0].id :
    "cloudflare_pages"
  )
}

output "url" {
  description = "Frontend URL"
  value = (
    var.hosting_provider == "vercel" && length(vercel_project.frontend) > 0 ? "https://${var.vercel_project_name}.vercel.app" :
    var.hosting_provider == "s3" && var.cloudfront_enabled && length(aws_cloudfront_distribution.frontend) > 0 ? "https://${aws_cloudfront_distribution.frontend[0].domain_name}" :
    var.hosting_provider == "s3" && length(aws_s3_bucket.frontend) > 0 ? "http://${aws_s3_bucket.frontend[0].website_endpoint}" :
    "https://${var.cloudflare_pages_project}.pages.dev"
  )
}

output "endpoint" {
  description = "Frontend endpoint"
  value = (
    var.hosting_provider == "vercel" && length(vercel_project.frontend) > 0 ? "https://${var.vercel_project_name}.vercel.app" :
    var.hosting_provider == "s3" && var.cloudfront_enabled && length(aws_cloudfront_distribution.frontend) > 0 ? "https://${aws_cloudfront_distribution.frontend[0].domain_name}" :
    var.hosting_provider == "s3" && length(aws_s3_bucket.frontend) > 0 ? "http://${aws_s3_bucket.frontend[0].website_endpoint}" :
    "https://${var.cloudflare_pages_project}.pages.dev"
  )
}

output "deployment_id" {
  description = "Deployment identifier"
  value = (
    var.hosting_provider == "vercel" && length(vercel_project.frontend) > 0 ? vercel_project.frontend[0].id :
    var.hosting_provider == "s3" && length(aws_s3_bucket.frontend) > 0 ? aws_s3_bucket.frontend[0].id :
    var.cloudflare_pages_project
  )
}

output "cdn_domain" {
  description = "CDN domain name"
  value = (
    var.hosting_provider == "s3" && var.cloudfront_enabled && length(aws_cloudfront_distribution.frontend) > 0 ? aws_cloudfront_distribution.frontend[0].domain_name :
    null
  )
}
