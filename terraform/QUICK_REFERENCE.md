# Quick Reference - Cloudflare Zero Trust Configuration

Quick reference for common Zero Trust Access configurations.

## 🚀 Minimal Setup (5 minutes)

```hcl
# terraform.tfvars
enable_zero_trust = true

identity_providers = {
  google = {
    name = "Google"
    type = "google"
    config = {
      client_id     = "YOUR_CLIENT_ID.apps.googleusercontent.com"
      client_secret = "YOUR_CLIENT_SECRET"
    }
  }
}

zero_trust_applications = {
  app = {
    name             = "My App"
    domain           = "app.yourdomain.com"
    type             = "self_hosted"
    session_duration = "24h"
    allowed_idps     = ["google"]
    auto_redirect    = true
  }
}

access_policies = {
  allow_domain = {
    name        = "Allow Company Domain"
    application = "app"
    decision    = "allow"
    precedence  = 1
    include     = [{ email_domain = "yourcompany.com" }]
    require     = []
    exclude     = []
  }
}
```

## 📋 Common Identity Providers

### Google Workspace
```hcl
identity_providers = {
  google = {
    name = "Google"
    type = "google"
    config = {
      client_id     = "xxx.apps.googleusercontent.com"
      client_secret = "xxx"
    }
  }
}
```

### Azure AD
```hcl
identity_providers = {
  azure = {
    name = "Azure AD"
    type = "azure"
    config = {
      client_id     = "your-azure-client-id"
      client_secret = "your-azure-client-secret"
      domain        = "yourcompany.onmicrosoft.com"
    }
  }
}
```

### Okta
```hcl
identity_providers = {
  okta = {
    name = "Okta"
    type = "okta"
    config = {
      okta_account  = "yourcompany.okta.com"
      client_id     = "your-okta-client-id"
      client_secret = "your-okta-client-secret"
    }
  }
}
```

### GitHub
```hcl
identity_providers = {
  github = {
    name = "GitHub"
    type = "github"
    config = {
      client_id     = "your-github-oauth-app-id"
      client_secret = "your-github-oauth-secret"
    }
  }
}
```

## 🎯 Common Application Types

### Frontend Application
```hcl
frontend = {
  name             = "Frontend"
  domain           = "app.yourdomain.com"
  type             = "self_hosted"
  session_duration = "24h"
  allowed_idps     = ["google"]
  auto_redirect    = true
}
```

### Backend API
```hcl
api = {
  name             = "API"
  domain           = "api.yourdomain.com"
  type             = "self_hosted"
  session_duration = "12h"
  allowed_idps     = ["google"]
  auto_redirect    = false
}
```

### Admin Panel
```hcl
admin = {
  name             = "Admin"
  domain           = "admin.yourdomain.com"
  type             = "self_hosted"
  session_duration = "8h"
  allowed_idps     = ["google"]
  auto_redirect    = true
}
```

## 🔐 Common Access Policies

### Allow Company Domain
```hcl
allow_company = {
  name        = "Allow Company"
  application = "app"
  decision    = "allow"
  precedence  = 1
  include     = [{ email_domain = "yourcompany.com" }]
  require     = []
  exclude     = []
}
```

### Require MFA
```hcl
require_mfa = {
  name        = "Require MFA"
  application = "admin"
  decision    = "allow"
  precedence  = 1
  include     = [{ email_domain = "yourcompany.com" }]
  require     = [{ auth_method = "mfa" }]
  exclude     = []
}
```

### Specific Emails Only
```hcl
admin_only = {
  name        = "Admin Only"
  application = "admin"
  decision    = "allow"
  precedence  = 1
  include     = [
    { email = "admin1@company.com" },
    { email = "admin2@company.com" }
  ]
  require     = []
  exclude     = []
}
```

### Country Restriction
```hcl
us_only = {
  name        = "US Only"
  application = "app"
  decision    = "allow"
  precedence  = 1
  include     = [{ email_domain = "yourcompany.com" }]
  require     = [{ geo = "US" }]
  exclude     = []
}
```

### Block Specific Users
```hcl
block_contractors = {
  name        = "Block Contractors"
  application = "admin"
  decision    = "allow"
  precedence  = 1
  include     = [{ email_domain = "yourcompany.com" }]
  require     = []
  exclude     = [{ email_domain = "contractors.com" }]
}
```

## 🤖 Service Tokens

```hcl
service_tokens = {
  ci_cd = {
    name     = "CI/CD Pipeline"
    duration = "8760h"  # 1 year
  }
  
  monitoring = {
    name     = "Monitoring Service"
    duration = "43800h"  # 5 years
  }
}
```

## 🌐 Gateway Rules

```hcl
gateway_rules = {
  block_malware = {
    name        = "Block Malware"
    description = "Block known malware domains"
    precedence  = 1
    action      = "block"
    filters     = ["dns"]
    enabled     = true
  }
}
```

## 🚇 Cloudflare Tunnel

```hcl
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

## 🔄 Complete Example

```hcl
# Full Zero Trust configuration
enable_zero_trust = true

# Multiple IdPs
identity_providers = {
  google = {
    name = "Google"
    type = "google"
    config = {
      client_id     = "xxx.apps.googleusercontent.com"
      client_secret = "xxx"
    }
  }
  
  azure = {
    name = "Azure AD"
    type = "azure"
    config = {
      client_id     = "xxx"
      client_secret = "xxx"
      domain        = "company.onmicrosoft.com"
    }
  }
}

# Protected applications
zero_trust_applications = {
  frontend = {
    name             = "Frontend"
    domain           = "app.company.com"
    type             = "self_hosted"
    session_duration = "24h"
    allowed_idps     = ["google", "azure"]
    auto_redirect    = true
  }
  
  api = {
    name             = "API"
    domain           = "api.company.com"
    type             = "self_hosted"
    session_duration = "12h"
    allowed_idps     = ["google", "azure"]
    auto_redirect    = false
  }
  
  admin = {
    name             = "Admin"
    domain           = "admin.company.com"
    type             = "self_hosted"
    session_duration = "8h"
    allowed_idps     = ["azure"]
    auto_redirect    = true
  }
}

# Access policies
access_policies = {
  # All employees can access frontend
  frontend_access = {
    name        = "Frontend Access"
    application = "frontend"
    decision    = "allow"
    precedence  = 1
    include     = [{ email_domain = "company.com" }]
    require     = []
    exclude     = []
  }
  
  # Developers can access API
  api_access = {
    name        = "API Access"
    application = "api"
    decision    = "allow"
    precedence  = 1
    include     = [{ email_domain = "company.com" }]
    require     = []
    exclude     = []
  }
  
  # Only admins with MFA can access admin panel
  admin_access = {
    name        = "Admin Access"
    application = "admin"
    decision    = "allow"
    precedence  = 1
    include     = [
      { email = "admin1@company.com" },
      { email = "admin2@company.com" }
    ]
    require     = [{ auth_method = "mfa" }]
    exclude     = []
  }
}

# Service tokens for automation
service_tokens = {
  ci_cd = {
    name     = "CI/CD"
    duration = "8760h"
  }
}
```

## 📝 Testing

```bash
# After terraform apply, test access
curl https://app.company.com
# Should redirect to IdP

# Test with service token
curl -H "CF-Access-Client-Id: $CLIENT_ID" \
     -H "CF-Access-Client-Secret: $CLIENT_SECRET" \
     https://api.company.com/health
```

## 🔍 Debugging

```bash
# View Zero Trust configuration
terraform state show module.cloudflare_zero_trust.cloudflare_access_application.apps[\"frontend\"]

# View access policy
terraform state show module.cloudflare_zero_trust.cloudflare_access_policy.policies[\"frontend_access\"]

# Check identity providers
terraform output zero_trust_applications
```

---

**Quick Start**: Copy example above, replace domains/emails, run `terraform apply`  
**Full Docs**: See `docs/ZERO_TRUST_SETUP.md`
