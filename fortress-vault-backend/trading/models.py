"""
Trading models - Metals, Products, Portfolio, Transactions
"""

import uuid
from django.db import models
from django.conf import settings


class Metal(models.Model):
    """Precious metal types"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50)
    symbol = models.CharField(max_length=10, unique=True)  # Au, Ag, Pt, Pd
    current_price = models.DecimalField(max_digits=10, decimal_places=2)
    price_change_24h = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'metals'
        indexes = [
            models.Index(fields=['symbol']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.symbol})"


class Product(models.Model):
    """Specific products available for purchase"""
    
    class ProductType(models.TextChoices):
        BAR = 'bar', 'Bar'
        COIN = 'coin', 'Coin'
        DIGITAL = 'digital', 'Digital'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    metal = models.ForeignKey(Metal, on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=200)
    manufacturer = models.CharField(max_length=200)
    purity = models.CharField(max_length=20)  # e.g., .9999
    weight_oz = models.DecimalField(max_digits=10, decimal_places=4)
    premium_per_oz = models.DecimalField(max_digits=10, decimal_places=2)
    product_type = models.CharField(max_length=20, choices=ProductType.choices)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'products'
        indexes = [
            models.Index(fields=['metal', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.weight_oz}oz"


class PortfolioItem(models.Model):
    """User's metal holdings"""
    
    class Status(models.TextChoices):
        VAULTED = 'vaulted', 'Vaulted'
        IN_TRANSIT = 'in_transit', 'In Transit'
        DELIVERED = 'delivered', 'Delivered'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='portfolio_items')
    metal = models.ForeignKey(Metal, on_delete=models.PROTECT, related_name='portfolio_items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name='portfolio_items')
    weight_oz = models.DecimalField(max_digits=10, decimal_places=4)
    quantity = models.IntegerField(default=1)
    vault_location = models.ForeignKey(
        'vaults.Vault',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='portfolio_items'
    )
    shipment = models.ForeignKey(
        'Shipment',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='items'
    )
    serial_numbers = models.JSONField(default=list, blank=True)
    purchase_date = models.DateField(auto_now_add=True)
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.VAULTED)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'portfolio_items'
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['vault_location']),
            models.Index(fields=['shipment']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.weight_oz}oz {self.metal.name}"


class Transaction(models.Model):
    """All financial transactions"""
    
    class TransactionType(models.TextChoices):
        BUY = 'buy', 'Buy'
        SELL = 'sell', 'Sell'
        CONVERT = 'convert', 'Convert'
        DEPOSIT = 'deposit', 'Deposit'
        WITHDRAWAL = 'withdrawal', 'Withdrawal'
        STORAGE_FEE = 'storage_fee', 'Storage Fee'
    
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        COMPLETED = 'completed', 'Completed'
        FAILED = 'failed', 'Failed'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=20, choices=TransactionType.choices)
    metal = models.ForeignKey(Metal, on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')
    amount_oz = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    price_per_oz = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    total_value = models.DecimalField(max_digits=12, decimal_places=2)
    fees = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'transactions'
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['created_at']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.email} - {self.transaction_type} - ${self.total_value}"


class Shipment(models.Model):
    """Physical shipment tracking"""
    
    class Status(models.TextChoices):
        REQUESTED = 'requested', 'Requested'
        PREPARING = 'preparing', 'Preparing'
        SHIPPED = 'shipped', 'Shipped'
        IN_TRANSIT = 'in_transit', 'In Transit'
        OUT_FOR_DELIVERY = 'out_for_delivery', 'Out for Delivery'
        DELIVERED = 'delivered', 'Delivered'
        FAILED = 'failed', 'Failed'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='shipments')
    tracking_number = models.CharField(max_length=100, unique=True, null=True, blank=True)
    carrier = models.CharField(max_length=50)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.REQUESTED)
    destination_address = models.JSONField()  # Store snapshot of address
    estimated_delivery = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'shipments'
        ordering = ['-created_at']

    def __str__(self):
        return f"Shipment {self.tracking_number or self.id} - {self.status}"

    def initialize_workflow(self):
        """Create default workflow stages for shipment lifecycle."""
        default_stages = [
            ('delivery_request', 'Delivery Requested', False),
            ('address_verification', 'Address / Delivery Location Verification', True),
            ('compliance_paperwork', 'Compliance & Paperwork', True),
            ('packaging', 'Packaging & Vault Release', False),
            ('carrier_assignment', 'Carrier Assignment', False),
            ('in_transit', 'In Transit', False),
            ('out_for_delivery', 'Out For Delivery', False),
            ('delivery_completed', 'Delivered', False),
        ]

        if self.workflow_stages.exists():
            return

        for idx, (code, name, requires_customer_action) in enumerate(default_stages):
            ShipmentWorkflowStage.objects.create(
                shipment=self,
                code=code,
                name=name,
                stage_order=idx,
                status=ShipmentWorkflowStage.StageStatus.IN_PROGRESS if idx == 0 else ShipmentWorkflowStage.StageStatus.PENDING,
                requires_customer_action=requires_customer_action,
            )


class ShipmentWorkflowStage(models.Model):
    """Workflow stage for a shipment process with admin and customer controls."""

    class StageStatus(models.TextChoices):
        PENDING = 'pending', 'Pending'
        IN_PROGRESS = 'in_progress', 'In Progress'
        COMPLETED = 'completed', 'Completed'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    shipment = models.ForeignKey(Shipment, on_delete=models.CASCADE, related_name='workflow_stages')
    code = models.CharField(max_length=60)
    name = models.CharField(max_length=120)
    stage_order = models.PositiveIntegerField()
    status = models.CharField(max_length=20, choices=StageStatus.choices, default=StageStatus.PENDING)
    requires_customer_action = models.BooleanField(default=False)
    customer_action_completed = models.BooleanField(default=False)
    customer_action_note = models.TextField(blank=True)
    customer_action_completed_at = models.DateTimeField(null=True, blank=True)
    is_blocked = models.BooleanField(default=False)
    blocked_reason = models.TextField(blank=True)
    blocked_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'shipment_workflow_stages'
        ordering = ['stage_order']
        unique_together = [('shipment', 'code'), ('shipment', 'stage_order')]

    def __str__(self):
        return f"{self.shipment_id} - {self.code} ({self.status})"


class ShipmentEvent(models.Model):
    """Shipment history events"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    shipment = models.ForeignKey(Shipment, on_delete=models.CASCADE, related_name='events')
    status = models.CharField(max_length=20, choices=Shipment.Status.choices)
    description = models.TextField()
    location = models.CharField(max_length=255, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'shipment_events'
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.shipment.id} - {self.status} at {self.timestamp}"
