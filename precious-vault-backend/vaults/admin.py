"""
Vaults admin configuration
"""

from django.contrib import admin
from .models import Vault


@admin.register(Vault)
class VaultAdmin(admin.ModelAdmin):
    """Vault admin"""
    
    list_display = ['name', 'city', 'country', 'storage_fee_percent', 'capacity_percent', 'status']
    list_filter = ['status', 'country']
    search_fields = ['name', 'city', 'country']
