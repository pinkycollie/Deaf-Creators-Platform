# Database Module
# Supports Neon PostgreSQL, AWS RDS, and Supabase

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

# AWS RDS PostgreSQL Instance
resource "aws_db_subnet_group" "main" {
  count = var.database_provider == "rds" ? 1 : 0

  name       = "${var.project_name}-${var.environment}-db-subnet"
  subnet_ids = var.subnet_ids

  tags = merge(var.tags, {
    Name = "${var.project_name}-db-subnet-group"
  })
}

resource "aws_security_group" "database" {
  count = var.database_provider == "rds" ? 1 : 0

  name        = "${var.project_name}-${var.environment}-db-sg"
  description = "Security group for RDS PostgreSQL"

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # In production, restrict this
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = var.tags
}

resource "random_password" "database" {
  count = var.database_provider == "rds" ? 1 : 0

  length  = 32
  special = true
}

resource "aws_db_instance" "main" {
  count = var.database_provider == "rds" ? 1 : 0

  identifier           = "${var.project_name}-${var.environment}-db"
  engine               = "postgres"
  engine_version       = var.postgres_version
  instance_class       = var.postgres_instance_class
  allocated_storage    = var.allocated_storage
  storage_type         = "gp3"
  storage_encrypted    = true

  db_name  = var.database_name
  username = var.master_username
  password = random_password.database[0].result

  db_subnet_group_name   = aws_db_subnet_group.main[0].name
  vpc_security_group_ids = [aws_security_group.database[0].id]

  multi_az               = var.multi_az
  backup_retention_period = var.backup_retention_days
  backup_window          = "03:00-04:00"
  maintenance_window     = "mon:04:00-mon:05:00"

  skip_final_snapshot       = true
  final_snapshot_identifier = "${var.project_name}-${var.environment}-final-snapshot"

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  tags = merge(var.tags, {
    Name = "${var.project_name}-database"
  })
}

# Store database password in Secrets Manager
resource "aws_secretsmanager_secret" "database_password" {
  count = var.database_provider == "rds" ? 1 : 0

  name = "${var.project_name}-${var.environment}-db-password"

  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "database_password" {
  count = var.database_provider == "rds" ? 1 : 0

  secret_id     = aws_secretsmanager_secret.database_password[0].id
  secret_string = random_password.database[0].result
}

# Neon PostgreSQL Configuration
# Note: Neon doesn't have an official Terraform provider yet
# This provides configuration for manual setup
locals {
  neon_config = var.database_provider == "neon" ? {
    project_name = var.neon_project_name
    region       = var.neon_region
    postgres_version = var.postgres_version
    database_name    = var.database_name
    # Connection string format
    connection_format = "postgresql://[user]:[password]@[endpoint]/${var.database_name}?sslmode=require"
  } : null

  supabase_config = var.database_provider == "supabase" ? {
    project_name = var.project_name
    region       = var.neon_region
    postgres_version = var.postgres_version
    database_name    = var.database_name
    # Connection string format
    connection_format = "postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/${var.database_name}"
  } : null
}

output "neon_config" {
  description = "Neon PostgreSQL configuration (manual setup required)"
  value       = local.neon_config
}

output "supabase_config" {
  description = "Supabase configuration (manual setup required)"
  value       = local.supabase_config
}
