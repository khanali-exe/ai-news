-- AI Intelligence Hub — PostgreSQL Schema
-- Run automatically via Docker entrypoint on first init.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Sources ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sources (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    rss_url     TEXT NOT NULL UNIQUE,
    domain      VARCHAR(255) NOT NULL,
    trust_tier  VARCHAR(20) NOT NULL DEFAULT 'secondary'
                CHECK (trust_tier IN ('primary', 'secondary')),
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Articles ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS articles (
    id                  SERIAL PRIMARY KEY,
    title               TEXT NOT NULL,
    slug                VARCHAR(300) NOT NULL UNIQUE,
    url                 TEXT NOT NULL UNIQUE,
    source_id           INTEGER NOT NULL REFERENCES sources(id) ON DELETE RESTRICT,
    raw_content         TEXT,
    published_at        TIMESTAMPTZ,
    scraped_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- AI-generated fields (NULL until processed)
    display_title       TEXT,
    tl_dr               VARCHAR(200),
    what_happened       TEXT,
    why_it_matters      TEXT,
    potential_use_case  TEXT,
    category            VARCHAR(50)
                        CHECK (category IN ('models', 'research', 'tools', 'business', 'policy', 'other')),

    -- Verification & fact-check
    verification_status VARCHAR(20) NOT NULL DEFAULT 'unverified'
                        CHECK (verification_status IN ('verified', 'confirmed', 'unverified')),
    fact_check_valid    BOOLEAN,
    fact_check_reason   TEXT,

    -- Processing state
    processing_status   VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (processing_status IN ('pending', 'processing', 'done', 'failed', 'rejected')),
    processing_error    TEXT,
    processed_at        TIMESTAMPTZ,

    -- Display flag — only TRUE for fully processed + fact-checked articles
    is_published        BOOLEAN NOT NULL DEFAULT FALSE
);

-- ─── Scrape Logs ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scrape_logs (
    id              SERIAL PRIMARY KEY,
    source_id       INTEGER REFERENCES sources(id) ON DELETE SET NULL,
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at     TIMESTAMPTZ,
    articles_found  INTEGER,
    articles_new    INTEGER,
    status          VARCHAR(20) NOT NULL DEFAULT 'running'
                    CHECK (status IN ('running', 'success', 'failed')),
    error           TEXT
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_articles_published_at   ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_category        ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_verification    ON articles(verification_status);
CREATE INDEX IF NOT EXISTS idx_articles_is_published    ON articles(is_published);
CREATE INDEX IF NOT EXISTS idx_articles_source_id       ON articles(source_id);

-- ─── Seed: Default Sources ────────────────────────────────────────────────────
INSERT INTO sources (name, rss_url, domain, trust_tier) VALUES
  ('OpenAI Blog',          'https://openai.com/blog/rss.xml',                           'openai.com',           'primary'),
  ('Google DeepMind Blog', 'https://deepmind.google/blog/rss.xml',                      'deepmind.google',      'primary'),
  ('Anthropic News',       'https://www.anthropic.com/news/rss.xml',                    'anthropic.com',        'primary'),
  ('Meta AI Blog',         'https://ai.meta.com/blog/rss.xml',                          'ai.meta.com',          'primary'),
  ('Hugging Face Blog',    'https://huggingface.co/blog/feed.xml',                      'huggingface.co',       'primary'),
  ('The Verge AI',         'https://www.theverge.com/ai-artificial-intelligence/rss/index.xml', 'theverge.com', 'secondary'),
  ('VentureBeat AI',       'https://venturebeat.com/category/ai/feed/',                 'venturebeat.com',      'secondary'),
  ('MIT Tech Review AI',   'https://www.technologyreview.com/feed/',                    'technologyreview.com', 'secondary'),
  ('Ars Technica AI',      'https://feeds.arstechnica.com/arstechnica/technology-lab',  'arstechnica.com',      'secondary'),
  ('TechCrunch AI',        'https://techcrunch.com/category/artificial-intelligence/feed/', 'techcrunch.com',   'secondary')
ON CONFLICT (rss_url) DO NOTHING;
