# GitHub Pages Setup Instructions

Repository: **https://github.com/Brinmeet123/VirtualDiagnosticSimulator.github.io**

Live site (project Pages): **https://brinmeet123.github.io/VirtualDiagnosticSimulator.github.io/**

## Quick Fix (3 Steps)

### Step 1: Trigger the Workflow

1. Go to your repository: https://github.com/Brinmeet123/VirtualDiagnosticSimulator.github.io
2. Click the **Actions** tab
3. Click **Deploy Static Site** workflow (left sidebar)
4. Click **Run workflow** → branch **main** → **Run workflow**

Wait for the workflow to complete (green checkmark).

### Step 2: Configure GitHub Pages

1. **Settings** → **Pages**
2. **Source**: Deploy from a branch
3. **Branch**: **gh-pages** / **(root)**
4. **Save**

### Step 3: Wait and Check

- Wait 1–2 minutes
- Open: https://brinmeet123.github.io/VirtualDiagnosticSimulator.github.io/

The static build uses `basePath` `/VirtualDiagnosticSimulator.github.io` so assets load correctly on project Pages.

## Troubleshooting

- **Broken styles / 404 on assets:** Ensure the workflow sets `GITHUB_PAGES_BASEPATH: /VirtualDiagnosticSimulator.github.io` (already in `deploy-static.yml`).
- **Still see README:** Pages must use **gh-pages** branch, not **main**.
- **Workflow failed:** Check Actions logs for the build step.

## Notes

- Demo uses client-side mocks (no server on GitHub Pages).
- For real AI, deploy to **Vercel** (or similar) with a reachable **Ollama** URL in `OLLAMA_BASE_URL`, or use `DEMO_MODE=true` for mocks.
