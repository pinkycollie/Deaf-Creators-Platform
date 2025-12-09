# Terraform Infrastructure for v0-deaf-creator-platform-multi-tenants

This directory contains a generalized Terraform configuration skeleton for deploying the infrastructure for the Deaf Creator Platform. The configuration is designed to be flexible and can be customized for various cloud providers and use cases.

## 📋 Overview

This Terraform configuration provides modular infrastructure components for:

1. **Frontend Hosting**: Vercel, AWS S3 + CloudFront, or Cloudflare Pages
2. **Backend Hosting**: AWS Lambda, EC2, or Cloudflare Workers
3. **Database**: Neon PostgreSQL (serverless), AWS RDS, or Supabase
4. **Object Storage**: Cloudflare R2 or AWS S3 for video/file storage
5. **DNS & Networking**: Cloudflare or AWS Route53 with CDN integration
6. **Secrets Management**: AWS Secrets Manager or Azure Key Vault
7. **Monitoring**: AWS CloudWatch with dashboards and alarms
8. **CI/CD**: GitHub Actions integration with OIDC

## 🚀 Quick Start

### Prerequisites

1. **Terraform**: Install Terraform >= 1.5.0
   ```bash
   # macOS
   brew install terraform
   
   # Ubuntu/Debian
   wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
   echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
   sudo apt update && sudo apt install terraform
   ```

2. **Cloud Provider Credentials**:
   - AWS: Configure AWS CLI or set environment variables
   - Cloudflare: API token with appropriate permissions
   - Vercel: API token for deployments
   - GitHub: Personal access token for CI/CD setup

3. **Provider API Tokens**: Obtain API tokens from your chosen providers

### Initial Setup

1. **Navigate to the terraform directory**:
   ```bash
   cd terraform
   ```

2. **Copy the example variables file**:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

3. **Edit `terraform.tfvars`** with your configuration:
   ```hcl
   # Basic Configuration
   project_name = "deaf-creator-platform"
   environment  = "production"
   aws_region   = "us-east-1"
   
   # Provider Selection
   frontend_hosting_provider = "vercel"     # or "s3", "cloudflare_pages"
   backend_hosting_provider  = "lambda"     # or "ec2", "cloudflare_workers"
   database_provider         = "neon"       # or "rds", "supabase"
   storage_provider          = "cloudflare_r2"  # or "s3"
   dns_provider              = "cloudflare" # or "route53"
   
   # Domain Configuration
   domain_name      = "example.com"
   subdomain_prefix = "creators"
   ```

4. **Set sensitive variables as environment variables** (recommended):
   ```bash
   export TF_VAR_cloudflare_api_token="your-cloudflare-token"
   export TF_VAR_vercel_api_token="your-vercel-token"
   export TF_VAR_github_token="your-github-token"
   ```

5. **Initialize Terraform**:
   ```bash
   terraform init
   ```

6. **Review the planned changes**:
   ```bash
   terraform plan
   ```

7. **Apply the configuration**:
   ```bash
   terraform apply
   ```

## 📁 Project Structure

```
terraform/
├── main.tf                    # Root configuration with provider setup
├── variables.tf               # Variable declarations
├── outputs.tf                 # Output values
├── terraform.tfvars.example   # Example configuration values
├── README.md                  # This file
│
└── modules/
    ├── frontend/              # Frontend hosting module
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    │
    ├── backend/               # Backend API module
    │   ├── main.tf
    │   ├── variables.tf
    │   ├── outputs.tf
    │   └── lambda_placeholder.zip
    │
    ├── database/              # Database module
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    │
    ├── storage/               # Object storage module
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    │
    ├── dns/                   # DNS and networking module
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    │
    ├── secrets/               # Secrets management module
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    │
    ├── monitoring/            # Monitoring and observability module
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    │
    └── cicd/                  # CI/CD pipeline module
        ├── main.tf
        ├── variables.tf
        └── outputs.tf
```

## 🔧 Configuration Options

### Provider Combinations

The infrastructure is designed to be flexible. Here are some common combinations:

#### Option 1: Vercel + Neon + Cloudflare (Recommended for MVP)
```hcl
frontend_hosting_provider = "vercel"
backend_hosting_provider  = "lambda"  # or integrate with Vercel API routes
database_provider         = "neon"
storage_provider          = "cloudflare_r2"
dns_provider              = "cloudflare"
```

**Pros**: Minimal setup, serverless, cost-effective for small to medium scale
**Cons**: Limited control over infrastructure

#### Option 2: AWS Full Stack
```hcl
frontend_hosting_provider = "s3"
backend_hosting_provider  = "lambda"
database_provider         = "rds"
storage_provider          = "s3"
dns_provider              = "route53"
```

**Pros**: Full AWS integration, enterprise-grade, fine-grained control
**Cons**: More complex setup, potentially higher costs

#### Option 3: Hybrid Approach
```hcl
frontend_hosting_provider = "vercel"
backend_hosting_provider  = "lambda"
database_provider         = "neon"
storage_provider          = "s3"
dns_provider              = "cloudflare"
```

**Pros**: Best of both worlds, optimized for each component
**Cons**: Requires managing multiple providers

### Module Details

#### Frontend Module
Supports:
- **Vercel**: Next.js optimized deployment with edge functions
- **AWS S3 + CloudFront**: Static hosting with global CDN
- **Cloudflare Pages**: JAMstack deployment

#### Backend Module
Supports:
- **AWS Lambda**: Serverless functions with API Gateway
- **AWS EC2**: Traditional server deployment
- **Cloudflare Workers**: Edge computing at scale

#### Database Module
Supports:
- **Neon**: Serverless PostgreSQL (manual setup required)
- **AWS RDS**: Fully managed PostgreSQL
- **Supabase**: PostgreSQL with additional features (manual setup)

#### Storage Module
Supports:
- **AWS S3**: Enterprise object storage with lifecycle policies
- **Cloudflare R2**: S3-compatible storage with zero egress fees

#### DNS Module
Supports:
- **Cloudflare**: DNS with built-in CDN and DDoS protection
- **AWS Route53**: AWS-native DNS with health checks

#### Secrets Module
Supports:
- **AWS Secrets Manager**: Encrypted secret storage with rotation
- **Azure Key Vault**: Enterprise secret management (configuration only)

#### Monitoring Module
Features:
- CloudWatch log groups with configurable retention
- Custom dashboards for application metrics
- Email alerts via SNS
- Pre-configured log insights queries

#### CI/CD Module
Features:
- GitHub Actions OIDC integration (no long-lived credentials)
- Automated secret injection
- IAM roles and policies for deployments
- Workflow template generation

## 🔒 Security Best Practices

1. **Use OIDC for CI/CD**: The configuration uses OpenID Connect for GitHub Actions, eliminating the need for long-lived AWS credentials.

2. **Encrypt Sensitive Data**: All secrets are stored in AWS Secrets Manager or Azure Key Vault with encryption at rest.

3. **Apply Least Privilege**: IAM policies grant only necessary permissions for each component.

4. **Enable Logging**: All resources have logging enabled by default.

5. **Use Private Subnets**: For RDS and EC2, configure VPC with private subnets (not included in skeleton).

6. **Rotate Secrets Regularly**: Implement secret rotation policies for database passwords and API keys.

7. **Review Security Groups**: Restrict inbound rules to only necessary ports and sources.

## 📊 Outputs

After applying the configuration, Terraform will output important values:

```bash
# View all outputs
terraform output

# View specific output
terraform output frontend_url
terraform output database_endpoint
```

Key outputs include:
- `frontend_url`: URL of the deployed frontend
- `backend_endpoint`: Backend API endpoint
- `database_endpoint`: Database connection string (sensitive)
- `storage_bucket_name`: Object storage bucket name
- `cdn_endpoint`: CDN URL for content delivery

## 🔄 Managing State

### Remote State (Recommended for Teams)

1. **S3 Backend**:
   Edit `main.tf` and uncomment the backend configuration:
   ```hcl
   backend "s3" {
     bucket = "your-terraform-state-bucket"
     key    = "deaf-creator-platform/terraform.tfstate"
     region = "us-east-1"
     encrypt = true
     dynamodb_table = "terraform-lock"
   }
   ```

2. **Create state bucket**:
   ```bash
   aws s3 mb s3://your-terraform-state-bucket
   aws s3api put-bucket-versioning \
     --bucket your-terraform-state-bucket \
     --versioning-configuration Status=Enabled
   ```

3. **Re-initialize**:
   ```bash
   terraform init -migrate-state
   ```

### Local State (Development Only)

Local state is stored in `terraform.tfstate` (ignored by git). Use this only for testing.

## 🧪 Testing Changes

Before applying to production:

1. **Create a separate workspace**:
   ```bash
   terraform workspace new staging
   terraform workspace select staging
   ```

2. **Plan with variable override**:
   ```bash
   terraform plan -var="environment=staging"
   ```

3. **Apply to staging**:
   ```bash
   terraform apply -var="environment=staging"
   ```

## 🔧 Troubleshooting

### Common Issues

1. **Provider Authentication Errors**:
   - Ensure API tokens are set correctly
   - Check token permissions and scopes
   - Verify token hasn't expired

2. **Resource Already Exists**:
   - Import existing resources: `terraform import <resource_type>.<name> <id>`
   - Or remove from state: `terraform state rm <resource_type>.<name>`

3. **Dependency Errors**:
   - Run `terraform init -upgrade` to update providers
   - Check provider version constraints

4. **State Lock Issues**:
   - If using DynamoDB locking: `terraform force-unlock <lock-id>`

### Debugging

Enable detailed logging:
```bash
export TF_LOG=DEBUG
terraform apply
```

## 📚 Additional Resources

- [Terraform Documentation](https://www.terraform.io/docs)
- [AWS Provider Documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Cloudflare Provider Documentation](https://registry.terraform.io/providers/cloudflare/cloudflare/latest/docs)
- [Vercel Provider Documentation](https://registry.terraform.io/providers/vercel/vercel/latest/docs)

## 🤝 Contributing

When adding new infrastructure:

1. Create a new module in `modules/` if needed
2. Update variable definitions in `variables.tf`
3. Add outputs to `outputs.tf`
4. Document the changes in this README
5. Test with `terraform plan` before committing

## 📝 Manual Configuration Required

Some services don't have full Terraform support and require manual setup:

1. **Neon PostgreSQL**: Create project manually at [neon.tech](https://neon.tech) and add connection string to secrets
2. **Cloudflare R2**: Create bucket via Cloudflare dashboard or API
3. **Cloudflare Pages**: Initial project setup via dashboard, then use API for updates
4. **Vercel Environment Variables**: Set environment variables in Vercel dashboard
5. **GitHub Secrets**: Some secrets may need manual configuration in repository settings

## 🔐 Environment Variables

Store sensitive values as environment variables:

```bash
# AWS Credentials (if not using AWS CLI default profile)
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"

# Terraform Variables
export TF_VAR_cloudflare_api_token="your-token"
export TF_VAR_vercel_api_token="your-token"
export TF_VAR_github_token="your-token"

# Or use a .env file (add to .gitignore)
source .env
```

## 🗑️ Cleanup

To destroy all resources:

```bash
# Review what will be destroyed
terraform plan -destroy

# Destroy all resources
terraform destroy
```

⚠️ **Warning**: This will delete all infrastructure. Ensure you have backups of critical data.

## 📖 Version History

- **v1.0.0** (2025-12): Initial Terraform skeleton implementation
  - Modular architecture for all infrastructure components
  - Support for multiple cloud providers
  - CI/CD integration with GitHub Actions
  - Comprehensive monitoring and secrets management

---

**Note**: This is a generalized infrastructure skeleton. Customize it based on your specific requirements, security policies, and organizational standards.
