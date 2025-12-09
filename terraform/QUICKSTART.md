# Quick Start Guide: Terraform Infrastructure

This guide will help you deploy the Deaf Creator Platform infrastructure in under 15 minutes.

## Prerequisites Checklist

- [ ] Terraform 1.5+ installed
- [ ] Cloud provider account (AWS, Cloudflare, or Vercel)
- [ ] API tokens for chosen providers
- [ ] Domain name (optional, can use provider defaults)
- [ ] Git and text editor

## Step-by-Step Setup

### 1. Choose Your Deployment Scenario (5 minutes)

Pick a scenario from `DEPLOYMENT_SCENARIOS.md` based on your needs:

- **Just testing?** → Scenario 1 (MVP/Development)
- **Going live with minimal budget?** → Scenario 2 (Production MVP)
- **Enterprise requirements?** → Scenario 3 (AWS Full Stack)

For this guide, we'll use **Scenario 2 (Production MVP)**.

### 2. Configure Variables (5 minutes)

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:

```hcl
# Essential Configuration
project_name = "deaf-creator-platform"
environment  = "production"

# Your domain
domain_name      = "example.com"
subdomain_prefix = "creators"

# Provider choices (recommended for MVP)
frontend_hosting_provider = "vercel"
backend_hosting_provider  = "lambda"
database_provider         = "neon"
storage_provider          = "cloudflare_r2"
dns_provider              = "cloudflare"

# Your Cloudflare account
cloudflare_account_id = "your-cloudflare-account-id"
cloudflare_zone_id    = "your-cloudflare-zone-id"

# Monitoring
alarm_email = "ops@example.com"

# CI/CD
github_repository = "v0-deaf-creator-platform-multi-tenants"
github_owner      = "pinkycollie"
```

### 3. Set API Tokens (2 minutes)

Create `.env` file (already in .gitignore):

```bash
# .env
export TF_VAR_cloudflare_api_token="your-cloudflare-token"
export TF_VAR_vercel_api_token="your-vercel-token"
export TF_VAR_github_token="your-github-pat"
export AWS_ACCESS_KEY_ID="your-aws-key"
export AWS_SECRET_ACCESS_KEY="your-aws-secret"
```

Load environment:
```bash
source .env
```

### 4. Initialize and Deploy (3 minutes)

```bash
# Initialize Terraform
terraform init

# Review the plan
terraform plan

# Apply (creates infrastructure)
terraform apply
```

Type `yes` when prompted.

### 5. Post-Deployment Setup (5 minutes)

After Terraform completes:

```bash
# Get important outputs
terraform output frontend_url
terraform output database_endpoint
```

#### Manual Steps Required:

1. **Neon Database**:
   ```bash
   # Sign up at https://neon.tech
   # Create project: deaf-creator-platform
   # Copy connection string
   ```

2. **Update Secrets**:
   ```bash
   # In AWS Console, go to Secrets Manager
   # Update placeholder values for:
   # - database_url (from Neon)
   # - nextauth_secret (generate: openssl rand -base64 32)
   # - stripe_secret_key (from Stripe dashboard)
   # - pinksync_api_key (from PinkSync)
   ```

3. **Configure Vercel**:
   ```bash
   # In Vercel dashboard
   # Set environment variables from Secrets Manager
   # Connect GitHub repository
   ```

4. **Verify Deployment**:
   ```bash
   # Check frontend
   curl https://creators.example.com
   
   # Check API health (if Lambda deployed)
   curl https://creators-api.example.com/health
   ```

## Common Quick Start Paths

### Path A: Vercel + Neon (Fastest)

1. Use Scenario 2 configuration
2. Skip AWS setup (Vercel manages everything)
3. Only configure Cloudflare for DNS
4. Deploy in ~10 minutes

### Path B: Full AWS (Most Control)

1. Use Scenario 3 configuration
2. Configure VPC and subnets first
3. Set up RDS with proper security groups
4. Deploy in ~20 minutes

### Path C: Minimal Testing

1. Use Scenario 1 configuration
2. Use all free tiers
3. Skip monitoring and CI/CD
4. Deploy in ~5 minutes

## Troubleshooting Quick Fixes

### Error: "No valid credential sources"
```bash
# Set AWS credentials
export AWS_ACCESS_KEY_ID="your-key"
export AWS_SECRET_ACCESS_KEY="your-secret"
```

### Error: "Cloudflare API token invalid"
```bash
# Check token permissions at cloudflare.com/profile/api-tokens
# Required: Zone.DNS Edit, Zone.Zone Read, Account.Cloudflare Pages Edit
```

### Error: "Resource already exists"
```bash
# Import existing resource
terraform import module.frontend.vercel_project.frontend[0] <project-id>
```

### Error: "Backend configuration changed"
```bash
# Reinitialize
terraform init -reconfigure
```

## Next Steps

After successful deployment:

1. **Set up monitoring**: Check CloudWatch dashboard
2. **Configure alerts**: Verify SNS email subscription
3. **Test CI/CD**: Make a commit to trigger GitHub Actions
4. **Load test**: Use tools like `ab` or `k6` to test load
5. **Backup**: Schedule regular backups using provided scripts

## Getting Help

- Review `README.md` for detailed documentation
- Check `DEPLOYMENT_SCENARIOS.md` for different configurations
- Consult Terraform logs: `terraform show`
- Enable debug mode: `export TF_LOG=DEBUG`

## Cleanup

To remove all infrastructure:

```bash
terraform destroy
```

⚠️ This is irreversible. Backup your data first!

## Time Estimates by Scenario

| Scenario | Initial Setup | Deployment | Total |
|----------|--------------|------------|-------|
| Development | 5 min | 5 min | ~10 min |
| Production MVP | 10 min | 10 min | ~20 min |
| Enterprise | 20 min | 20 min | ~40 min |

---

**Pro Tip**: Use Terraform workspaces to manage multiple environments from the same configuration:

```bash
terraform workspace new production
terraform workspace new staging

# Deploy to staging first
terraform workspace select staging
terraform apply -var="environment=staging"

# Then production
terraform workspace select production
terraform apply
```

Happy deploying! 🚀
