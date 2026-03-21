# LiberationOS

> Enter a goal. Get execution.

LiberationOS is a do-it-for-me AI business operating system that converts user goals into structured workflows, generates content/assets, and optionally executes publishing across platforms.

Instead of giving ideas, LiberationOS builds and runs the system for you.

---

## 🚀 Features

- Goal → Execution pipeline
- Modular AI agent system
- Multi-step workflow engine
- Content generation (viral, SEO, social)
- Affiliate site automation
- Multi-platform scheduling
- Human review + approval layer
- WordPress & Buffer integrations
- Async job processing (queue-based)
- Extensible architecture

---

## 🧠 Example Inputs

- "Post 30 viral TikToks for me"
- "Run an affiliate site for coffee makers"
- "Generate 2 weeks of Instagram + X content"

---

## 🏗️ Tech Stack

- **Frontend:** Next.js, TypeScript, Tailwind, shadcn/ui
- **Backend:** Node.js, TypeScript
- **Database:** PostgreSQL (Prisma ORM)
- **Queue:** BullMQ + Redis
- **AI Layer:** OpenAI / Anthropic / Google (abstracted)
- **Auth:** Clerk / Auth.js
- **Storage:** S3 / Supabase
- **Deployment:** Vercel + Worker runtime

---

## 📦 Monorepo Structure

```
apps/
  web/        # frontend
  worker/     # background jobs

packages/
  ui/
  db/
  types/
  prompts/
  ai-core/
  workflow-engine/
  agent-packs/
  integrations/
  analytics/
```

---

## ⚡ Quick Start

### 1. Clone repo

```bash
git clone https://github.com/yourname/liberation-os.git
cd liberation-os
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Setup environment

```bash
cp .env.example .env
```

Fill in required variables.

### 4. Setup database

```bash
pnpm prisma migrate dev
pnpm prisma generate
```

### 5. Start dev server

```bash
pnpm dev
```

### 6. Start worker

```bash
pnpm worker
```

---

## 🔄 How It Works

1. User enters a goal
2. Goal Interpreter converts it to structured JSON
3. Planner creates workflow steps
4. Agents execute tasks
5. Outputs are generated
6. User reviews or auto-publishes
7. Performance is tracked

---

## 🧩 Workflow Packs

### Viral Content Engine

- hooks
- scripts
- captions
- posting schedule

### Affiliate Site Autopilot

- keyword clusters
- article briefs
- long-form content
- publishing queue

### Social Scheduler

- cross-platform content
- campaign calendar
- batch scheduling

---

## 🔌 Integrations

- WordPress (publish content)
- Buffer (schedule posts)
- (future) X, Instagram, LinkedIn APIs

---

## 🧪 Testing

```bash
pnpm test
```

---

## 📚 Docs

- `/docs/PRD.md`
- `/docs/ARCHITECTURE.md`
- `/docs/AGENTS.md`
- `/docs/WORKFLOWS.md`

---

## 🛣️ Roadmap

- Performance feedback loop
- Auto-optimization engine
- Multi-user collaboration
- Marketplace for workflow packs
- AI-driven revenue analytics

---

## 💰 Monetization

- Starter: limited workflows
- Pro: automation + integrations
- Agency: multi-workspace + white-label

---

## ⚠️ Disclaimer

AI-generated content should be reviewed before publishing. Users are responsible for compliance with platform policies.

---

## 🧬 Philosophy

LiberationOS replaces effort with execution.

Not ideas.
Not suggestions.

Execution.
