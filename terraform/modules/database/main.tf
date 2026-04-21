# Database Module - Neon/RDS/Supabase with Encryption

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# RDS instance placeholder
resource "aws_db_instance" "main" {
  count = var.database_type == "rds" ? 1 : 0
  
  identifier     = "${var.project_name}-${var.environment}"
  engine         = "postgres"
  engine_version = "15.3"
  instance_class = "db.t3.micro"
  
  storage_encrypted = var.enable_encryption
  kms_key_id       = var.kms_key_id
  
  backup_retention_period = var.backup_retention_days
  
  tags = var.tags
}

output "endpoint" {
  value = var.database_type == "rds" ? aws_db_instance.main[0].endpoint : "neon-endpoint"
}

output "connection_string" {
  value     = "postgresql://user:pass@endpoint/db"
  sensitive = true
}
