# Virtual Diagnostic Simulator

A Next.js-based medical training simulator that allows students to practice clinical reasoning by interviewing AI patients, performing examinations, ordering tests, and making diagnoses in a safe, fictional environment.

## Features

- **AI-Powered Patient Interactions**: Chat with AI patients that respond naturally to your questions
- **Physical Examination**: Review different body systems and gather findings
- **Diagnostic Testing**: Order tests and view results
- **Clinical Reasoning Practice**: Formulate differential diagnoses and receive detailed feedback
- **Educational Assessment**: Get comprehensive feedback on your performance
- **Demo Mode**: Mock responses when no API key (e.g. GitHub Pages)

## Tech Stack

- **Framework**: Next.js 14 (App Router) with TypeScript
- **Styling**: Tailwind CSS
- **AI**: OpenAI (ChatGPT API, key from platform.openai.com)
- **Deployment**: Ready for Vercel, GitHub Pages, or similar

## Live Demo

🚀 **[Try the Live Demo](https://brinmeet123.github.io/VirtualDiagnosticSimulator.github.io/)**

The GitHub Pages demo uses mock responses (no server). For **real AI** set **OPENAI_API_KEY** (e.g. on Vercel or in `.env.local`).

---

## Getting Started

### Prerequisites

- **Node.js 20+** and npm 9+ (specified in `package.json` engines)

### Installation

1. Install dependencies:
```bash
npm install
```

2. (Optional) Create a `.env.local` file:
```env
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o-mini
# Or for demo only: DEMO_MODE=true
```

> **Environment Variables:** `OPENAI_API_KEY` (sk-...) from https://platform.openai.com/api-keys | `OPENAI_MODEL` (default: gpt-4o-mini) | `DEMO_MODE=true` for mocks only.

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### How to Get Real AI (Not Mocks)

| Where you run the app | How to get real AI |
|------------------------|---------------------|
| **Locally** or **Vercel** | Set **OPENAI_API_KEY** (sk-...) in `.env.local` or Vercel env. |
| **Vercel / hosted** | Set **OpenAI** env var: `OPENAI_API_KEY=sk-...`. The app uses OpenAI for chat, assessment, and term explanations. |
| **GitHub Pages** | Static only — uses client-side mocks; for real AI use Vercel with OPENAI_API_KEY. |

**Priority:** If `OPENAI_API_KEY` is set, the app uses OpenAI. Otherwise use DEMO_MODE=true for mocks. If neither is available and you’re on a server, set `DEMO_MODE=true` for mocks.

### Demo Mode vs AI Mode

**Demo Mode** (`DEMO_MODE=true` or no API key):
- ✅ Works without any AI backend — good for static sites and demos
- ✅ Uses realistic mock responses
- 📝 Use for: GitHub Pages, quick demos

**AI Mode** (OPENAI_API_KEY set):
- ✅ Real patient chat, assessments, and term explanations
- 📝 Use for: Local or Vercel with OpenAI API key

### Testing Your AI Connection

**Option 1: Test endpoint**
1. Run the app (`npm run dev`) and open [http://localhost:3000/api/test-key](http://localhost:3000/api/test-key)
2. You should see `"success": true` and `"provider": "OpenAI"` if OPENAI_API_KEY is set

**Option 2: Test in a scenario**
1. Go to [http://localhost:3000/scenarios](http://localhost:3000/scenarios), open a scenario, and ask the patient a question
2. If you get an error, set `OPENAI_API_KEY` (sk-...) or `DEMO_MODE=true` for mocks

**Common issues:**
- **Local:** Set `OPENAI_API_KEY` in `.env.local` or `DEMO_MODE=true` for mocks
- **Vercel/hosted:** Add env var `OPENAI_API_KEY` (and optionally `DEMO_MODE=false`) so the app uses real AI
- **GitHub Pages:** Stays in demo/mock mode; for real AI use Vercel + OpenAI or run the app locally

## Project Structure

```
project-root/
  app/
    layout.tsx              # Root layout with Navbar and Footer
    page.tsx                # Landing page
    about/
      page.tsx              # About page with disclaimer
    scenarios/
      page.tsx              # Scenario list
      [id]/
        page.tsx            # Scenario player
    api/
      patient-chat/
        route.ts            # POST: AI responds as patient
      assess/
        route.ts            # POST: AI assessment
  components/
    Navbar.tsx
    Footer.tsx
    ScenarioCard.tsx
    ScenarioList.tsx
    ScenarioPlayer.tsx
    DoctorPatientScene.tsx
    ChatPanel.tsx
    PhysicalExamPanel.tsx
    TestsPanel.tsx
    DiagnosisPanel.tsx
    SummaryPanel.tsx
  data/
    scenarios.ts            # Scenario data and types
  styles/
    globals.css
```

## Adding New Scenarios

Edit `data/scenarios.ts` and add new scenario objects to the `scenarios` array. Each scenario includes:

- Patient persona and background
- AI instructions for patient behavior
- Physical exam findings
- Available diagnostic tests
- Diagnosis options
- Teaching points

## Building for Production

```bash
npm run build
npm start
```

## Deployment

### Deploy with Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Brinmeet123/VirtualDiagnosticSimulator.github.io&env=DEMO_MODE%2COPENAI_API_KEY&envDescription=DEMO_MODE%3Dtrue%20for%20mocks%2C%20or%20OPENAI_API_KEY%20for%20real%20AI&envLink=https://github.com/Brinmeet123/VirtualDiagnosticSimulator.github.io%23environment-variables)

**One-Click Deploy:**
1. Click the "Deploy with Vercel" button above
2. Connect your GitHub repository
3. Configure environment variables (see below)
4. Deploy!

**Manual Vercel Setup:**
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the project directory
3. Follow the prompts
4. Set environment variables in Vercel dashboard

**Required Environment Variables for Vercel:**

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | **Yes** (for real AI) | — | OpenAI API key; enables real AI on Vercel (patient chat, assessment, term explain) |
| `DEMO_MODE` | Yes (if no OpenAI) | `false` | Set to `true` to use mock responses when no AI is configured |
| `OPENAI_MODEL` | No | `gpt-4o-mini` | OpenAI model |

**Recommended Vercel Settings:**
- **Framework Preset:** Next.js (auto-detected)
- **Build Command:** `npm run build` (default)
- **Output Directory:** `.next` (default)
- **Install Command:** `npm install` (default)
- **Node.js Version:** 20.x (specified in package.json)

**For real AI on Vercel (recommended):**
```env
OPENAI_API_KEY=sk-your-key-here
```
- The variable **name must be exactly `OPENAI_API_KEY`** (not “VDS” or a display label).
- Check **Production** (and Preview if needed) when saving the variable.
- **Redeploy** after adding or changing env vars (Deployments → ⋮ → Redeploy).
- If `DEMO_MODE=true` is set, real AI still runs when `OPENAI_API_KEY` is set (OpenAI wins).

**Debug on your live site:** open `https://your-app.vercel.app/api/ai-status` — it shows whether OpenAI is configured (no key is exposed).

**For demo-only (no API key):**
```env
DEMO_MODE=true
```

> **Note:** Set `OPENAI_API_KEY` (sk-...) for real AI on Vercel or locally.

### Other Deployment Options

This project includes GitHub Actions workflows for automated deployment. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

1. **Docker**: 
   - Use the included Dockerfile and GitHub Actions workflow
   - Set `DEMO_MODE=true` environment variable in Docker for public deployment

2. **Static Export**: 
   - Deploy as a static site (note: API routes won't work)
   - Good for GitHub Pages, but limited functionality
   - Set `NEXT_OUTPUT=export` environment variable

**⚠️ Important:** Set `DEMO_MODE=true` for mock-only deployment when no API key is configured.

### GitHub Actions Workflows:

- `ci.yml`: Continuous Integration (lint, type check, build)
- `deploy-vercel.yml`: Deploy to Vercel production
- `deploy-preview.yml`: Preview deployments for PRs
- `docker-build.yml`: Build and push Docker images
- `test.yml`: Run tests and validations

See `.github/workflows/README.md` for more details.

## Important Disclaimer

**This website is for educational purposes only. All patients and scenarios are fictional. The site does not provide medical advice, diagnosis, or treatment. If you have health concerns, please see a licensed healthcare professional.**

## License

This project is for educational use only.

