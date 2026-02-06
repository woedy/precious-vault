"""
Delivery serializers
"""

from rest_framework import serializers
from .models import DeliveryRequest, DeliveryItem, DeliveryHistory


class DeliveryHistorySerializer(serializers.ModelSerializer):
    """Delivery history serializer"""
    
    class Meta:
        model = DeliveryHistory
        fields = ['id', 'status', 'description', 'timestamp']
        read_only_fields = ['id', 'timestamp']


class DeliveryItemSerializer(serializers.ModelSerializer):
    """Delivery item serializer"""
    
    portfolio_item_details = serializers.SerializerMethodField()
    
    class Meta:
        model = DeliveryItem
        fields = ['id', 'portfolio_item', 'portfolio_item_details', 'quantity']
        read_only_fields = ['id']
    
    def get_portfolio_item_details(self, obj):
        """Get portfolio item details"""
        from trading.serializers import PortfolioItemSerializer
        return PortfolioItemSerializer(obj.portfolio_item).data


class DeliveryRequestSerializer(serializers.ModelSerializer):
    """Delivery request serializer"""
    
    items = DeliveryItemSerializer(many=True, read_only=True)
    history = DeliveryHistorySerializer(many=True, read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = DeliveryRequest
        fields = [
            'id', 'user', 'user_email', 'tracking_number', 'carrier',
            'status', 'destination_address', 'estimated_arrival',
            'items', 'history', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'tracking_number', 'created_at']


class CreateDeliveryRequestSerializer(serializers.Serializer):
    """Create delivery request serializer"""
    
    items = serializers.ListField(
        child=serializers.DictField(child=serializers.CharField()),
        min_length=1
    )
    carrier = serializers.ChoiceField(choices=['fedex', 'brinks', 'malca'])
    destination_address = serializers.DictField()
    
    def validate_items(self, value):
        """Validate items structure"""
        for item in value:
            if 'portfolio_item_id' not in item or 'quantity' not in item:
                raise serializers.ValidationError(
                    "Each item must have 'portfolio_item_id' and 'quantity'"
                )
        return value
    
    def validate_destination_address(self, value):
        """Validate address structure"""
        required_fields = ['street', 'city', 'zip_code', 'country']
        for field in required_fields:
            if field not in value:
                raise serializers.ValidationError(f"Address must include '{field}'")
        return value
