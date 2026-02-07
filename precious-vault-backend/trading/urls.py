"""
Trading app URLs
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MetalViewSet, ProductViewSet, PortfolioViewSet, TransactionViewSet, TradingViewSet, ShipmentViewSet

router = DefaultRouter()
router.register(r'metals', MetalViewSet, basename='metal')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'portfolio', PortfolioViewSet, basename='portfolio')
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'trade', TradingViewSet, basename='trade')
router.register(r'shipments', ShipmentViewSet, basename='shipment')

urlpatterns = [
    path('', include(router.urls)),
]
