# Virtual Diagnostic Simulator

A Next.js-based medical training simulator that allows students to practice clinical reasoning by interviewing AI patients, performing examinations, ordering tests, and making diagnoses in a safe, fictional environment.

## Features

- **AI-Powered Patient Interactions**: Chat with AI patients that respond naturally to your questions
- **Physical Examination**: Review different body systems and gather findings
- **Diagnostic Testing**: Order tests and view results
- **Clinical Reasoning Practice**: Formulate differential diagnoses and receive detailed feedback
- **Educational Assessment**: Get comprehensive feedback on your performance
- **Demo Mode**: Mock responses with `DEMO_MODE=true` or on static GitHub Pages

## Tech Stack

- **Framework**: Next.js 14 (App Router) with TypeScript
- **Styling**: Tailwind CSS
- **AI**: **Ollama** only (OpenAI-compatible `/v1/chat/completions` on your Ollama server)
- **Deployment**: Ready for Vercel, GitHub Pages, or similar

## Live Demo

🚀 **[Try the Live Demo](https://brinmeet123.github.io/VirtualDiagnosticSimulator.github.io/)**

The GitHub Pages demo uses mock responses (no server). For **real AI**, run the app with **Ollama** (`ollama serve`, `ollama pull <model>`) or host with a reachable `OLLAMA_BASE_URL` (e.g. Vercel + remote Ollama).

---

## Getting Started

### Prerequisites

- **Node.js 20+** and npm 9+ (specified in `package.json` engines)
- **[Ollama](https://ollama.com)** installed if you want real AI locally (or set `DEMO_MODE=true` for mocks)

### Installation

1. Install dependencies:
```bash
npm install
```

2. (Optional) Create a `.env.local` file:
```env
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2
# Optional — only if your Ollama host requires a Bearer token (local Ollama: omit)
# OLLAMA_API_KEY=your-token

# Mocks only (no Ollama):
# DEMO_MODE=true
```

> **Env:** `OLLAMA_BASE_URL`, `OLLAMA_MODEL` | `DEMO_MODE=true` for mocks only. See `/api/ai-status` when the app is running.

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### How to Get Real AI (Not Mocks)

| Where you run the app | How to get real AI |
|------------------------|---------------------|
| **Locally** | Run `ollama serve`, `ollama pull <OLLAMA_MODEL>`. Defaults: `http://127.0.0.1:11434` and `llama3.2`. |
| **Vercel / hosted** | Set `OLLAMA_BASE_URL` to an Ollama server **reachable from the internet** (not your laptop’s localhost). |
| **GitHub Pages** | Static only — mocks; use Vercel or local app for Ollama-backed AI. |

**Behavior:** If `DEMO_MODE=true`, all AI routes use mocks. Otherwise the app calls Ollama at `OLLAMA_BASE_URL` with `OLLAMA_MODEL`.

### Demo Mode vs AI Mode

**Demo Mode** (`DEMO_MODE=true`):
- ✅ Works without Ollama — good for static sites and demos
- ✅ Uses realistic mock responses
- 📝 Use for: GitHub Pages, quick demos, Vercel without Ollama

**AI Mode** (default when `DEMO_MODE` is not `true`):
- ✅ Real patient chat, assessments, and term explanations via Ollama
- 📝 Requires a running Ollama server the app can reach

### Testing Your AI Connection

**Option 1: Test endpoint**
1. Run the app (`npm run dev`) and open [http://localhost:3000/api/test-key](http://localhost:3000/api/test-key)
2. You should see `"success": true` and `"provider": "Ollama"` when Ollama is up

**Option 2: Test in a scenario**
1. Go to [http://localhost:3000/scenarios](http://localhost:3000/scenarios), open a scenario, and ask the patient a question
2. If you get an error, start Ollama or set `DEMO_MODE=true` for mocks

**Common issues:**
- **Local:** Run `ollama serve` and pull your model, or use `DEMO_MODE=true`
- **Vercel/hosted:** `OLLAMA_BASE_URL` must not be localhost; use a tunnel/VPS or `DEMO_MODE=true`
- **GitHub Pages:** Demo/mock only; run locally or Vercel for Ollama

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

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Brinmeet123/VirtualDiagnosticSimulator.github.io&env=DEMO_MODE%2COLLAMA_BASE_URL%2COLLAMA_MODEL&envDescription=DEMO_MODE%3Dtrue%20for%20mocks%3B%20otherwise%20set%20OLLAMA_BASE_URL%20to%20your%20Ollama%20server&envLink=https://github.com/Brinmeet123/VirtualDiagnosticSimulator.github.io%23environment-variables)

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
| `OLLAMA_BASE_URL` | For real AI | `http://127.0.0.1:11434` | Ollama base URL (must be reachable from the app; not localhost from Vercel to your laptop) |
| `OLLAMA_MODEL` | No | `llama3.2` | Model name — `ollama pull` on the Ollama host |
| `DEMO_MODE` | No | unset | `true` = mocks only, no Ollama calls |

**Recommended Vercel Settings:**
- **Framework Preset:** Next.js (auto-detected)
- **Build Command:** `npm run build` (default)
- **Output Directory:** `.next` (default)
- **Install Command:** `npm install` (default)
- **Node.js Version:** 20.x (specified in package.json)

**For real AI on Vercel:** point `OLLAMA_BASE_URL` at an Ollama instance reachable from the internet (same as for any remote server). Localhost on your Mac is **not** reachable from Vercel.

```env
OLLAMA_BASE_URL=https://your-ollama-host.example
OLLAMA_MODEL=llama3.2
```

- **Redeploy** after changing env vars (Deployments → ⋮ → Redeploy).
- If `DEMO_MODE=true`, the app uses mocks and does not call Ollama.

**Debug on your live site:** open `https://your-app.vercel.app/api/ai-status` — shows Ollama URL/model (no secrets).

**For demo-only:**
```env
DEMO_MODE=true
```

> **Note:** Locally, run `ollama serve` and use defaults unless you override `OLLAMA_*` in `.env.local`.

### Other Deployment Options

This project includes GitHub Actions workflows for automated deployment. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

1. **Docker**: 
   - Use the included Dockerfile and GitHub Actions workflow
   - Set `DEMO_MODE=true` environment variable in Docker for public deployment

2. **Static Export**: 
   - Deploy as a static site (note: API routes won't work)
   - Good for GitHub Pages, but limited functionality
   - Set `NEXT_OUTPUT=export` environment variable

**⚠️ Important:** Set `DEMO_MODE=true` for mock-only deployment when you are not exposing a reachable Ollama URL.

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

