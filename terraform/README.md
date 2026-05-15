# Terraform Infrastructure for Deaf Creator Platform

Enterprise-grade Infrastructure as Code (IaC) with Cloudflare Zero Trust Access, comprehensive security controls, and multi-compliance support (HIPAA, GDPR, SOC 2).

## 🏗️ Architecture Overview

This Terraform configuration provides a complete multi-tenant platform infrastructure with:

- **Cloudflare Zero Trust Access**: Enterprise-grade authentication and access control
- **Security Modules**: WAF, firewall, DDoS protection, bot management
- **Compliance Modules**: HIPAA, GDPR, SOC 2, PCI-DSS compliance
- **Multi-Provider Support**: Vercel (frontend), AWS/Lambda (backend), Neon/RDS (database)
- **Encrypted Storage**: Cloudflare R2 with Zero Trust protection
- **Comprehensive Monitoring**: CloudWatch, CloudTrail, Cloudflare Analytics

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Module Overview](#module-overview)
- [Zero Trust Access Setup](#zero-trust-access-setup)
- [Compliance Configuration](#compliance-configuration)
- [Deployment Scenarios](#deployment-scenarios)
- [Security Features](#security-features)
- [Usage Examples](#usage-examples)

## 🚀 Quick Start

### 1. Prerequisites

Ensure you have the following installed and configured:

```bash
# Install Terraform
brew install terraform  # macOS
# or download from https://www.terraform.io/downloads

# Verify installation
terraform version  # Should be >= 1.5.0
```

### 2. Configure Credentials

```bash
# Cloudflare API Token
export TF_VAR_cloudflare_api_token="your-cloudflare-token"

# Vercel API Token
export TF_VAR_vercel_api_token="your-vercel-token"

# AWS Credentials (if using AWS resources)
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
```

### 3. Initialize Terraform

```bash
cd terraform/environments/production
terraform init
```

### 4. Review and Apply

```bash
# Review the plan
terraform plan -out=tfplan

# Apply the configuration
terraform apply tfplan
```

## 📦 Prerequisites

### Required Accounts

1. **Cloudflare Account** ([sign up](https://dash.cloudflare.com/sign-up))
   - Active zone (domain)
   - Zero Trust Access enabled
   - API token with appropriate permissions

2. **Vercel Account** ([sign up](https://vercel.com/signup))
   - API token for deployments

3. **AWS Account** (optional, for backend/database)
   - IAM credentials with appropriate permissions

4. **GitHub Repository**
   - Repository access for CI/CD

### Required Permissions

#### Cloudflare API Token Permissions
- Zone:Read
- Zone Settings:Edit
- DNS:Edit
- Access:Edit
- Account Settings:Read
- Account Firewall Access Rules:Edit
- Account WAF:Edit
- Workers R2 Storage:Edit

#### Vercel API Token Permissions
- Full access to your team/projects

#### AWS IAM Permissions (if applicable)
- EC2, Lambda, RDS, S3, KMS, CloudTrail, CloudWatch, IAM

## 🧩 Module Overview

### Core Modules

| Module | Purpose | Documentation |
|--------|---------|---------------|
| `cloudflare-zero-trust` | Enterprise authentication & access control | [README](./modules/cloudflare-zero-trust/README.md) |
| `security` | WAF, firewall, DDoS protection, encryption | [README](./modules/security/README.md) |
| `compliance` | HIPAA, GDPR, SOC 2 compliance controls | [README](./modules/compliance/README.md) |
| `frontend` | Vercel deployment with Zero Trust | [README](./modules/frontend/README.md) |
| `backend` | Lambda/Workers/EC2 with Zero Trust | [README](./modules/backend/README.md) |
| `database` | Neon/RDS with encryption & backups | [README](./modules/database/README.md) |
| `storage` | Cloudflare R2 with Zero Trust | [README](./modules/storage/README.md) |
| `monitoring` | CloudWatch, analytics, alerting | [README](./modules/monitoring/README.md) |

## 🔐 Zero Trust Access Setup

### Overview

Cloudflare Zero Trust Access provides enterprise-grade authentication without a VPN. All access requests are authenticated, authorized, and encrypted.

### Architecture

```
User Request → Identity Provider (Google/Azure/Okta)
             → Zero Trust Access Policy Check
             → Cloudflare Tunnel (for backend)
             → Protected Application
```

### Configuration Steps

1. **Enable Zero Trust in your configuration:**

```hcl
# terraform.tfvars
enable_zero_trust = true

identity_providers = {
  google = {
    name = "Google SSO"
    type = "google"
    config = {
      client_id     = "your-google-client-id"
      client_secret = "your-google-client-secret"
    }
  }
}
```

2. **Define Zero Trust Applications:**

```hcl
zero_trust_applications = {
  frontend = {
    name             = "Frontend App"
    domain           = "app.yourdomain.com"
    type             = "self_hosted"
    session_duration = "24h"
    allowed_idps     = ["google"]
    auto_redirect    = true
  }
  
  api = {
    name             = "Backend API"
    domain           = "api.yourdomain.com"
    type             = "self_hosted"
    session_duration = "12h"
    allowed_idps     = ["google"]
    auto_redirect    = false
  }
  
  storage = {
    name             = "Storage Access"
    domain           = "uploads.yourdomain.com"
    type             = "self_hosted"
    session_duration = "1h"
    allowed_idps     = ["google"]
    auto_redirect    = false
  }
}
```

3. **Configure Access Policies:**

```hcl
access_policies = {
  admin_only = {
    name        = "Admin Access"
    application = "frontend"
    decision    = "allow"
    precedence  = 1
    include = [
      {
        email_domain = "yourcompany.com"
      }
    ]
    require = [
      {
        auth_method = "mfa"
      }
    ]
    exclude = []
  }
  
  developer_api = {
    name        = "Developer API Access"
    application = "api"
    decision    = "allow"
    precedence  = 2
    include = [
      {
        email_domain = "yourcompany.com"
      }
    ]
    require = []
    exclude = []
  }
}
```

### Cloudflare Tunnel for Backend

For secure backend access without exposing public IPs:

```hcl
# In cloudflare-zero-trust module
create_tunnel = true

tunnel_ingress_rules = [
  {
    hostname = "api.yourdomain.com"
    service  = "http://localhost:3000"
  },
  {
    hostname = "admin.yourdomain.com"
    service  = "http://localhost:3001"
  }
]
```

## 📜 Compliance Configuration

### HIPAA Compliance

HIPAA requires specific controls for Protected Health Information (PHI):

```hcl
compliance_standards = ["HIPAA"]

# Enables:
# - CloudTrail audit logging
# - Encrypted storage (at rest & in transit)
# - MFA requirement
# - 90-day log retention minimum
# - AWS Config for continuous monitoring
```

**HIPAA Controls Implemented:**
- ✅ Access Controls (§164.312(a)(1))
- ✅ Audit Controls (§164.312(b))
- ✅ Integrity Controls (§164.312(c)(1))
- ✅ Transmission Security (§164.312(e)(1))
- ✅ Encryption (§164.312(a)(2)(iv))

### GDPR Compliance

GDPR requires data protection and privacy controls:

```hcl
compliance_standards = ["GDPR"]

# Enables:
# - Data residency controls
# - 7-year data retention policy
# - Right to be forgotten (lifecycle policies)
# - Audit logging for data access
# - Encryption of personal data
```

**GDPR Controls Implemented:**
- ✅ Data Protection by Design (Article 25)
- ✅ Right to Erasure (Article 17)
- ✅ Data Portability (Article 20)
- ✅ Security of Processing (Article 32)
- ✅ Breach Notification (Article 33)

### SOC 2 Compliance

SOC 2 Trust Service Criteria:

```hcl
compliance_standards = ["SOC2"]

# Enables:
# - CloudTrail for audit trails
# - CloudWatch for monitoring
# - AWS Config for change tracking
# - Encryption controls
# - Access controls and MFA
```

**SOC 2 Criteria Implemented:**
- ✅ Security (CC6.1-CC6.8)
- ✅ Availability (A1.1-A1.3)
- ✅ Processing Integrity (PI1.1-PI1.5)
- ✅ Confidentiality (C1.1-C1.2)

### Multi-Compliance Configuration

```hcl
compliance_standards = ["HIPAA", "GDPR", "SOC2"]

# Enables all controls from all standards
# Ensures strictest requirements are met
```

## 🏢 Deployment Scenarios

### MVP / Development ($0-10/month)

Minimal configuration for development and testing:

```hcl
# environments/mvp/terraform.tfvars
environment           = "mvp"
enable_zero_trust     = false
enable_waf           = false
backend_type         = "lambda"
database_type        = "neon"
compliance_standards = []
```

### Production ($62-130/month)

Standard production deployment:

```hcl
# environments/production/terraform.tfvars
environment           = "production"
enable_zero_trust     = false
enable_waf           = true
enable_ddos_protection = true
backend_type         = "lambda"
database_type        = "neon"
compliance_standards = []
backup_retention_days = 30
```

### Enterprise ($570-1,290/month)

Enterprise with Zero Trust and full compliance:

```hcl
# environments/enterprise/terraform.tfvars
environment           = "enterprise"
enable_zero_trust     = true
enable_waf           = true
enable_ddos_protection = true
enable_bot_management = true
backend_type         = "ec2"
database_type        = "rds"
compliance_standards = ["HIPAA", "GDPR", "SOC2"]
backup_retention_days = 90
log_retention_days   = 365

identity_providers = {
  okta = {
    name = "Okta SSO"
    type = "okta"
    config = {
      okta_account = "your-okta-domain"
      client_id    = "okta-client-id"
      client_secret = "okta-client-secret"
    }
  }
}
```

## 🔒 Security Features

### Web Application Firewall (WAF)

```hcl
enable_waf = true

waf_rule_sets = [
  "OWASP_ModSecurity_Core_Rule_Set",
  "Cloudflare_Managed_Ruleset",
  "Cloudflare_OWASP_Core_Ruleset"
]

waf_rate_limits = {
  api_rate_limit = {
    threshold   = 100
    period      = 60
    action      = "challenge"
    description = "Rate limit for API endpoints"
  }
}
```

### DDoS Protection

Enabled by default with Cloudflare's network-level DDoS protection.

### Bot Management

```hcl
enable_bot_management = true
bot_fight_mode       = "on"
```

### Encryption

- **At Rest**: AWS KMS encryption for all data stores
- **In Transit**: TLS 1.2+ enforced for all connections

## 📝 Usage Examples

### Example 1: Basic Production Setup

```hcl
# main.tf
module "infrastructure" {
  source = "../../"
  
  environment    = "production"
  domain        = "creators.pinksync.io"
  git_repository = "pinkycollie/v0-deaf-creator-platform-multi-tenants"
  
  # Cloudflare
  cloudflare_api_token  = var.cloudflare_api_token
  cloudflare_account_id = var.cloudflare_account_id
  cloudflare_zone_id    = var.cloudflare_zone_id
  
  # Vercel
  vercel_api_token = var.vercel_api_token
  
  # Security
  enable_waf            = true
  enable_ddos_protection = true
  
  # Backend
  backend_type = "lambda"
  database_type = "neon"
}
```

### Example 2: Enterprise with Zero Trust

```hcl
module "infrastructure" {
  source = "../../"
  
  environment    = "enterprise"
  domain        = "enterprise.creators.com"
  git_repository = "your-org/your-repo"
  
  # Zero Trust Access
  enable_zero_trust = true
  
  identity_providers = {
    azure = {
      name = "Azure AD"
      type = "azure"
      config = {
        client_id     = var.azure_client_id
        client_secret = var.azure_client_secret
        domain        = "yourcompany.onmicrosoft.com"
      }
    }
  }
  
  zero_trust_applications = {
    app = {
      name             = "Main Application"
      domain           = "app.enterprise.creators.com"
      type             = "self_hosted"
      session_duration = "24h"
      allowed_idps     = ["azure"]
      auto_redirect    = true
    }
  }
  
  # Compliance
  compliance_standards = ["HIPAA", "SOC2"]
  log_retention_days   = 365
  
  # Enhanced security
  enable_waf            = true
  enable_bot_management = true
  enable_ddos_protection = true
}
```

## 🔧 Configuration Reference

### Environment Variables

```bash
# Required
export TF_VAR_cloudflare_api_token="your-token"
export TF_VAR_vercel_api_token="your-token"
export TF_VAR_cloudflare_account_id="your-account-id"
export TF_VAR_cloudflare_zone_id="your-zone-id"

# Optional
export TF_VAR_aws_region="us-east-1"
export AWS_ACCESS_KEY_ID="your-key"
export AWS_SECRET_ACCESS_KEY="your-secret"
```

### Backend Configuration

Create `backend.hcl` for remote state:

```hcl
bucket         = "your-terraform-state-bucket"
key            = "deaf-creator-platform/production/terraform.tfstate"
region         = "us-east-1"
encrypt        = true
dynamodb_table = "terraform-state-lock"
```

Initialize with backend:

```bash
terraform init -backend-config=backend.hcl
```

## 📊 Monitoring and Maintenance

### Health Checks

```bash
# Verify infrastructure
terraform plan

# Check state
terraform show

# List resources
terraform state list
```

### Updating Infrastructure

```bash
# Update a specific module
terraform apply -target=module.security

# Update all
terraform apply
```

### Destroying Resources

```bash
# Destroy specific environment
cd environments/production
terraform destroy

# Destroy specific resource
terraform destroy -target=module.frontend
```

## 🆘 Troubleshooting

### Common Issues

**Issue**: Cloudflare API token permission error
```bash
# Solution: Ensure token has all required permissions
# Recreate token at: https://dash.cloudflare.com/profile/api-tokens
```

**Issue**: Zero Trust application not accessible
```bash
# Solution: Check identity provider configuration
terraform state show module.cloudflare_zero_trust.cloudflare_access_identity_provider.idp[\"your-idp\"]
```

**Issue**: Rate limit errors during apply
```bash
# Solution: Reduce concurrent operations
terraform apply -parallelism=1
```

## 📚 Additional Documentation

- [Cloudflare Zero Trust Documentation](./docs/ZERO_TRUST_SETUP.md)
- [Compliance Guide](./docs/COMPLIANCE.md)
- [Security Best Practices](./docs/SECURITY.md)
- [Deployment Scenarios](./DEPLOYMENT_SCENARIOS.md)
- [Module Reference](./docs/MODULE_REFERENCE.md)

## 🤝 Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution guidelines.

## 📄 License

This infrastructure code is part of the Deaf Creator Platform project.

## 🔗 Resources

- [Terraform Documentation](https://www.terraform.io/docs)
- [Cloudflare Terraform Provider](https://registry.terraform.io/providers/cloudflare/cloudflare/latest/docs)
- [Vercel Terraform Provider](https://registry.terraform.io/providers/vercel/vercel/latest/docs)
- [Cloudflare Zero Trust](https://www.cloudflare.com/products/zero-trust/)

---

**Version**: 1.0.0  
**Last Updated**: December 2025
