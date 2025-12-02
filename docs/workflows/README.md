# CI/CD Workflows

This document describes the continuous integration and deployment workflows for the V0 Deaf Creator Platform.

## Overview

We use GitHub Actions for automated testing, building, and deployment.

## Workflows

### 1. Continuous Integration (CI)

**File:** `.github/workflows/ci.yml`

Runs on every push and pull request:
- Linting (ESLint)
- Type checking (TypeScript)
- Unit tests
- Build verification

### 2. Continuous Deployment (CD)

**File:** `.github/workflows/deploy.yml`

Automated deployment:
- **Staging:** Triggered on merge to `development` branch
- **Production:** Triggered on merge to `main` branch

### 3. Code Quality

**File:** `.github/workflows/quality.yml`

- Security scanning (CodeQL)
- Dependency audit
- License compliance

## Branch Protection Rules

### Main Branch

- Require pull request before merging
- Require status checks to pass:
  - `ci / lint`
  - `ci / test`
  - `ci / build`
- Require code review from maintainers
- No direct pushes

### Development Branch

- Require pull request before merging
- Require status checks to pass:
  - `ci / lint`
  - `ci / test`

## Secrets Management

Required secrets in GitHub repository:

| Secret | Description |
|--------|-------------|
| `VERCEL_TOKEN` | Vercel deployment token |
| `VERCEL_ORG_ID` | Vercel organization ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `CODECOV_TOKEN` | Codecov upload token |

## Running Workflows Locally

Use [act](https://github.com/nektos/act) to run workflows locally:

```bash
# Install act
brew install act

# Run CI workflow
act push

# Run specific job
act -j lint
```

## Deployment Environments

| Environment | Branch | URL |
|-------------|--------|-----|
| Production | main | https://deafcreator.com |
| Staging | development | https://staging.deafcreator.com |
| Preview | PR branches | https://pr-{number}.deafcreator.com |

## Monitoring

- Vercel Analytics for deployment metrics
- GitHub Actions dashboard for workflow status
- Slack notifications for deployment events
