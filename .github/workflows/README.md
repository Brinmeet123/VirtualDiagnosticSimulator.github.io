# GitHub Actions Workflows

This directory contains GitHub Actions workflows for CI/CD of the Virtual Diagnostic Simulator.

## Available Workflows

### 1. `ci.yml` - Continuous Integration
- **Triggers**: Push and PR to main/master/develop branches
- **Jobs**:
  - Lint and Type Check
  - Build
- **Purpose**: Validate code quality and ensure the app builds successfully

### 2. `deploy-vercel.yml` - Production Deployment
- **Triggers**: Push to main/master, manual dispatch
- **Purpose**: Deploy to Vercel production
- **Required Secrets**:
  - `VERCEL_TOKEN`: Vercel authentication token
  - `VERCEL_ORG_ID`: Vercel organization ID
  - `VERCEL_PROJECT_ID`: Vercel project ID

### 3. `deploy-preview.yml` - Preview Deployment
- **Triggers**: Pull requests to main/master
- **Purpose**: Deploy preview environments for PRs
- **Required Secrets**: Same as deploy-vercel.yml

### 4. `deploy-static.yml` - Static Site Deployment
- **Triggers**: Push to main/master, manual dispatch
- **Purpose**: Deploy static export to GitHub Pages
- **Note**: Requires Next.js static export configuration

### 5. `docker-build.yml` - Docker Image Build
- **Triggers**: Push to main/master, version tags (v*), manual dispatch
- **Purpose**: Build and push Docker images to Docker Hub
- **Required Secrets**:
  - `DOCKER_USERNAME`: Docker Hub username
  - `DOCKER_PASSWORD`: Docker Hub password or access token

### 6. `test.yml` - Test Suite
- **Triggers**: Push and PR to main/master/develop branches
- **Purpose**: Run tests, linting, and type checking

## Setting Up Secrets

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Add the required secrets for your chosen deployment method

## Environment Variables

The following environment variables can be set as GitHub Secrets:

- `OPENAI_API_KEY`: OpenAI API key (sk-...) for real AI
- `DEMO_MODE`: Set to `true` for mock-only

## Usage

### For Vercel Deployment (Recommended)
1. Set up Vercel secrets in GitHub
2. Push to main/master branch
3. Workflow will automatically deploy

### For Docker Deployment
1. Set up Docker Hub secrets
2. Push to main/master or create a version tag (e.g., v1.0.0)
3. Workflow will build and push Docker image

### For Static Site Deployment
1. Configure `next.config.js` for static export if needed
2. Push to main/master branch
3. Enable GitHub Pages in repository settings

## Notes

- The CI workflow runs on every push/PR to ensure code quality
- Docker builds use multi-stage builds for optimized images
- All workflows use Node.js 20 and npm ci for consistent builds

