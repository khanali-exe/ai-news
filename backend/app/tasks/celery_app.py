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
    redis_backend_use_ssl={"ssl_cert_reqs": __import__("ssl").CERT_NONE} if _redis_ssl else None,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_ignore_result=True,     # don't store results — saves reads+writes per task
    task_track_started=False,    # don't write "started" state to backend

    # Reduce Redis command volume for Upstash free tier
    worker_heartbeat_interval=60,       # heartbeat every 60s (default: 2s) — 30x fewer commands
    worker_proc_alive_timeout=120,      # allow 2 missed heartbeats before marking dead
    broker_heartbeat=60,                # broker heartbeat every 60s (default: 2s)
    broker_heartbeat_checkrate=2,       # check every 2 intervals = 120s
    result_chord_retry_interval=60,     # chord polling interval
    worker_cancel_long_running_tasks_on_connection_loss=True,

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
