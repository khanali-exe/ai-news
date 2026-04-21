from celery import Celery
from celery.schedules import crontab
from app.config import get_settings

settings = get_settings()

celery_app = Celery(
    "ainews",
    broker=settings.redis_url,
    backend=None,   # disable result backend — we never read results, saves ~50% Redis commands
    include=[
        "app.tasks.scrape_task",
        "app.tasks.process_task",
        "app.tasks.briefing_task",
        "app.tasks.digest_task",
        "app.tasks.x_post_task",
    ],
)

# SSL config for Upstash rediss:// URLs
_redis_ssl = settings.redis_url.startswith("rediss://")
_broker_transport_options = {"ssl_cert_reqs": "CERT_NONE"} if _redis_ssl else {}

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    broker_use_ssl={"ssl_cert_reqs": __import__("ssl").CERT_NONE} if _redis_ssl else None,
    broker_connection_retry_on_startup=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_ignore_result=True,          # don't store results in Redis
    task_track_started=False,         # don't write "started" state
    task_send_sent_event=False,       # don't publish task-sent events to Redis
    worker_send_task_events=False,    # disable all task event publishing (stops PUBLISH commands)
    event_queue_expires=60,           # expire event queues quickly if any slip through

    # Reduce Redis command volume for Upstash free tier
    worker_heartbeat_interval=300,    # heartbeat every 5 min
    worker_proc_alive_timeout=600,    # 10 min timeout before marking dead
    broker_heartbeat=0,               # disable broker-level heartbeat (Redis doesn't need it)
    broker_transport_options={
        "visibility_timeout": 3600,   # 1 hour task requeue timeout
        "polling_interval": 5.0,      # BRPOP poll every 5s instead of 0.1s — 50x fewer BRPOP commands
    },

    beat_schedule={
        "scrape-all-sources": {
            "task": "app.tasks.scrape_task.scrape_all_sources_task",
            "schedule": crontab(minute=f"*/{settings.scrape_interval_minutes}"),
        },
        "process-pending-articles": {
            "task": "app.tasks.process_task.process_pending_articles_task",
            "schedule": crontab(minute=f"*/{settings.scrape_interval_minutes}"),
        },
        "generate-daily-briefing": {
            "task": "app.tasks.briefing_task.generate_daily_briefing_task",
            "schedule": crontab(hour="6", minute="0"),
        },
        "send-daily-digest": {
            "task": "app.tasks.digest_task.send_daily_digest_task",
            "schedule": crontab(hour="20", minute="0"),  # 8pm UTC — end of day
        },
    },
)
