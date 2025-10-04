# Aladdin Project Documentation

Welcome to the Aladdin project documentation. This repository powers an AI-assisted movie production workflow built on a Next.js application with a background task-queue service. The system integrates LLM models via OpenRouter, coordinates AI "agents" for structured tasks, and provides APIs for long-running operations like video, image, and audio generation.

This documentation is the canonical source of truth for how to set up, run, develop, and operate Aladdin. It replaces placeholder or redundant docs and consolidates the most relevant content under a single, navigable index.

Important:
- This documentation reflects the current implementation verified against the codebase.
- Where appropriate, links point to source files to keep code and documentation in sync.
- Some aspirational or experimental documents may be referenced as "optional context" with clear labels.

---

## Table of Contents

- 1. Overview
  - 1.1 What is Aladdin?
  - 1.2 High-Level Architecture
  - 1.3 Key Technologies
  - 1.4 Repositories and Paths
- 2. Getting Started
  - 2.1 Prerequisites
  - 2.2 Environment Variables
  - 2.3 Local Development (Next.js)
  - 2.4 Local Services (Task Queue)
  - 2.5 Docker & Compose
- 3. Architecture
  - 3.1 Frontend (Next.js)
  - 3.2 AI Integration (OpenRouter, Vercel AI SDK)
  - 3.3 Agent Execution Flow
  - 3.4 Task Queue Service (FastAPI + Celery/Redis)
  - 3.5 Data & Storage
- 4. AI Agents
  - 4.1 AI Client and Models
  - 4.2 Agent Executor
  - 4.3 Tools Integration
  - 4.4 Configuration Guidelines
- 5. Services: Task Queue APIs
  - 5.1 Authentication
  - 5.2 Task Submission API
  - 5.3 Task Status API
  - 5.4 Workers Status API
- 6. Configuration & Secrets
  - 6.1 Required Env Vars
  - 6.2 Optional Env Vars
  - 6.3 Model Configuration
- 7. Development Workflow
  - 7.1 Code Organization
  - 7.2 TypeScript & Linting
  - 7.3 Testing
  - 7.4 Common Scripts
- 8. Operations
  - 8.1 Running with Docker
  - 8.2 Deployment Considerations
  - 8.3 Monitoring and Logs
- 9. Troubleshooting
  - 9.1 Common Issues
  - 9.2 Task Queue Debugging
  - 9.3 AI API Issues
- 10. Changelog & Status
  - 10.1 Status Docs
  - 10.2 Migration Notes
  - 10.3 Deprecations

---

## 1. Overview

### 1.1 What is Aladdin?
Aladdin is an AI-powered system for orchestrating creative and production workflows for movie projects. It combines a web interface (Next.js) with background processing (FastAPI + Celery/Redis) and an AI layer that interfaces with OpenRouter to access multiple LLMs via the Vercel AI SDK.

### 1.2 High-Level Architecture
- Frontend: Next.js application with TypeScript, Tailwind CSS.
- AI layer: Vercel AI SDK using an OpenRouter provider for model access.
- Background services: FastAPI application exposing task endpoints; Celery workers backed by Redis manage long-running tasks.
- Data: Project data managed in the app domain; tasks and worker state held/transited via Redis and Celery results.

### 1.3 Key Technologies
- Next.js, TypeScript, Tailwind
- Vercel AI SDK, OpenRouter
- FastAPI, Celery, Redis
- Playwright/Vitest for testing
- Docker and docker-compose for local services

### 1.4 Repositories and Paths
- Frontend app and AI layer: src/lib/ai
  - Client: src/lib/ai/client.ts
  - Executor: src/lib/ai/agent-executor.ts
- Services: services/task-queue/app
  - APIs: services/task-queue/app/api

---

## 2. Getting Started

### 2.1 Prerequisites
- Node.js LTS and pnpm installed
- Python 3.11+ for the task-queue service
- Docker Desktop (optional, recommended for Redis/Celery stack)

### 2.2 Environment Variables
Minimum required:
- OPENROUTER_API_KEY: Your OpenRouter API key (required by the AI client).
- NEXT_PUBLIC_APP_URL: Base URL of the web app, used for referer header.
- OPENROUTER_DEFAULT_MODEL: Optional default, defaults to anthropic/claude-sonnet-4.5.

Confirmed by code (src/lib/ai/client.ts):
- The AI client is created via OpenRouter provider:
  - Uses OPENROUTER_API_KEY for authentication.
  - Sets HTTP-Referer to NEXT_PUBLIC_APP_URL or http://localhost:3000.
  - X-Title header set to "Aladdin Movie Production".
- The getModel() function falls back to OPENROUTER_DEFAULT_MODEL or 'anthropic/claude-sonnet-4.5'.

### 2.3 Local Development (Next.js)
- pnpm install
- pnpm dev
- Open http://localhost:3000

### 2.4 Local Services (Task Queue)
- Python dependencies (use a venv):
  - cd services/task-queue
  - pip install -r requirements.txt (if present)
- Ensure Redis is running (via Docker or local install).
- Start FastAPI app (e.g., uvicorn main:app --reload) if not integrated into Docker.
- Start Celery workers configured to use Redis broker/result backend.

### 2.5 Docker & Compose
- docker-compose.yml includes Redis and (optionally) service containers.
- Use docker-compose up -d to run dependencies locally.

---

## 3. Architecture

### 3.1 Frontend (Next.js)
- Located under src/.
- Follows standard Next.js app conventions.
- Tailwind CSS configured via tailwind.config.ts.

### 3.2 AI Integration (OpenRouter, Vercel AI SDK)
- See src/lib/ai/client.ts for configuration and default model.
- The client uses @openrouter/ai-sdk-provider to get models compatible with Vercel AI SDK's generateText/generateObject APIs.

### 3.3 Agent Execution Flow
- Implemented in src/lib/ai/agent-executor.ts.
- High-level responsibilities:
  - Load agent definition (loadAgent method).
  - Convert domain tools into Vercel AI SDK tool spec (convertTools).
  - Execute either structured outputs (generateObject) or text (generateText).
  - Create and update execution records in the database (createExecutionRecord, updateExecutionRecord) using Payload CMS's Payload type.
- Integration points:
  - getModel from client.ts used to select model.
  - Tools are adapted to SDK format with execute hooks.

### 3.4 Task Queue Service (FastAPI + Celery/Redis)
- APIs defined in services/task-queue/app/api.
- Task submission multiplexes to different Celery tasks by TaskType:
  - GENERATE_VIDEO -> process_video_generation
  - GENERATE_IMAGE -> process_image_generation
  - PROCESS_AUDIO -> process_audio_generation
- Status endpoints reflect queued/processing states; workers status endpoint reports basic metrics (currently placeholders).

### 3.5 Data & Storage
- Redis used for Celery broker/result store.
- Media/object storage is implementation-dependent; no direct storage layer is documented in code at this time.

---

## 4. AI Agents

### 4.1 AI Client and Models
- getModel(modelName?) returns a model instance from OpenRouter.
- defaultModel is exported for general use.

### 4.2 Agent Executor
- AIAgentExecutor orchestrates prompting and tool usage.
- Supports both structured (JSON/object) and text outputs.
- Creates execution records via Payload (ensure server-side context has Payload instance).

### 4.3 Tools Integration
- Tools must be provided with an execute(args) function.
- convertTools maps internal tool definitions into the shape expected by Vercel AI SDK tool calling.

### 4.4 Configuration Guidelines
- Use OPENROUTER_DEFAULT_MODEL for global defaults; override per-call via options.model.
- Set NEXT_PUBLIC_APP_URL to a valid public URL in deployed environments.

---

## 5. Services: Task Queue APIs

### 5.1 Authentication
- All endpoints depend on verify_api_key middleware (services/task-queue/app/middleware/auth.py). Provide valid API key via standard auth mechanism enforced by that dependency.

### 5.2 Task Submission API
- Method: POST /tasks/submit
- Request: TaskSubmissionRequest
  - project_id: string (required)
  - task_type: one of GENERATE_VIDEO | GENERATE_IMAGE | PROCESS_AUDIO
  - priority: optional priority value
  - task_data: object with modality-specific fields
  - callback_url: optional
  - metadata: optional
- Response: TaskSubmissionResponse
  - task_id: uuid
  - status: QUEUED (initial)
  - project_id
  - estimated_duration
  - queue_position
  - created_at
- Behavior:
  - Generates a task UUID, routes to Celery based on task_type.
  - On enqueue, status becomes PROCESSING; response remains QUEUED by design to reflect initial state.

### 5.3 Task Status API
- Method: GET /tasks/{task_id}/status
- Response: TaskStatusResponse reflecting current state of the task.
- Notes: Implementation should consult Celery/Redis for real-time status; placeholder or direct mapping may exist until fully implemented.

### 5.4 Workers Status API
- Method: GET /workers/status
- Response: { workers: [], total_workers: 0, active_workers: 0, gpu_utilization: 0.0 }
- Notes: Currently returns placeholders; planned integration with Redis/Celery for worker telemetry.

---

## 6. Configuration & Secrets

### 6.1 Required Env Vars
- OPENROUTER_API_KEY (frontend/AI)

### 6.2 Optional Env Vars
- NEXT_PUBLIC_APP_URL
- OPENROUTER_DEFAULT_MODEL

### 6.3 Model Configuration
- Defaults to anthropic/claude-sonnet-4.5 if not specified.
- You can pass a specific model id when calling getModel().

---

## 7. Development Workflow

### 7.1 Code Organization
- src/lib/ai: AI client and agent executor
- services/task-queue/app: FastAPI service code
- tests: Automated tests for frontend and services
- docs: This documentation

### 7.2 TypeScript & Linting
- Configured via tsconfig.json and eslint.config.mjs.

### 7.3 Testing
- Vitest configured via vitest.config.mts and vitest.setup.ts.
- Playwright for end-to-end tests (playwright.config.ts).

### 7.4 Common Scripts
- pnpm dev: Start Next.js dev server
- pnpm test: Run unit tests
- pnpm build: Build the app

---

## 8. Operations

### 8.1 Running with Docker
- docker-compose.yml includes Redis and service scaffolding.
- You can extend compose file to run FastAPI and Celery locally.

### 8.2 Deployment Considerations
- Ensure OPENROUTER_API_KEY configured in CI/CD secrets.
- Set NEXT_PUBLIC_APP_URL to your production domain.
- Scale Celery workers based on expected workload.

### 8.3 Monitoring and Logs
- structlog is used in the service for structured logs.
- Consider shipping logs to a centralized system (ELK, Loki, etc.).

---

## 9. Troubleshooting

### 9.1 Common Issues
- 401 Unauthorized when calling services: Verify API key and middleware setup.
- Model not found: Ensure OPENROUTER_DEFAULT_MODEL is valid, or specify a model in code.

### 9.2 Task Queue Debugging
- Confirm Redis is running and Celery workers are connected.
- Inspect task ids returned by POST /tasks/submit and check status endpoint.

### 9.3 AI API Issues
- Check that OPENROUTER_API_KEY is set.
- Ensure HTTP-Referer header domain matches allowed config in OpenRouter if applicable.

---

## 10. Changelog & Status

### 10.1 Status Docs
- See docs/ACTUAL_IMPLEMENTATION_STATUS.md for current implementation summaries (if maintained).

### 10.2 Migration Notes
- FIX_SEED_ERROR.md, MIGRATION_COMPLETE.md and similar docs capture past milestones. Refer to them for historical context.

### 10.3 Deprecations
- Top-level AGENTS.md and tool-internal CLAUDE.md are considered internal or redundant. Core project docs should live under docs/.

---

Maintainers: Keep this document in sync with code. When interfaces change (env vars, endpoints, default models), update the relevant sections and link to the source.
