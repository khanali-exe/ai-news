# AI Intelligence Hub

> Full-stack AI news aggregation platform — articles are scraped from 13 trusted sources, processed by OpenAI to produce structured summaries, fact-checked by a second AI pass, and served via a fast Next.js frontend.

**Live site:** https://ai-news-691x.vercel.app

---

## What it does

- Scrapes 13 AI/tech RSS feeds on a schedule (OpenAI Blog, Google DeepMind, Hugging Face, TechCrunch AI, MIT Tech Review, and more)
- Runs each article through a two-step OpenAI pipeline: structured analysis → fact-check
- Only publishes articles that pass fact-checking and meet source verification rules
- Serves articles via a REST API with Redis caching and cursor-based pagination
- Fully automated — zero manual intervention after initial deployment

---

## Architecture

```
RSS Sources → Celery Scraper → PostgreSQL (Neon)
                                      ↓
                           AI Processor (OpenAI GPT-4o-mini)
                                      ↓
                           Fact-Checker (OpenAI GPT-4o-mini)
                                      ↓
                           Redis Cache (Upstash)
                                      ↓
                    FastAPI Backend (Vercel) → Next.js Frontend (Vercel)
```

**Production services:**

| Service | Tech | Hosted on |
|---|---|---|
| Frontend | Next.js 16 (App Router) | Vercel |
| Backend API | FastAPI + Mangum (serverless ASGI) | Vercel |
| Task Workers | Celery (4 concurrent workers) | Hetzner VPS |
| Task Scheduler | Celery Beat | Hetzner VPS |
| Database | PostgreSQL 16 | Neon (serverless) |
| Cache / Broker | Redis | Upstash |

---

## Tech Stack

- **Frontend:** Next.js 16, TypeScript, Tailwind CSS, App Router
- **Backend:** FastAPI, Python 3.12, SQLAlchemy, Pydantic, Mangum
- **Workers:** Celery, Celery Beat
- **AI:** OpenAI GPT-4o-mini (JSON mode, temperature 0.1)
- **Database:** PostgreSQL 16 with SQLAlchemy ORM
- **Cache & Message Broker:** Redis (TLS via Upstash)
- **Infrastructure:** Docker, Hetzner VPS, Vercel, Neon, Upstash

---

## AI Processing Pipeline

For each article:

1. **Scraper** — fetches RSS feed, deduplicates by URL + slug hash, stores raw content
2. **Processor** — GPT-4o-mini generates `tl_dr`, `what_happened`, `why_it_matters`, `potential_use_case`, `category` using JSON mode
3. **Fact-checker** — second GPT-4o-mini call validates the analysis against the original text; returns `is_valid: false` if any claim is unsupported
4. **Verification** — assigns `verified` / `confirmed` / `unverified` based on source trust tier and cross-source corroboration
5. Articles that fail fact-check are marked `rejected` and never published
6. All AI outputs cached in Redis (7-day TTL) to avoid duplicate API calls

---

## Verification Logic

| Status | Meaning | Published |
|---|---|---|
| `verified` | From a primary source (official company blog) | Yes |
| `confirmed` | Secondary source covered by at least one other source | Yes |
| `unverified` | Single secondary source only | No |

---

## API Reference

### Articles
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/articles` | List published articles (`?category=`, `?page=`, `?page_size=`) |
| GET | `/api/v1/articles/{slug}` | Full article with AI analysis |
| GET | `/api/v1/articles/trending` | Top articles from the past 24 hours |
| GET | `/api/v1/articles/categories` | Categories with article counts |

### Sources
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/sources` | List active RSS sources |
| POST | `/api/v1/sources` | Add a new RSS source |
| PATCH | `/api/v1/sources/{id}/toggle` | Enable / disable a source |

### Admin (requires `x-secret` header)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/admin/scrape/trigger` | Trigger an immediate scrape |
| POST | `/api/v1/admin/process/trigger` | Queue all pending articles for AI processing |
| GET | `/api/v1/admin/stats` | Article counts by status |

---

## Local Development

### Prerequisites
- Docker Desktop
- An OpenAI API key

### 1. Clone and configure

```bash
git clone https://github.com/khanali-exe/ai-news.git
cd ai-news
cp .env.example .env
```

Edit `.env`:

```
OPENAI_API_KEY=sk-your-key-here
SECRET_KEY=pick-a-random-string
REVALIDATE_TOKEN=pick-another-random-string
```

### 2. Start all services

```bash
docker compose up -d
```

First boot takes ~2 minutes (builds images, runs DB migrations, seeds sources).

### 3. Verify

- Frontend: http://localhost:3000
- API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

### 4. Trigger a manual scrape (optional)

```bash
curl -X POST http://localhost:8000/api/v1/admin/scrape/trigger \
  -H "x-secret: your-SECRET_KEY-from-env"
```

---

## Backend Only (without Docker)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Copy and edit env
cp ../.env.example .env

# Start API
uvicorn app.main:app --reload --port 8000

# Start Celery worker (separate terminal)
celery -A app.tasks.celery_app worker --loglevel=info --concurrency=4

# Start Celery Beat scheduler (separate terminal)
celery -A app.tasks.celery_app beat --loglevel=info
```

## Frontend Only

```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
echo "REVALIDATE_TOKEN=dev_revalidate_token" >> .env.local
npm run dev
```

---

## Deployment

### Frontend → Vercel

```bash
cd frontend && npx vercel deploy --prod
```

Set in Vercel dashboard:
- `NEXT_PUBLIC_API_URL` → your backend URL
- `REVALIDATE_TOKEN` → same value as backend

### Backend API → Vercel (serverless)

The backend uses [Mangum](https://github.com/jordaneremieff/mangum) as an ASGI adapter so FastAPI runs as a Vercel serverless function. Entry point is `backend/api/index.py`.

```bash
cd backend && npx vercel deploy --prod
```

Set all variables from `.env.example` in the Vercel dashboard. Use `NullPool` for SQLAlchemy (required for serverless — each request opens its own connection).

### Workers → Linux VPS (Docker)

```bash
# On your server
git clone https://github.com/khanali-exe/ai-news.git
cd ai-news
cp .env.example .env.production
# Fill in production values

docker compose -f docker-compose.workers.yml --env-file .env.production up -d
```

Workers restart automatically on server reboot (`restart: unless-stopped`).

---

## Project Structure

```
ai-news/
├── frontend/                 Next.js 16 app (App Router + Tailwind)
├── backend/
│   ├── api/index.py          Vercel serverless entry point (Mangum)
│   ├── vercel.json           Vercel routing config
│   └── app/
│       ├── models/           SQLAlchemy ORM models
│       ├── schemas/          Pydantic request/response schemas
│       ├── routers/          API route handlers
│       ├── services/         Business logic (scraper, AI processor, cache)
│       └── tasks/            Celery tasks (scrape, process, digest)
├── database/                 PostgreSQL schema SQL
├── docker-compose.yml        Full local stack
├── docker-compose.workers.yml  Workers-only (for VPS deployment)
└── .env.example              Environment variable template
```

---

## Cost Estimate

| Service | Free tier | Paid threshold |
|---|---|---|
| Vercel (frontend + backend) | 100GB bandwidth / mo | Very unlikely to hit |
| Neon (PostgreSQL) | 0.5 GB storage | ~$0 for this scale |
| Upstash (Redis) | 10,000 commands/day | ~$0 for this scale |
| Hetzner VPS (workers) | — | ~$5/month |
| OpenAI API | — | ~$2–5/month at 1,000 articles/day |

**Total estimated cost: ~$5–10/month**

Redis caches AI outputs for 7 days, so each article costs exactly 2 API calls regardless of how many times it's requested.
