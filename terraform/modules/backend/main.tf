# Backend Hosting Module
# Supports AWS Lambda, EC2, and Cloudflare Workers

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda" {
  count = var.backend_provider == "lambda" ? 1 : 0

  name = "${var.project_name}-${var.environment}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  count = var.backend_provider == "lambda" ? 1 : 0

  role       = aws_iam_role.lambda[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Lambda Function Placeholder
resource "aws_lambda_function" "api" {
  count = var.backend_provider == "lambda" ? 1 : 0

  function_name = "${var.project_name}-${var.environment}-api"
  role          = aws_iam_role.lambda[0].arn
  handler       = "index.handler"
  runtime       = var.lambda_runtime
  memory_size   = var.lambda_memory_size
  timeout       = var.lambda_timeout

  # Placeholder for function code
  # In production, use S3 bucket or container image
  filename = "${path.module}/lambda_placeholder.zip"

  environment {
    variables = {
      ENVIRONMENT = var.environment
      PROJECT     = var.project_name
    }
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-api"
  })
}

# API Gateway for Lambda
resource "aws_apigatewayv2_api" "api" {
  count = var.backend_provider == "lambda" ? 1 : 0

  name          = "${var.project_name}-${var.environment}-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["*"]
    max_age       = 300
  }

  tags = var.tags
}

resource "aws_apigatewayv2_integration" "lambda" {
  count = var.backend_provider == "lambda" ? 1 : 0

  api_id           = aws_apigatewayv2_api.api[0].id
  integration_type = "AWS_PROXY"

  integration_uri    = aws_lambda_function.api[0].invoke_arn
  integration_method = "POST"
}

resource "aws_apigatewayv2_route" "default" {
  count = var.backend_provider == "lambda" ? 1 : 0

  api_id    = aws_apigatewayv2_api.api[0].id
  route_key = "$default"

  target = "integrations/${aws_apigatewayv2_integration.lambda[0].id}"
}

resource "aws_apigatewayv2_stage" "default" {
  count = var.backend_provider == "lambda" ? 1 : 0

  api_id      = aws_apigatewayv2_api.api[0].id
  name        = "$default"
  auto_deploy = true

  tags = var.tags
}

resource "aws_lambda_permission" "api_gateway" {
  count = var.backend_provider == "lambda" ? 1 : 0

  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api[0].function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.api[0].execution_arn}/*/*"
}

# EC2 Instance for Backend
resource "aws_security_group" "backend" {
  count = var.backend_provider == "ec2" ? 1 : 0

  name        = "${var.project_name}-${var.environment}-backend-sg"
  description = "Security group for backend EC2 instance"

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 22
    to_port     = 22
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

resource "aws_instance" "backend" {
  count = var.backend_provider == "ec2" ? 1 : 0

  ami           = var.ec2_ami_id
  instance_type = var.ec2_instance_type

  vpc_security_group_ids = [aws_security_group.backend[0].id]

  user_data = <<-EOF
              #!/bin/bash
              # Install Node.js and setup application
              curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
              sudo apt-get install -y nodejs
              
              # Placeholder for application deployment
              echo "Backend server ready"
              EOF

  tags = merge(var.tags, {
    Name = "${var.project_name}-backend"
  })
}

# Cloudflare Worker Placeholder
# Note: Cloudflare Workers are typically deployed via Wrangler CLI
# This provides configuration management
locals {
  cloudflare_worker_config = var.backend_provider == "cloudflare_workers" ? {
    account_id  = var.cloudflare_account_id
    script_name = "${var.project_name}-${var.environment}-worker"
    script_path = var.worker_script_path
    routes      = []
  } : null
}

output "cloudflare_worker_config" {
  description = "Cloudflare Worker configuration (manual deployment required)"
  value       = local.cloudflare_worker_config
}
