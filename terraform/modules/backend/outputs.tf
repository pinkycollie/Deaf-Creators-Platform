output "id" {
  description = "Backend resource identifier"
  value = (
    var.backend_provider == "lambda" && length(aws_lambda_function.api) > 0 ? aws_lambda_function.api[0].id :
    var.backend_provider == "ec2" && length(aws_instance.backend) > 0 ? aws_instance.backend[0].id :
    "cloudflare_worker"
  )
}

output "endpoint" {
  description = "Backend API endpoint"
  value = (
    var.backend_provider == "lambda" && length(aws_apigatewayv2_api.api) > 0 ? aws_apigatewayv2_api.api[0].api_endpoint :
    var.backend_provider == "ec2" && length(aws_instance.backend) > 0 ? "http://${aws_instance.backend[0].public_ip}" :
    "https://${var.project_name}.${var.cloudflare_account_id}.workers.dev"
  )
}

output "api_gateway_id" {
  description = "API Gateway ID"
  value = (
    var.backend_provider == "lambda" && length(aws_apigatewayv2_api.api) > 0 ? aws_apigatewayv2_api.api[0].id :
    null
  )
}

output "lambda_function_arn" {
  description = "Lambda function ARN"
  value = (
    var.backend_provider == "lambda" && length(aws_lambda_function.api) > 0 ? aws_lambda_function.api[0].arn :
    null
  )
}

output "ec2_public_ip" {
  description = "EC2 instance public IP"
  value = (
    var.backend_provider == "ec2" && length(aws_instance.backend) > 0 ? aws_instance.backend[0].public_ip :
    null
  )
}
