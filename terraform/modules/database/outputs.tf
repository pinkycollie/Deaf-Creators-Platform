output "id" {
  description = "Database resource identifier"
  value = (
    var.database_provider == "rds" && length(aws_db_instance.main) > 0 ? aws_db_instance.main[0].id :
    var.database_provider == "neon" ? var.neon_project_name :
    var.project_name
  )
}

output "endpoint" {
  description = "Database endpoint"
  value = (
    var.database_provider == "rds" && length(aws_db_instance.main) > 0 ? aws_db_instance.main[0].endpoint :
    "neon-endpoint.com"  # Placeholder for Neon
  )
  sensitive = true
}

output "database_name" {
  description = "Database name"
  value       = var.database_name
}

output "connection_string" {
  description = "Database connection string"
  value = (
    var.database_provider == "rds" && length(aws_db_instance.main) > 0 ? 
      "postgresql://${var.master_username}:${random_password.database[0].result}@${aws_db_instance.main[0].endpoint}/${var.database_name}" :
    var.database_provider == "neon" ? local.neon_config.connection_format :
    local.supabase_config != null ? local.supabase_config.connection_format :
    ""
  )
  sensitive = true
}

output "master_username" {
  description = "Database master username"
  value = (
    var.database_provider == "rds" ? var.master_username :
    "postgres"
  )
  sensitive = true
}

output "password_secret_arn" {
  description = "ARN of the secret containing database password"
  value = (
    var.database_provider == "rds" && length(aws_secretsmanager_secret.database_password) > 0 ?
      aws_secretsmanager_secret.database_password[0].arn :
    null
  )
  sensitive = true
}
