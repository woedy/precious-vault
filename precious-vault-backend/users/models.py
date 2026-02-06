"""
User models
"""

import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user model"""
    
    class KYCStatus(models.TextChoices):
        UNVERIFIED = 'unverified', 'Unverified'
        PENDING = 'pending', 'Pending'
        VERIFIED = 'verified', 'Verified'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=20, blank=True)
    kyc_status = models.CharField(
        max_length=20,
        choices=KYCStatus.choices,
        default=KYCStatus.UNVERIFIED
    )
    two_factor_enabled = models.BooleanField(default=False)
    preferred_vault = models.ForeignKey(
        'vaults.Vault',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='preferred_by_users'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    class Meta:
        db_table = 'users'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['kyc_status']),
        ]
    
    def __str__(self):
        return self.email


class Address(models.Model):
    """User address for KYC and delivery"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses')
    street = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100, blank=True)
    zip_code = models.CharField(max_length=20)
    country = models.CharField(max_length=100)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'addresses'
        verbose_name_plural = 'Addresses'
        indexes = [
            models.Index(fields=['user', 'is_verified']),
        ]
    
    def __str__(self):
        return f"{self.street}, {self.city}, {self.country}"


class Wallet(models.Model):
    """User wallet for cash balance"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='wallet')
    cash_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'wallets'
    
    def __str__(self):
        return f"{self.user.email} - ${self.cash_balance}"
