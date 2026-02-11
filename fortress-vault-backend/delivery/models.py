"""
Delivery models
"""

import uuid
from django.db import models
from django.conf import settings


class DeliveryRequest(models.Model):
    """Physical delivery orders"""
    
    class Carrier(models.TextChoices):
        FEDEX = 'fedex', 'FedEx'
        BRINKS = 'brinks', 'Brinks'
        MALCA = 'malca', 'Malca-Amit'
    
    class Status(models.TextChoices):
        PROCESSING = 'processing', 'Processing'
        SHIPPED = 'shipped', 'Shipped'
        CUSTOMS = 'customs', 'In Customs'
        DELIVERED = 'delivered', 'Delivered'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='deliveries')
    tracking_number = models.CharField(max_length=100, unique=True)
    carrier = models.CharField(max_length=20, choices=Carrier.choices)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PROCESSING)
    destination_address = models.JSONField()  # Stores full address as JSON
    estimated_arrival = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'delivery_requests'
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['tracking_number']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.tracking_number} - {self.status}"


class DeliveryItem(models.Model):
    """Items in a delivery"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    delivery_request = models.ForeignKey(
        DeliveryRequest,
        on_delete=models.CASCADE,
        related_name='items'
    )
    portfolio_item = models.ForeignKey(
        'trading.PortfolioItem',
        on_delete=models.PROTECT,
        related_name='delivery_items'
    )
    quantity = models.IntegerField(default=1)
    
    class Meta:
        db_table = 'delivery_items'
        indexes = [
            models.Index(fields=['delivery_request']),
            models.Index(fields=['portfolio_item']),
        ]
    
    def __str__(self):
        return f"{self.delivery_request.tracking_number} - {self.portfolio_item}"


class DeliveryHistory(models.Model):
    """Tracking events"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    delivery_request = models.ForeignKey(
        DeliveryRequest,
        on_delete=models.CASCADE,
        related_name='history'
    )
    status = models.CharField(max_length=100)
    description = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'delivery_history'
        verbose_name_plural = 'Delivery histories'
        indexes = [
            models.Index(fields=['delivery_request', 'timestamp']),
        ]
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.delivery_request.tracking_number} - {self.status}"
