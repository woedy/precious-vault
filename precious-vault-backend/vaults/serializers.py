"""
Vault serializers
"""

from rest_framework import serializers
from .models import Vault


class VaultSerializer(serializers.ModelSerializer):
    """Vault serializer"""
    
    class Meta:
        model = Vault
        fields = [
            'id', 'name', 'city', 'country', 'flag_emoji',
            'storage_fee_percent', 'is_allocated', 'is_insured',
            'capacity_percent', 'status', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
