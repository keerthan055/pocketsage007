from celery import Celery
from core.config import settings

celery_app = Celery(
    "pocketsage_worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

celery_app.conf.task_routes = {
    "worker.tasks.*": {"queue": "pocketsage_queue"}
}

celery_app.conf.update(task_track_started=True)
