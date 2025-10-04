# Aladdin

Aladdin is an AI-assisted movie production platform. It combines a Next.js web app with an AI layer powered by OpenRouter (via the Vercel AI SDK) and a background task-queue service (FastAPI + Celery/Redis) for long-running tasks like video, image, and audio generation.

This README provides a concise overview and quick start. Full documentation, including architecture, API references, and operations, is available in docs/README.md.

## Quick Start

Prerequisites:
- Node.js LTS and pnpm
- Python 3.11+ (for task-queue service)
- Redis (via Docker or local install)

Environment:
- OPENROUTER_API_KEY: required for AI access
- NEXT_PUBLIC_APP_URL: optional, used for HTTP-Referer header
- OPENROUTER_DEFAULT_MODEL: optional, defaults to anthropic/claude-sonnet-4.5

Install and run the web app:
- pnpm install
- pnpm dev
- Open http://localhost:3000

Run services locally (optional outline):
- cd services/task-queue
- Create and activate a Python venv
- pip install -r requirements.txt (if present)
- Ensure Redis is running
- Start FastAPI (e.g., uvicorn main:app --reload)
- Start Celery workers configured to Redis

Docker:
- docker-compose up -d to launch dependencies like Redis

## AI Configuration

The AI client uses OpenRouter through @openrouter/ai-sdk-provider.
- Source: src/lib/ai/client.ts
- Default model: OPENROUTER_DEFAULT_MODEL env var or anthropic/claude-sonnet-4.5

## Task Queue APIs

FastAPI endpoints expose task orchestration and worker status.
- Source: services/task-queue/app/api
- Submit task: POST /tasks/submit
- Task status: GET /tasks/{task_id}/status
- Workers status: GET /workers/status

## Documentation

Please see docs/README.md for the full documentation, including:
- Architecture overview
- Detailed setup and environment variables
- AI agent execution flow
- Service API details
- Testing and operations guidance
