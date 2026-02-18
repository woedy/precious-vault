"""
Trading app URLs
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MetalViewSet, ProductViewSet, PortfolioViewSet, TransactionViewSet, TradingViewSet, ShipmentViewSet, PlatformSettingsPublicView

router = DefaultRouter()
router.register(r'metals', MetalViewSet, basename='metal')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'portfolio', PortfolioViewSet, basename='portfolio')
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'trade', TradingViewSet, basename='trade')
router.register(r'shipments', ShipmentViewSet, basename='shipment')

urlpatterns = [
    path('platform/settings/', PlatformSettingsPublicView.as_view({'get': 'retrieve'}), name='platform-settings-public'),
    path('', include(router.urls)),
]
