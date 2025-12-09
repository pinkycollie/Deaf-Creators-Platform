output "id" {
  description = "Storage resource identifier"
  value = (
    var.storage_provider == "s3" && length(aws_s3_bucket.storage) > 0 ? aws_s3_bucket.storage[0].id :
    var.r2_bucket_name
  )
}

output "bucket_name" {
  description = "Storage bucket name"
  value = (
    var.storage_provider == "s3" && length(aws_s3_bucket.storage) > 0 ? aws_s3_bucket.storage[0].id :
    var.r2_bucket_name
  )
}

output "bucket_endpoint" {
  description = "Storage bucket endpoint"
  value = (
    var.storage_provider == "s3" && length(aws_s3_bucket.storage) > 0 ? aws_s3_bucket.storage[0].bucket_regional_domain_name :
    "https://${var.cloudflare_account_id}.r2.cloudflarestorage.com"
  )
}

output "cdn_url" {
  description = "CDN URL for storage bucket"
  value = (
    var.storage_provider == "s3" && length(aws_cloudfront_distribution.storage) > 0 ? 
      "https://${aws_cloudfront_distribution.storage[0].domain_name}" :
    local.r2_config != null ? local.r2_config.public_url :
    null
  )
}

output "bucket_arn" {
  description = "Storage bucket ARN (S3 only)"
  value = (
    var.storage_provider == "s3" && length(aws_s3_bucket.storage) > 0 ? aws_s3_bucket.storage[0].arn :
    null
  )
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID (S3 only)"
  value = (
    var.storage_provider == "s3" && length(aws_cloudfront_distribution.storage) > 0 ? 
      aws_cloudfront_distribution.storage[0].id :
    null
  )
}
