# Terraform Deployment Scenarios

This document provides example configurations for different deployment scenarios based on scale, budget, and requirements.

## Scenario 1: MVP / Development (Low Cost)

**Best for**: Initial development, proof of concept, small teams

### Configuration

```hcl
# terraform.tfvars

project_name = "deaf-creator-platform"
environment  = "development"
aws_region   = "us-east-1"

# Frontend: Vercel (Free tier available)
frontend_hosting_provider = "vercel"
vercel_project_name      = "deaf-creator-platform-dev"
vercel_framework         = "nextjs"

# Backend: AWS Lambda (Pay per use)
backend_hosting_provider = "lambda"
lambda_runtime          = "nodejs20.x"
lambda_memory_size      = 512
lambda_timeout          = 30

# Database: Neon (Free tier: 0.5GB storage)
database_provider = "neon"
neon_project_name = "deaf-creator-platform-dev"
neon_region       = "aws-us-east-2"

# Storage: Cloudflare R2 (Free tier: 10GB)
storage_provider     = "cloudflare_r2"
r2_bucket_name       = "deaf-creator-dev-uploads"

# DNS: Cloudflare
dns_provider     = "cloudflare"
domain_name      = "example.com"
subdomain_prefix = "dev"

# Monitoring: Minimal
monitoring_enabled  = true
log_retention_days = 7

# CI/CD: Enabled
cicd_enabled = true
```

### Estimated Monthly Cost
- Vercel: $0 (Free tier)
- AWS Lambda: $0-5 (Free tier + minimal usage)
- Neon: $0 (Free tier)
- Cloudflare R2: $0 (Free tier)
- **Total: ~$0-10/month**

---

## Scenario 2: Production MVP (Cost-Effective)

**Best for**: Small to medium production deployments, startups

### Configuration

```hcl
# terraform.tfvars

project_name = "deaf-creator-platform"
environment  = "production"
aws_region   = "us-east-1"

# Frontend: Vercel Pro
frontend_hosting_provider = "vercel"
vercel_project_name      = "deaf-creator-platform"
vercel_framework         = "nextjs"

# Backend: AWS Lambda
backend_hosting_provider = "lambda"
lambda_runtime          = "nodejs20.x"
lambda_memory_size      = 1024
lambda_timeout          = 60

# Database: Neon Scale
database_provider = "neon"
neon_project_name = "deaf-creator-platform"
neon_region       = "aws-us-east-2"

# Storage: Cloudflare R2
storage_provider     = "cloudflare_r2"
r2_bucket_name       = "deaf-creator-uploads"

# DNS: Cloudflare with CDN
dns_provider     = "cloudflare"
domain_name      = "example.com"
subdomain_prefix = "creators"
cdn_enabled      = true

# Secrets: AWS Secrets Manager
secrets_provider = "aws_secrets_manager"
secrets_to_manage = [
  "database_url",
  "nextauth_secret",
  "stripe_secret_key",
  "pinksync_api_key"
]

# Monitoring: Full setup
monitoring_enabled  = true
log_retention_days = 30
alarm_email        = "ops@example.com"

# CI/CD: Enabled with OIDC
cicd_enabled = true
```

### Estimated Monthly Cost
- Vercel Pro: $20
- AWS Lambda: $10-30
- Neon: $20-50 (Scale plan)
- Cloudflare R2: $5-15
- AWS Secrets Manager: $2-5
- CloudWatch: $5-10
- **Total: ~$62-130/month**

---

## Scenario 3: Enterprise (AWS Full Stack)

**Best for**: Large-scale deployments, enterprise requirements, compliance needs

### Configuration

```hcl
# terraform.tfvars

project_name = "deaf-creator-platform"
environment  = "production"
aws_region   = "us-east-1"

# Frontend: S3 + CloudFront
frontend_hosting_provider = "s3"
s3_frontend_bucket_name  = "deaf-creator-platform-frontend"
cloudfront_enabled       = true

# Backend: Lambda with reserved concurrency
backend_hosting_provider = "lambda"
lambda_runtime          = "nodejs20.x"
lambda_memory_size      = 2048
lambda_timeout          = 60

# Database: RDS PostgreSQL with Multi-AZ
database_provider         = "rds"
postgres_version         = "15"
postgres_instance_class  = "db.r6g.large"
database_allocated_storage = 100
database_multi_az        = true
database_backup_retention = 30

# Storage: S3 with lifecycle policies
storage_provider     = "s3"
s3_storage_bucket_name = "deaf-creator-platform-storage"
s3_versioning_enabled = true
s3_lifecycle_rules = [
  {
    id              = "archive-old-videos"
    enabled         = true
    prefix          = "videos/"
    expiration_days = 365
  }
]

# DNS: Route53 with health checks
dns_provider     = "route53"
domain_name      = "example.com"
subdomain_prefix = "creators"
cdn_enabled      = true

# Secrets: AWS Secrets Manager
secrets_provider = "aws_secrets_manager"
secrets_recovery_window = 30

# Monitoring: Full enterprise monitoring
monitoring_enabled  = true
log_retention_days = 90
alarm_email        = "ops-team@example.com"

# CI/CD: Full automation
cicd_enabled = true

# Tags for cost allocation
tags = {
  Project     = "deaf-creator-platform"
  Environment = "production"
  CostCenter  = "engineering"
  Compliance  = "soc2"
}
```

### Estimated Monthly Cost
- CloudFront: $50-200
- Lambda: $100-300 (with reserved concurrency)
- RDS (Multi-AZ): $300-500
- S3: $50-150
- Route53: $10-20
- Secrets Manager: $10-20
- CloudWatch: $50-100
- **Total: ~$570-1,290/month**

---

## Scenario 4: Hybrid Multi-Cloud

**Best for**: Optimizing costs and features across providers

### Configuration

```hcl
# terraform.tfvars

project_name = "deaf-creator-platform"
environment  = "production"
aws_region   = "us-east-1"

# Frontend: Vercel (best Next.js support)
frontend_hosting_provider = "vercel"
vercel_project_name      = "deaf-creator-platform"

# Backend: AWS Lambda (serverless)
backend_hosting_provider = "lambda"
lambda_runtime          = "nodejs20.x"
lambda_memory_size      = 1024
lambda_timeout          = 60

# Database: Neon (serverless PostgreSQL)
database_provider = "neon"
neon_project_name = "deaf-creator-platform"
neon_region       = "aws-us-east-2"

# Storage: AWS S3 (mature ecosystem)
storage_provider       = "s3"
s3_storage_bucket_name = "deaf-creator-platform-storage"
s3_versioning_enabled  = true

# DNS: Cloudflare (best DDoS protection + CDN)
dns_provider     = "cloudflare"
domain_name      = "example.com"
subdomain_prefix = "creators"
cdn_enabled      = true

# Secrets: AWS (integration with Lambda)
secrets_provider = "aws_secrets_manager"

# Monitoring: AWS (integration with Lambda)
monitoring_enabled  = true
log_retention_days = 30

# CI/CD: GitHub Actions with OIDC
cicd_enabled = true
```

### Estimated Monthly Cost
- Vercel Pro: $20
- Lambda: $20-50
- Neon: $25-75
- S3: $20-50
- Cloudflare: $5-20
- AWS Services: $20-40
- **Total: ~$110-255/month**

---

## Scenario 5: Staging Environment

**Best for**: Pre-production testing, QA validation

### Configuration

```hcl
# terraform.tfvars

project_name = "deaf-creator-platform"
environment  = "staging"
aws_region   = "us-east-1"

# Match production but with smaller resources
frontend_hosting_provider = "vercel"
vercel_project_name      = "deaf-creator-platform-staging"

backend_hosting_provider = "lambda"
lambda_memory_size      = 512  # Half of production
lambda_timeout          = 30

database_provider = "neon"
neon_project_name = "deaf-creator-platform-staging"

storage_provider     = "cloudflare_r2"
r2_bucket_name       = "deaf-creator-staging-uploads"

dns_provider     = "cloudflare"
subdomain_prefix = "staging"

# Minimal monitoring
monitoring_enabled  = true
log_retention_days = 14

cicd_enabled = true
```

### Estimated Monthly Cost
- Similar to MVP but with staging data
- **Total: ~$20-50/month**

---

## Migration Paths

### From MVP to Production

1. **Upgrade Database**: 
   - Neon Free → Neon Scale
   - Or migrate to RDS for more control

2. **Add Monitoring**:
   - Enable CloudWatch alarms
   - Set up email notifications

3. **Implement Backups**:
   - Configure RDS automated backups
   - Add S3 lifecycle policies

4. **Scale Backend**:
   - Increase Lambda memory
   - Add reserved concurrency

### From Single Cloud to Multi-Cloud

1. **Frontend First**:
   - Move to Vercel for better DX
   - Keep backend on AWS initially

2. **Storage Optimization**:
   - Evaluate Cloudflare R2 for cost savings
   - Migrate gradually using multi-cloud sync

3. **DNS Migration**:
   - Move to Cloudflare for CDN + security
   - Update DNS records carefully

---

## Workspace Management

Use Terraform workspaces for different environments:

```bash
# Create workspaces
terraform workspace new development
terraform workspace new staging
terraform workspace new production

# Switch between environments
terraform workspace select production
terraform apply

terraform workspace select staging
terraform apply -var="environment=staging"
```

---

## Cost Optimization Tips

1. **Use Serverless for Variable Workloads**:
   - Lambda functions scale to zero
   - Neon pauses when inactive

2. **Enable S3 Lifecycle Policies**:
   - Archive old videos to S3 Glacier
   - Delete temporary files automatically

3. **Right-Size Resources**:
   - Start small and monitor
   - Use CloudWatch metrics to optimize

4. **Use Cloudflare R2 for Storage**:
   - No egress fees (vs S3)
   - S3-compatible API

5. **Reserved Capacity for Predictable Loads**:
   - RDS Reserved Instances (up to 60% savings)
   - Lambda Provisioned Concurrency only when needed

6. **Monitor and Alert**:
   - Set up billing alarms
   - Review AWS Cost Explorer monthly

---

## Security Considerations by Scenario

### Development
- Use separate AWS account
- Disable production access
- Minimal monitoring to reduce costs

### Production MVP
- Enable CloudTrail
- Configure security groups restrictively
- Use Secrets Manager for all credentials

### Enterprise
- Multi-account AWS setup
- AWS Organizations with SCPs
- GuardDuty for threat detection
- AWS Config for compliance
- Regular security audits

---

## Conclusion

Choose the scenario that best matches your:
- **Scale**: Expected traffic and data volume
- **Budget**: Available infrastructure spend
- **Compliance**: Regulatory requirements
- **Team**: DevOps expertise and availability

Start with MVP or Production MVP, then scale up as needed. The modular Terraform design makes it easy to migrate between scenarios.
