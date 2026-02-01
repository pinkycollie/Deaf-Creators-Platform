output "id" {
  description = "DNS configuration identifier"
  value = (
    var.dns_provider == "cloudflare" && length(cloudflare_record.frontend) > 0 ? cloudflare_record.frontend[0].id :
    var.dns_provider == "route53" && length(aws_route53_record.frontend) > 0 ? aws_route53_record.frontend[0].id :
    "dns-configured"
  )
}

output "domain_name" {
  description = "Full domain name for the application"
  value       = "${var.subdomain_prefix}.${var.domain_name}"
}

output "api_domain_name" {
  description = "Full domain name for the API"
  value       = "${var.subdomain_prefix}-api.${var.domain_name}"
}

output "cdn_endpoint" {
  description = "CDN endpoint URL"
  value = (
    var.cdn_enabled ? "https://${var.subdomain_prefix}.${var.domain_name}" :
    null
  )
}

output "certificate_arn" {
  description = "ACM certificate ARN (Route53 only)"
  value = (
    var.dns_provider == "route53" && length(aws_acm_certificate.main) > 0 ? 
      aws_acm_certificate.main[0].arn :
    null
  )
}
