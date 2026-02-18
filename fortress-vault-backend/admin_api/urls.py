"""
Admin API URLs
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    KYCManagementViewSet, AdminUserViewSet, AdminTransactionViewSet,
    AdminShipmentViewSet, DeliveryManagementViewSet, AdminDashboardViewSet, AdminProductViewSet,
    DashboardMetricsView, DashboardAlertsView, DashboardRecentActionsView,
    VaultInventoryView, TransactionVolumeView, MetalPricesView, AuditLogViewSet, DevEmailViewSet
)
from .views import PlatformSettingsView

router = DefaultRouter()
router.register(r'users', AdminUserViewSet, basename='admin-user')
router.register(r'transactions', AdminTransactionViewSet, basename='admin-transaction')
router.register(r'shipments', AdminShipmentViewSet, basename='admin-shipment')
router.register(r'deliveries', DeliveryManagementViewSet, basename='admin-delivery')
router.register(r'audit', AuditLogViewSet, basename='admin-audit')
router.register(r'dev-emails', DevEmailViewSet, basename='admin-dev-email')

urlpatterns = [
    # KYC Management Endpoints
    path('kyc/', KYCManagementViewSet.as_view({'get': 'list'}), name='admin-kyc-list'),
    path('kyc/pending/', KYCManagementViewSet.as_view({'get': 'pending'}), name='admin-kyc-pending'),
    path('kyc/bulk-approve/', KYCManagementViewSet.as_view({'post': 'bulk_approve'}), name='admin-kyc-bulk-approve'),
    path('kyc/bulk-reject/', KYCManagementViewSet.as_view({'post': 'bulk_reject'}), name='admin-kyc-bulk-reject'),
    path('kyc/<uuid:pk>/', KYCManagementViewSet.as_view({'get': 'retrieve'}), name='admin-kyc-detail'),
    path('kyc/<uuid:pk>/approve/', KYCManagementViewSet.as_view({'post': 'approve'}), name='admin-kyc-approve'),
    path('kyc/<uuid:pk>/reject/', KYCManagementViewSet.as_view({'post': 'reject'}), name='admin-kyc-reject'),
    path('kyc/<uuid:pk>/history/', KYCManagementViewSet.as_view({'get': 'history'}), name='admin-kyc-history'),
    
    # Dashboard Endpoints
    path('dashboard/metrics/', DashboardMetricsView.as_view({'get': 'metrics'}), name='admin-dashboard-metrics'),
    path('dashboard/recent-actions/', DashboardRecentActionsView.as_view({'get': 'recent_actions'}), name='admin-dashboard-recent-actions'),
    path('dashboard/alerts/', DashboardAlertsView.as_view({'get': 'alerts'}), name='admin-dashboard-alerts'),
    path('dashboard/vault-inventory/', VaultInventoryView.as_view({'get': 'inventory'}), name='admin-dashboard-vault-inventory'),
    path('dashboard/metal-prices/', MetalPricesView.as_view({'get': 'prices'}), name='admin-dashboard-metal-prices'),
    path('dashboard/metal-prices/trigger-update/', MetalPricesView.as_view({'post': 'trigger_update'}), name='admin-dashboard-metal-prices-trigger-update'),
    path('dashboard/metal-prices/update-status/', MetalPricesView.as_view({'get': 'update_status'}), name='admin-dashboard-metal-prices-update-status'),
    path('dashboard/transaction-volume/', TransactionVolumeView.as_view({'get': 'volume'}), name='admin-dashboard-transaction-volume'),

    path('platform/settings/', PlatformSettingsView.as_view({'get': 'retrieve', 'post': 'update'}), name='admin-platform-settings'),
    
    # Legacy dashboard endpoint
    path('dashboard/stats/', AdminDashboardViewSet.as_view({'get': 'stats'}), name='admin-dashboard-stats'),
    
    # Product Management Endpoints
    path('products/metals/', AdminProductViewSet.as_view({'get': 'list_metals'}), name='admin-metals-list'),
    path('products/metals/<uuid:metal_id>/update-price/', 
         AdminProductViewSet.as_view({'patch': 'update_metal_price'}), 
         name='admin-metal-update-price'),
    path('products/', AdminProductViewSet.as_view({'get': 'list', 'post': 'create'}), name='admin-product-list'),
    path('products/<uuid:pk>/', 
         AdminProductViewSet.as_view({'get': 'retrieve', 'patch': 'partial_update', 'delete': 'destroy'}), 
         name='admin-product-detail'),
    
    # Router URLs (includes users, transactions, shipments, deliveries, audit with all CRUD operations)
    path('', include(router.urls)),
]
