# AI Intelligence Hub

Automated, verified AI news aggregation. Articles are scraped from trusted sources every 30 minutes, processed by AI to produce structured summaries, fact-checked by a second AI pass, and served via a fast Next.js frontend.

---

## Architecture

```
RSS Sources → Scraper (Celery) → PostgreSQL
                                      ↓
                              AI Processor (OpenAI)
                                      ↓
                              Fact-Checker (OpenAI)
                                      ↓
                              Redis Cache
                                      ↓
                         FastAPI Backend → Next.js Frontend
```

**Services:**
| Service | Tech | Port |
|---|---|---|
| Frontend | Next.js 15 | 3000 |
| Backend API | FastAPI + Python 3.12 | 8000 |
| Task Worker | Celery | — |
| Task Scheduler | Celery Beat | — |
| Database | PostgreSQL 16 | 5432 |
| Cache | Redis 7 | 6379 |

---

## Quick Start (Docker)

### 1. Prerequisites
- Docker Desktop installed and running
- An OpenAI API key (get one at https://platform.openai.com/api-keys)

### 2. Configure environment
```bash
cp .env.example .env
```

Edit `.env` and set:
```
OPENAI_API_KEY=sk-your-key-here
SECRET_KEY=pick-a-random-string
REVALIDATE_TOKEN=pick-another-random-string
```

### 3. Start all services
```bash
docker compose up -d
```

First boot takes ~2 minutes (builds images, runs DB migrations, seeds sources).

### 4. Verify
- Frontend: http://localhost:3000
- Backend API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

### 5. Trigger a manual scrape (optional — the scheduler runs every 30 min)
```bash
curl -X POST http://localhost:8000/api/v1/admin/scrape/trigger \
  -H "x-secret: your-SECRET_KEY-from-env"
```

---

## Local Development (without Docker)

### Backend

**Requirements:** Python 3.12+, PostgreSQL, Redis running locally.

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp ../.env.example .env
# Edit .env with your local DATABASE_URL and REDIS_URL

# Start API
uvicorn app.main:app --reload --port 8000

# In another terminal — start Celery worker
celery -A app.tasks.celery_app worker --loglevel=info

# In another terminal — start Celery Beat (scheduler)
celery -A app.tasks.celery_app beat --loglevel=info
```

### Frontend

**Requirements:** Node.js 20+

```bash
cd frontend
npm install

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
echo "REVALIDATE_TOKEN=dev_revalidate_token" >> .env.local

npm run dev
```

Open http://localhost:3000.

---

## Database

The schema is created automatically by Docker on first boot via `database/schema.sql`.

For local development, run the SQL manually:
```bash
psql -U ainews -d ainews -f database/schema.sql
```

---

## API Reference

### Articles
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/articles` | List published articles (supports `?category=`, `?verification_status=`, `?page=`, `?page_size=`) |
| GET | `/api/v1/articles/{slug}` | Get full article with AI analysis |
| GET | `/api/v1/articles/categories` | List categories with counts |

### Sources
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/sources` | List active sources |
| POST | `/api/v1/sources` | Add a new RSS source |
| PATCH | `/api/v1/sources/{id}/toggle` | Enable/disable a source |

### Admin (requires `x-secret` header)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/admin/scrape/trigger` | Trigger immediate scrape |
| POST | `/api/v1/admin/process/trigger` | Queue all pending articles for AI processing |
| GET | `/api/v1/admin/stats` | Article counts by status |
| GET | `/api/v1/admin/scrape/logs` | Recent scrape logs |

---

## Verification Logic

| Status | Meaning |
|---|---|
| **verified** | Came from a `primary` source (official company blog) |
| **confirmed** | From a `secondary` source AND covered by at least one other source |
| **unverified** | Single secondary source only — not published |

Only `verified` and `confirmed` articles are shown in the feed.

---

## AI Processing Pipeline

For each article:
1. **Processor** — GPT-4o-mini generates `tl_dr`, `what_happened`, `why_it_matters`, `potential_use_case`, `category` using JSON mode with `temperature=0.1`
2. **Fact-checker** — Second GPT-4o-mini call compares the analysis against the original text. Returns `is_valid: false` if any claim cannot be verified.
3. Articles that fail fact-check are marked `rejected` and not published.
4. All AI outputs are cached in Redis (7-day TTL) to prevent duplicate API calls.

---

## Deployment

### Vercel (Frontend)

```bash
cd frontend
npx vercel deploy --prod
```

Set environment variables in the Vercel dashboard:
- `NEXT_PUBLIC_API_URL` → your backend URL
- `REVALIDATE_TOKEN` → same token as backend

### Railway / Render (Backend)

1. Push the `backend/` folder as a service
2. Set all environment variables from `.env.example`
3. Set the start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add a second service for the Celery worker: `celery -A app.tasks.celery_app worker --loglevel=info`
5. Add a third service for Celery Beat: `celery -A app.tasks.celery_app beat --loglevel=info`
6. Provision a PostgreSQL database and a Redis instance — copy their connection URLs to env vars.

---

## Cost Optimization

- Redis caches AI outputs for 7 days — each article costs ~2 API calls total (process + fact-check), never more.
- `gpt-4o-mini` is used by default (~$0.15/1M input tokens). Budget: ~$2–5/month for 1000 articles/day.
- To use a cheaper/local model, set `AI_MODEL` and optionally `OPENAI_BASE_URL` (compatible with Groq, Together, Ollama).

---

## Project Structure

```
AI NEWS/
├── frontend/          Next.js 15 app (App Router + Tailwind)
├── backend/           FastAPI + Celery Python service
│   └── app/
│       ├── models/    SQLAlchemy ORM models
│       ├── schemas/   Pydantic request/response schemas
│       ├── routers/   API route handlers
│       ├── services/  Business logic (scraper, AI, cache)
│       └── tasks/     Celery background tasks
├── database/          PostgreSQL schema SQL
├── nginx/             Reverse proxy config
├── scripts/           Utility scripts
└── docker-compose.yml Orchestrates all services
```
