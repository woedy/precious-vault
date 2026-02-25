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


class DevEmail(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    subject = models.CharField(max_length=255)
    from_email = models.CharField(max_length=255, blank=True, default='')
    recipient_list = models.JSONField(default=list)
    text_content = models.TextField(blank=True, default='')
    html_content = models.TextField(blank=True, default='')
    template_name = models.CharField(max_length=255, blank=True, default='')
    context = models.JSONField(default=dict)
    status = models.CharField(max_length=20, default='sent')
    error = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'dev_emails'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['created_at']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        recipients = ','.join(self.recipient_list or [])
        return f"{self.subject} -> {recipients}"


class PlatformSettings(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    metals_buying_enabled = models.BooleanField(default=True)
    metals_selling_enabled = models.BooleanField(default=True)
    metals_convert_enabled = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'platform_settings'

    @classmethod
    def get_solo(cls):
        obj = cls.objects.first()
        if obj is None:
            obj = cls.objects.create()
        return obj
