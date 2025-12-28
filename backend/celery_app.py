"""
Celery application for background tasks.

Usage:
    # Start worker
    celery -A celery_app worker --loglevel=info
    
    # Monitor tasks
    celery -A celery_app events

Prerequisites:
    - Redis must be running (brew services start redis)
    - pip install celery redis
"""

import os
from celery import Celery

# Redis connection URL
# Development: redis://localhost:6379/0
# Production (Upstash): rediss://... (note the 's' for TLS)
REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')

# Upstash requires TLS (rediss://) - handle URL format and SSL
if REDIS_URL and 'upstash.io' in REDIS_URL:
    # Ensure rediss:// scheme
    if REDIS_URL.startswith('redis://'):
        REDIS_URL = REDIS_URL.replace('redis://', 'rediss://', 1)
    # Add SSL cert requirement for Celery
    if '?' not in REDIS_URL:
        REDIS_URL += '?ssl_cert_reqs=CERT_NONE'
    elif 'ssl_cert_reqs' not in REDIS_URL:
        REDIS_URL += '&ssl_cert_reqs=CERT_NONE'

# Create Celery app
celery_app = Celery(
    'klyx',
    broker=REDIS_URL,
    backend=REDIS_URL
)

# Celery configuration
celery_app.conf.update(
    # Task settings
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    
    # Result backend settings
    result_expires=3600,  # Results expire after 1 hour
    
    # Worker settings
    worker_prefetch_multiplier=1,  # Only fetch 1 task at a time
    worker_max_tasks_per_child=50,  # Restart worker after 50 tasks (prevent memory leaks)
    
    # Task execution settings
    task_acks_late=True,  # Acknowledge task after completion (not before)
    task_reject_on_worker_lost=True,  # Retry if worker crashes
    
    # Retry settings
    task_default_retry_delay=60,  # Retry after 60 seconds
    task_max_retries=3,
)

# Import tasks explicitly (autodiscover has path issues)
# This ensures tasks are registered when celery_app is imported
try:
    from tasks import portfolio_tasks  # noqa: F401
except ImportError:
    pass  # Tasks will be imported when running from backend directory

if __name__ == '__main__':
    celery_app.start()
