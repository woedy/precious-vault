"""
Celery configuration
"""

import os
from celery import Celery
from celery.schedules import crontab

# Set default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('fortress_vault')

# Load config from Django settings with CELERY namespace
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks in all installed apps
app.autodiscover_tasks()

# Celery Beat Schedule
app.conf.beat_schedule = {
    'update-metal-prices': {
        'task': 'trading.tasks.update_metal_prices',
        'schedule': 3600.0,  # Every 60 minutes
    },
    'calculate-portfolio-values': {
        'task': 'trading.tasks.calculate_portfolio_values',
        'schedule': 300.0,  # Every 5 minutes
    },
}

@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
