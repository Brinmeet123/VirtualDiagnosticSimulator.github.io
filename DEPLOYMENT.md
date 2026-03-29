# Deployment Guide

This guide covers deploying the Virtual Diagnostic Simulator using GitHub Actions.

## Prerequisites

- GitHub repository set up
- Node.js 20+ installed locally (for testing)
- **Ollama** running (or `DEMO_MODE=true` for mocks only)

## Deployment Options

### Option 1: Vercel (Recommended)

Vercel is the recommended platform for Next.js applications.

#### Setup Steps:

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with your GitHub account

2. **Get Vercel Credentials**
   - Go to Vercel Dashboard → Settings → Tokens
   - Create a new token
   - Go to your project settings to get:
     - Organization ID
     - Project ID

3. **Add GitHub Secrets**
   - Go to your GitHub repo → Settings → Secrets and variables → Actions
   - Add the following secrets:
     - `VERCEL_TOKEN`: Your Vercel token
     - `VERCEL_ORG_ID`: Your organization ID
     - `VERCEL_PROJECT_ID`: Your project ID

4. **Deploy**
   - Push to `main` or `master` branch
   - The workflow will automatically deploy

#### Git branch and root (required)

Vercel must build from the **Next.js source** on **`main`**, not from **`gh-pages`**. The `gh-pages` branch only contains the static GitHub Pages export (HTML and assets) and has **no** `app` or `pages` directory, so `next build` fails with “Couldn't find any `pages` or `app` directory”.

In Vercel: **Settings → Git → Production Branch** → set to `main`. **Settings → General → Root Directory** → leave empty (repository root).

If you see **“No Next.js version detected”**, Vercel is not using the folder that contains this repo’s `package.json` (almost always wrong **Root Directory**, or still building **`gh-pages`**). Fix both settings above, then **Redeploy** the latest `main` commit.

#### Environment Variables in Vercel:

Add these in Vercel Dashboard → Project Settings → Environment Variables:
- `OLLAMA_BASE_URL`: URL of your Ollama server (default locally: `http://127.0.0.1:11434`). On Vercel this must be a **publicly reachable** URL (tunnel, VPS, etc.); localhost on the Vercel VM will not reach your laptop.
- `OLLAMA_MODEL`: Model name (default `llama3.2`) — run `ollama pull <name>` on the Ollama host first
- `DEMO_MODE`: Set to `true` for mock-only deployment (no Ollama calls)

**Local dev:** Run `ollama serve`, pull a model, then `npm run dev`. Override URL/model with `OLLAMA_BASE_URL` / `OLLAMA_MODEL` in `.env.local`.

### Option 2: Docker Deployment

Deploy using Docker containers.

#### Setup Steps:

1. **Get Docker Hub Credentials**
   - Create account at [hub.docker.com](https://hub.docker.com)
   - Create an access token

2. **Add GitHub Secrets**
   - `DOCKER_USERNAME`: Your Docker Hub username
   - `DOCKER_PASSWORD`: Your Docker Hub access token

3. **Deploy**
   - Push to `main`/`master` or create a version tag (e.g., `v1.0.0`)
   - Workflow will build and push Docker image

4. **Run Container**
   ```bash
   docker run -p 3000:3000 \
     -e OLLAMA_BASE_URL=http://host.docker.internal:11434 \
     -e OLLAMA_MODEL=llama3.2 \
     your-username/virtual-diagnostic-simulator
   ```

### Option 3: Static Site (GitHub Pages)

For static export (limited functionality - no API routes).

#### Setup Steps:

1. **Configure Next.js for Static Export**
   - Update `next.config.js` to include `output: 'export'`
   - Note: This disables API routes; use client-side mocks

2. **Enable GitHub Pages**
   - Go to repo Settings → Pages
   - Select source: GitHub Actions

3. **Deploy**
   - Push to `main`/`master`
   - Workflow will deploy to GitHub Pages

## Environment Variables

### Production (real AI via Ollama)

- `OLLAMA_BASE_URL`: Must be reachable from the app process (same machine, Docker host, or public URL)
- `OLLAMA_MODEL`: Must exist on that Ollama server (`ollama pull <name>`)

### Optional

- `DEMO_MODE=true`: mocks only; no Ollama
- `NODE_ENV`: Set to `production` for production builds
- `NEXT_PUBLIC_*`: Any public environment variables

## CI/CD Workflows

### Continuous Integration (`ci.yml`)
- Runs on every push/PR
- Lints code
- Type checks
- Builds application
- Ensures code quality before merge

### Test Workflow (`test.yml`)
- Runs tests and validations
- Ensures build succeeds

### Deployment Workflows
- `deploy-vercel.yml`: Production deployments
- `deploy-preview.yml`: PR preview deployments
- `deploy-static.yml`: Static site deployments
- `docker-build.yml`: Docker image builds

## Local Testing

Before deploying, test locally:

```bash
# Install dependencies
npm install

# Run linter
npm run lint

# Type check
npx tsc --noEmit

# Build
npm run build

# Start production server
npm start
```

## Troubleshooting

### Build Fails
- Check Node.js version (should be 20+)
- Ensure all dependencies are installed
- Check for TypeScript errors

### Deployment Fails
- Verify secrets are set correctly
- Check workflow logs in GitHub Actions
- Ensure environment variables are set

### Ollama / AI issues
- Ensure Ollama is running and the model is pulled; check `OLLAMA_BASE_URL` and `OLLAMA_MODEL`
- Open `/api/ai-status` and `/api/test-key` on your deployment
## Production Considerations

1. **Environment Variables**: Set all required variables in your deployment platform

3. **Security**: Never commit API keys or secrets to the repository

4. **Performance**: Consider:
   - Enabling Next.js caching
   - Using a CDN for static assets
   - Optimizing images

## Support

For issues or questions:
- Check GitHub Actions logs
- Review workflow files in `.github/workflows/`
- Consult Next.js deployment documentation

