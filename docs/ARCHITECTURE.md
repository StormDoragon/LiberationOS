# System Architecture

## Overview

LiberationOS uses an agent-based workflow system.

---

## Layers

### 1. Input Layer
Receives user goal

### 2. Goal Interpreter
Transforms input → structured JSON

### 3. Planner
Builds execution workflow

### 4. Orchestrator
Runs steps sequentially/parallel

### 5. Agents
Specialized task executors

### 6. Review Layer
Human approval interface

### 7. Execution Layer
Publishes or schedules outputs

### 8. Feedback Layer
Stores performance data

---

## Workflow Engine

Each workflow consists of:

- WorkflowRun
- WorkflowSteps

Each step:
- agent
- input
- output
- status

---

## Agent Model

All agents follow:

```
execute(input, context) → output
```

---

## Queue System

- BullMQ handles async jobs
- Worker processes long-running workflows
- Retry logic included

---

## AI Layer

- provider abstraction
- structured outputs
- schema validation

---

## Database

PostgreSQL via Prisma

Core tables:
- users
- projects
- workflows
- content
- publish jobs

---

## Integrations

- WordPress REST API
- Buffer API

---

## Deployment

- Frontend: Vercel
- Worker: Node server / container
- DB: PostgreSQL
- Queue: Redis
