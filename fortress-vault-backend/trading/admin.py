"""
Trading admin configuration
"""

from django.contrib import admin
from .models import Metal, Product, PortfolioItem, Transaction


@admin.register(Metal)
class MetalAdmin(admin.ModelAdmin):
    """Metal admin"""
    
    list_display = ['name', 'symbol', 'current_price', 'price_change_24h', 'last_updated']
    search_fields = ['name', 'symbol']
    readonly_fields = ['last_updated']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    """Product admin"""
    
    list_display = ['name', 'metal', 'weight_oz', 'premium_per_oz', 'product_type', 'is_active']
    list_filter = ['metal', 'product_type', 'is_active']
    search_fields = ['name', 'manufacturer']


@admin.register(PortfolioItem)
class PortfolioItemAdmin(admin.ModelAdmin):
    """Portfolio item admin"""
    
    list_display = ['user', 'metal', 'weight_oz', 'quantity', 'vault_location', 'status', 'purchase_date']
    list_filter = ['metal', 'status', 'vault_location']
    search_fields = ['user__email']
    readonly_fields = ['purchase_date', 'created_at']


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    """Transaction admin"""
    
    list_display = ['user', 'transaction_type', 'metal', 'total_value', 'status', 'created_at']
    list_filter = ['transaction_type', 'status', 'created_at']
    search_fields = ['user__email']
    readonly_fields = ['created_at']
