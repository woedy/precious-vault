"""
Vault models
"""

import uuid
from django.db import models


class Vault(models.Model):
    """Physical storage locations"""
    
    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        MAINTENANCE = 'maintenance', 'Maintenance'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    city = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    flag_emoji = models.CharField(max_length=10, blank=True)
    storage_fee_percent = models.DecimalField(max_digits=5, decimal_places=4)  # e.g., 0.0008 = 0.08%
    is_allocated = models.BooleanField(default=True)
    is_insured = models.BooleanField(default=True)
    capacity_percent = models.IntegerField(default=0)  # 0-100
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'vaults'
        indexes = [
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.city}, {self.country}"
