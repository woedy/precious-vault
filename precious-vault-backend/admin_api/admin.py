"""
Admin API admin configuration
"""

from django.contrib import admin
from .models import AdminAction, TransactionNote


@admin.register(AdminAction)
class AdminActionAdmin(admin.ModelAdmin):
    """Admin action audit log"""
    
    list_display = ['admin_user', 'action_type', 'target_type', 'target_id', 'timestamp']
    list_filter = ['action_type', 'target_type', 'timestamp']
    search_fields = ['admin_user__email', 'target_id']
    readonly_fields = ['timestamp']
    ordering = ['-timestamp']


@admin.register(TransactionNote)
class TransactionNoteAdmin(admin.ModelAdmin):
    """Transaction notes"""
    
    list_display = ['transaction', 'admin_user', 'created_at']
    list_filter = ['created_at']
    search_fields = ['transaction__id', 'admin_user__email', 'note']
    readonly_fields = ['created_at']
    ordering = ['-created_at']
