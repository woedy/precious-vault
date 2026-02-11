"""
WebSocket URL routing for Channels
"""

from django.urls import path
from trading.consumers import PriceConsumer, PortfolioConsumer, DeliveryConsumer
from users.consumers import NotificationConsumer

websocket_urlpatterns = [
    path('ws/prices/', PriceConsumer.as_asgi()),
    path('ws/portfolio/', PortfolioConsumer.as_asgi()),
    path('ws/delivery/<uuid:delivery_id>/', DeliveryConsumer.as_asgi()),
    path('ws/notifications/', NotificationConsumer.as_asgi()),
]
