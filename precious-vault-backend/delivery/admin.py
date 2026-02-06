"""
Delivery admin configuration
"""

from django.contrib import admin
from .models import DeliveryRequest, DeliveryItem, DeliveryHistory


class DeliveryItemInline(admin.TabularInline):
    """Delivery item inline"""
    model = DeliveryItem
    extra = 0


class DeliveryHistoryInline(admin.TabularInline):
    """Delivery history inline"""
    model = DeliveryHistory
    extra = 0
    readonly_fields = ['timestamp']


@admin.register(DeliveryRequest)
class DeliveryRequestAdmin(admin.ModelAdmin):
    """Delivery request admin"""
    
    list_display = ['tracking_number', 'user', 'carrier', 'status', 'estimated_arrival', 'created_at']
    list_filter = ['carrier', 'status', 'created_at']
    search_fields = ['tracking_number', 'user__email']
    readonly_fields = ['tracking_number', 'created_at']
    inlines = [DeliveryItemInline, DeliveryHistoryInline]


@admin.register(DeliveryItem)
class DeliveryItemAdmin(admin.ModelAdmin):
    """Delivery item admin"""
    
    list_display = ['delivery_request', 'portfolio_item', 'quantity']
    search_fields = ['delivery_request__tracking_number']


@admin.register(DeliveryHistory)
class DeliveryHistoryAdmin(admin.ModelAdmin):
    """Delivery history admin"""
    
    list_display = ['delivery_request', 'status', 'timestamp']
    list_filter = ['status', 'timestamp']
    search_fields = ['delivery_request__tracking_number']
    readonly_fields = ['timestamp']
