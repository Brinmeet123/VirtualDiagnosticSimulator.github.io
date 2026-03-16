# GitHub Pages Setup Instructions

## Current Issue
Your site is showing the README because GitHub Pages is currently serving from the root of the `main` branch instead of the built static files.

## Quick Fix (3 Steps)

### Step 1: Trigger the Workflow
The workflow needs to run once to create the `gh-pages` branch:

1. Go to your repository: https://github.com/Brinmeet123/Brinmeet123.github.io
2. Click the **Actions** tab
3. Click **Deploy Static Site** workflow (left sidebar)
4. Click **Run workflow** button (top right)
5. Select **main** branch
6. Click **Run workflow**

Wait for the workflow to complete (green checkmark).

### Step 2: Configure GitHub Pages
After the workflow completes:

1. Go to **Settings** tab in your repository
2. Click **Pages** in the left sidebar
3. Under "Source", select **Deploy from a branch**
4. Choose **gh-pages** branch (this will appear after Step 1)
5. Select **/ (root)** folder
6. Click **Save**

### Step 3: Wait and Check
- Wait 1-2 minutes for GitHub Pages to deploy
- Visit: https://brinmeet123.github.io/
- Your Next.js app should now be visible!

## Troubleshooting

**If you still see the README:**
- Hard refresh your browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Check if `gh-pages` branch exists: Go to repository → click branch dropdown → look for `gh-pages`
- Verify workflow succeeded: Go to Actions tab → check for green checkmark
- Double-check Pages settings: Settings → Pages → must show "gh-pages branch / (root)"

**If the workflow fails:**
- Check the workflow logs in the Actions tab
- Common issues:
  - Missing dependencies (should be handled automatically)
  - Build errors (check the build step logs)

## How It Works

1. **Workflow runs** → Builds Next.js static files (`npm run build` → `out/` folder)
2. **Deploys to `gh-pages` branch** → Creates/updates the `gh-pages` branch with built files
3. **GitHub Pages serves from `gh-pages`** → Your site is live!

## Important Notes

✅ **The app works on GitHub Pages** with demo mode:
- When the API is unavailable (static hosting), the app uses **client-side mock responses** for chat, assessment, and term explanations
- You get a full demo experience: scenarios, patient chat, and debrief all work with realistic mock data
- For live AI (Ollama), run locally or deploy to **Vercel**

✅ **Future deployments** will be automatic:
- Every push to `main` branch triggers the workflow
- Your site updates automatically after each deployment

## Need Help?

If you're still having issues:
1. Check the workflow logs in the Actions tab
2. Verify `gh-pages` branch exists and has files (should have `index.html`)
3. Make sure GitHub Pages is enabled and pointing to `gh-pages` branch
