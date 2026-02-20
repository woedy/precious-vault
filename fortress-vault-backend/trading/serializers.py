"""
Trading serializers
"""

from rest_framework import serializers
from django.conf import settings
from urllib.parse import urlparse
from .models import Metal, Product, PortfolioItem, Transaction, Shipment, ShipmentEvent, ShipmentWorkflowStage
from vaults.serializers import VaultSerializer


class MetalSerializer(serializers.ModelSerializer):
    """Metal serializer"""

    image_url = serializers.SerializerMethodField()

    METAL_IMAGE_MAP = {
        'AU': 'https://img.icons8.com/color/96/gold-bars.png',
        'AG': 'https://img.icons8.com/color/96/silver-bars.png',
        'PT': 'https://img.icons8.com/color/96/platinum-bars.png',
        'PD': 'https://img.icons8.com/color/96/metal.png',
    }

    # exchangerate.host metal assets typically use x-prefixed ISO metal codes
    METAL_IMAGE_FILENAME_MAP = {
        'AU': 'xau.png',
        'AG': 'xag.png',
        'PT': 'xpt.png',
        'PD': 'xpd.png',
    }

    @classmethod
    def get_image_url_for_symbol(cls, symbol):
        normalized_symbol = (symbol or '').upper()

        configured_base = getattr(settings, 'FX_METAL_IMAGE_BASE_URL', '').strip()
        if configured_base:
            parsed = urlparse(configured_base)
            if 'exchangerate.host' in (parsed.netloc or '').lower():
                # exchangerate.host does not provide public metal image assets.
                return cls.METAL_IMAGE_MAP.get(normalized_symbol)

            filename = cls.METAL_IMAGE_FILENAME_MAP.get(normalized_symbol, f"{normalized_symbol.lower()}.png")
            return f"{configured_base.rstrip('/')}/{filename}"

        return cls.METAL_IMAGE_MAP.get(normalized_symbol)

    def get_image_url(self, obj):
        return self.get_image_url_for_symbol(obj.symbol)
    
    class Meta:
        model = Metal
        fields = ['id', 'name', 'symbol', 'current_price', 'price_change_24h', 'image_url', 'last_updated']
        read_only_fields = ['id', 'last_updated']


class ProductSerializer(serializers.ModelSerializer):
    """Product serializer"""
    
    metal = MetalSerializer(read_only=True)
    metal_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'metal', 'metal_id', 'name', 'manufacturer', 'purity',
            'weight_oz', 'premium_per_oz', 'product_type', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class PortfolioItemSerializer(serializers.ModelSerializer):
    """Portfolio item serializer"""
    
    metal = MetalSerializer(read_only=True)
    product = ProductSerializer(read_only=True)
    vault_location = VaultSerializer(read_only=True)
    vault_location_name = serializers.CharField(source='vault_location.name', read_only=True)
    current_value = serializers.SerializerMethodField()
    
    class Meta:
        model = PortfolioItem
        fields = [
            'id', 'metal', 'product', 'weight_oz', 'quantity',
            'vault_location', 'vault_location_name', 'serial_numbers',
            'purchase_date', 'purchase_price', 'status', 'current_value', 'created_at'
        ]
        read_only_fields = ['id', 'purchase_date', 'created_at']
    
    def get_current_value(self, obj):
        """Calculate current value based on current metal price"""
        return float(obj.weight_oz * obj.metal.current_price)


class TransactionSerializer(serializers.ModelSerializer):
    """Transaction serializer"""
    
    metal = MetalSerializer(read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = Transaction
        fields = [
            'id', 'user', 'user_email', 'transaction_type', 'metal',
            'amount_oz', 'price_per_oz', 'total_value', 'fees',
            'status', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'created_at']


class BuyMetalSerializer(serializers.Serializer):
    """Buy metal request serializer"""
    
    product_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1)
    vault_id = serializers.UUIDField(required=False, allow_null=True)
    delivery_method = serializers.ChoiceField(choices=['vault', 'delivery'])
    
    def validate(self, attrs):
        if attrs['delivery_method'] == 'vault' and not attrs.get('vault_id'):
            raise serializers.ValidationError({"vault_id": "Vault ID is required for vault storage."})
        return attrs


class SellMetalSerializer(serializers.Serializer):
    """Sell metal request serializer"""
    
    portfolio_item_id = serializers.UUIDField()
    amount_oz = serializers.DecimalField(max_digits=10, decimal_places=4, min_value=0.0001)


class ConvertMetalSerializer(serializers.Serializer):
    """Convert metal to cash request serializer"""
    
    portfolio_item_id = serializers.UUIDField()
    amount_oz = serializers.DecimalField(max_digits=10, decimal_places=4, min_value=0.0001)


class ShipmentEventSerializer(serializers.ModelSerializer):
    """Shipment event serializer"""
    
    class Meta:
        model = ShipmentEvent
        fields = ['id', 'status', 'description', 'location', 'timestamp']




class ShipmentWorkflowStageSerializer(serializers.ModelSerializer):
    """Shipment workflow stage serializer"""

    class Meta:
        model = ShipmentWorkflowStage
        fields = [
            'id', 'code', 'name', 'stage_order', 'status', 'requires_customer_action',
            'customer_action_completed', 'customer_action_note', 'customer_action_completed_at',
            'is_blocked', 'blocked_reason', 'blocked_at', 'completed_at', 'created_at', 'updated_at'
        ]
        read_only_fields = fields

class ShipmentSerializer(serializers.ModelSerializer):
    """Shipment serializer"""
    
    events = ShipmentEventSerializer(many=True, read_only=True)
    items_count = serializers.IntegerField(source='items.count', read_only=True)
    workflow_stages = ShipmentWorkflowStageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Shipment
        fields = [
            'id', 'tracking_number', 'carrier', 'status', 
            'destination_address', 'estimated_delivery', 
            'created_at', 'updated_at', 'events', 'items_count', 'workflow_stages'
        ]
        read_only_fields = ['id', 'tracking_number', 'status', 'created_at', 'updated_at']


class DeliveryRequestItemSerializer(serializers.Serializer):
    """Item in a delivery request"""
    portfolio_item_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1)


class DeliveryRequestSerializer(serializers.Serializer):
    """Physical delivery request serializer"""
    
    items = DeliveryRequestItemSerializer(many=True)
    carrier = serializers.ChoiceField(choices=['fedex', 'brinks'])
    destination = serializers.JSONField()  # street, city, zip_code, country
