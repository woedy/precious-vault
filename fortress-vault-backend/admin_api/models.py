"""
Admin API models
"""

import uuid
from django.db import models
from django.conf import settings


class AdminAction(models.Model):
    """Audit log for admin actions"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    admin_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='admin_actions'
    )
    action_type = models.CharField(max_length=50)  # 'approve_kyc', 'suspend_user', etc.
    target_type = models.CharField(max_length=50)  # 'user', 'transaction', etc.
    target_id = models.UUIDField()
    details = models.JSONField(default=dict)  # Store action-specific data
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'admin_actions'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['admin_user']),
            models.Index(fields=['timestamp']),
            models.Index(fields=['action_type']),
        ]
    
    def __str__(self):
        return f"{self.admin_user.email} - {self.action_type} - {self.timestamp}"


class TransactionNote(models.Model):
    """Admin notes on transactions"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transaction = models.ForeignKey(
        'trading.Transaction',
        on_delete=models.CASCADE,
        related_name='admin_notes'
    )
    admin_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='transaction_notes'
    )
    note = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'transaction_notes'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['transaction']),
        ]
    
    def __str__(self):
        return f"Note on {self.transaction.id} by {self.admin_user.email}"
