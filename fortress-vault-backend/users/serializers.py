"""
User serializers
"""

from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from djoser.serializers import UserCreatePasswordRetypeSerializer as DjoserUserCreateSerializer
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
            'phone_number', 'kyc_status', 'is_email_verified', 'identity_document', 'two_factor_enabled',
            'preferred_vault', 'addresses', 'wallet', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'kyc_status', 'is_email_verified', 'created_at', 'updated_at']

    def update(self, instance, validated_data):
        first_name = validated_data.get('first_name')
        last_name = validated_data.get('last_name')
        phone_number = validated_data.get('phone_number')
        
        if first_name is not None:
            instance.first_name = first_name
        if last_name is not None:
            instance.last_name = last_name
        if phone_number is not None:
            instance.phone_number = phone_number
            
        return super().update(instance, validated_data)


class UserCreateSerializer(DjoserUserCreateSerializer):
    """User registration serializer"""
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    
    class Meta(DjoserUserCreateSerializer.Meta):
        model = User
        fields = tuple(DjoserUserCreateSerializer.Meta.fields) + (
            'first_name',
            'last_name',
        )

    def create(self, validated_data):
        # Extract names ourselves to be 100% sure they aren't lost
        first_name = validated_data.get('first_name', '')
        last_name = validated_data.get('last_name', '')
        
        # Djoser and create_user handle password and username
        user = super().create(validated_data)
        
        # Explicitly update name fields after creation
        user.first_name = first_name
        user.last_name = last_name
        
        # Generate and Send OTP for new registration
        import random
        from django.utils import timezone
        from utils.emails import send_html_email
        
        otp = f"{random.randint(1000, 9999)}"
        user.otp_code = otp
        user.otp_created_at = timezone.now()
        user.save(update_fields=['first_name', 'last_name', 'otp_code', 'otp_created_at'])
        
        # Send OTP email
        send_html_email(
            subject="Welcome to Fortress Vault - Verify Your Email",
            template_name="emails/otp.html",
            context={'user': user, 'otp': otp},
            recipient_list=[user.email]
        )
        
        # Create wallet for new user if it doesn't already exist
        if not hasattr(user, 'wallet'):
            Wallet.objects.create(user=user)
        return user


class KYCSubmissionSerializer(serializers.Serializer):
    """KYC submission serializer"""
    
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    phone_number = serializers.CharField(max_length=20)
    street = serializers.CharField(max_length=255)
    city = serializers.CharField(max_length=100)
    state = serializers.CharField(max_length=100, required=False, allow_blank=True)
    zip_code = serializers.CharField(max_length=20)
    country = serializers.CharField(max_length=100)


class Enable2FASerializer(serializers.Serializer):
    """Enable 2FA serializer"""
    
    enabled = serializers.BooleanField()
