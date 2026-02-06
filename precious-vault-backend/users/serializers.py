"""
User serializers
"""

from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, Address, Wallet


class AddressSerializer(serializers.ModelSerializer):
    """Address serializer"""
    
    class Meta:
        model = Address
        fields = ['id', 'street', 'city', 'state', 'zip_code', 'country', 'is_verified', 'created_at']
        read_only_fields = ['id', 'is_verified', 'created_at']


class WalletSerializer(serializers.ModelSerializer):
    """Wallet serializer"""
    
    class Meta:
        model = Wallet
        fields = ['id', 'cash_balance', 'last_updated']
        read_only_fields = ['id', 'last_updated']


class UserSerializer(serializers.ModelSerializer):
    """User profile serializer"""
    
    addresses = AddressSerializer(many=True, read_only=True)
    wallet = WalletSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name', 
            'phone_number', 'kyc_status', 'two_factor_enabled',
            'preferred_vault', 'addresses', 'wallet', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'kyc_status', 'created_at', 'updated_at']


class UserCreateSerializer(serializers.ModelSerializer):
    """User registration serializer"""
    
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ['email', 'username', 'password', 'password2', 'first_name', 'last_name']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        # Create wallet for new user
        Wallet.objects.create(user=user)
        return user


class KYCSubmissionSerializer(serializers.Serializer):
    """KYC submission serializer"""
    
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    phone_number = serializers.CharField(max_length=20)
    street = serializers.CharField(max_length=255)
    city = serializers.CharField(max_length=100)
    state = serializers.CharField(max_length=100, required=False, allow_blank=True)
    zip_code = serializers.CharField(max_length=20)
    country = serializers.CharField(max_length=100)


class Enable2FASerializer(serializers.Serializer):
    """Enable 2FA serializer"""
    
    enabled = serializers.BooleanField()
