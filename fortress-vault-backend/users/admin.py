"""
Users admin configuration
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Address, Wallet


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom user admin"""
    
    list_display = ['email', 'username', 'first_name', 'last_name', 'kyc_status', 'two_factor_enabled', 'created_at']
    list_filter = ['kyc_status', 'two_factor_enabled', 'created_at']
    search_fields = ['email', 'username', 'first_name', 'last_name']
    ordering = ['-created_at']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('phone_number', 'kyc_status', 'two_factor_enabled', 'preferred_vault')}),
    )


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    """Address admin"""
    
    list_display = ['user', 'city', 'country', 'is_verified', 'created_at']
    list_filter = ['is_verified', 'country']
    search_fields = ['user__email', 'city', 'country']


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    """Wallet admin"""
    
    list_display = ['user', 'cash_balance', 'last_updated']
    search_fields = ['user__email']
    readonly_fields = ['last_updated']
