"""
Admin API serializers
"""

from rest_framework import serializers
from users.models import User, Address, Wallet
from trading.models import Transaction, Shipment, ShipmentEvent, PortfolioItem, Metal, Product
from .models import AdminAction, TransactionNote


# User Management Serializers
class AdminAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = '__all__'


class AdminWalletSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wallet
        fields = '__all__'


class AdminUserListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for user list"""
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'kyc_status', 'is_email_verified', 'two_factor_enabled',
            'is_active', 'created_at', 'last_login'
        ]


class PortfolioItemSerializer(serializers.ModelSerializer):
    """Portfolio item for user details"""
    metal_name = serializers.CharField(source='metal.name', read_only=True)
    metal_symbol = serializers.CharField(source='metal.symbol', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    current_value = serializers.SerializerMethodField()
    
    class Meta:
        model = PortfolioItem
        fields = ['id', 'metal_name', 'metal_symbol', 'product_name', 'weight_oz', 
                  'quantity', 'purchase_price', 'current_value', 'status', 'created_at']
    
    def get_current_value(self, obj):
        """Calculate current value based on current metal price"""
        if obj.metal and obj.metal.current_price:
            return float(obj.weight_oz * obj.metal.current_price * obj.quantity)
        return 0.0


class RecentTransactionSerializer(serializers.ModelSerializer):
    """Recent transaction for user details"""
    metal_name = serializers.CharField(source='metal.name', read_only=True)
    
    class Meta:
        model = Transaction
        fields = ['id', 'transaction_type', 'metal_name', 'amount_oz', 
                  'total_value', 'status', 'created_at']


class AdminUserDetailSerializer(serializers.ModelSerializer):
    """Full user details for admin with data masking"""
    
    addresses = AdminAddressSerializer(many=True, read_only=True)
    wallet_balance = serializers.SerializerMethodField()
    portfolio = serializers.SerializerMethodField()
    recent_transactions = serializers.SerializerMethodField()
    masked_email = serializers.SerializerMethodField()
    masked_phone = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'masked_email', 'username', 'first_name', 'last_name',
            'phone_number', 'masked_phone', 'kyc_status', 'is_active', 
            'is_email_verified', 'two_factor_enabled', 'wallet_balance',
            'portfolio', 'recent_transactions', 'addresses',
            'created_at', 'updated_at', 'last_login'
        ]
    
    def get_wallet_balance(self, obj):
        """Get wallet cash balance"""
        if hasattr(obj, 'wallet'):
            return float(obj.wallet.cash_balance)
        return 0.0
    
    def get_portfolio(self, obj):
        """Get user's portfolio holdings"""
        portfolio_items = obj.portfolio_items.filter(
            status=PortfolioItem.Status.VAULTED
        ).select_related('metal', 'product')[:10]  # Limit to 10 items
        return PortfolioItemSerializer(portfolio_items, many=True).data
    
    def get_recent_transactions(self, obj):
        """Get user's recent transactions"""
        transactions = obj.transactions.select_related('metal').order_by('-created_at')[:10]
        return RecentTransactionSerializer(transactions, many=True).data
    
    def get_masked_email(self, obj):
        """Mask email showing only first 2 chars and domain"""
        if not obj.email:
            return ''
        parts = obj.email.split('@')
        if len(parts) != 2:
            return obj.email
        local = parts[0]
        domain = parts[1]
        if len(local) <= 2:
            masked_local = local[0] + '*'
        else:
            masked_local = local[:2] + '*' * (len(local) - 2)
        return f"{masked_local}@{domain}"
    
    def get_masked_phone(self, obj):
        """Mask phone showing only last 4 digits"""
        if not obj.phone_number:
            return ''
        phone = obj.phone_number
        if len(phone) <= 4:
            return '*' * len(phone)
        return '*' * (len(phone) - 4) + phone[-4:]


# KYC Serializers
class IdentityDocumentSerializer(serializers.Serializer):
    """Identity document details"""
    
    url = serializers.SerializerMethodField()
    name = serializers.SerializerMethodField()
    uploaded_at = serializers.DateTimeField(source='created_at', read_only=True)
    
    def get_url(self, obj):
        if obj.identity_document:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.identity_document.url)
        return None
    
    def get_name(self, obj):
        if obj.identity_document:
            return obj.identity_document.name.split('/')[-1]
        return None


class AdminKYCSerializer(serializers.ModelSerializer):
    """KYC submission details"""
    
    user_email = serializers.EmailField(source='email', read_only=True)
    user_name = serializers.SerializerMethodField()
    documents = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'user_email', 'user_name', 'kyc_status', 
            'documents', 'created_at'
        ]
    
    def get_user_name(self, obj):
        """Get full name or username"""
        full_name = f"{obj.first_name} {obj.last_name}".strip()
        return full_name if full_name else obj.username
    
    def get_documents(self, obj):
        """Get identity documents as list"""
        if obj.identity_document:
            # Create a temporary object to pass to IdentityDocumentSerializer
            doc_serializer = IdentityDocumentSerializer(obj, context=self.context)
            return [doc_serializer.data]
        return []


# Transaction Serializers
class TransactionNoteSerializer(serializers.ModelSerializer):
    admin_email = serializers.CharField(source='admin_user.email', read_only=True)
    
    class Meta:
        model = TransactionNote
        fields = ['id', 'note', 'admin_user', 'admin_email', 'created_at']
        read_only_fields = ['admin_user', 'created_at']


class AdminTransactionSerializer(serializers.ModelSerializer):
    """Transaction with user details"""
    
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    metal_name = serializers.CharField(source='metal.name', read_only=True)
    metal_symbol = serializers.CharField(source='metal.symbol', read_only=True)
    admin_notes = TransactionNoteSerializer(many=True, read_only=True)
    
    class Meta:
        model = Transaction
        fields = '__all__'
    
    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username


# Delivery/Shipment Serializers
class DeliveryHistorySerializer(serializers.ModelSerializer):
    """Delivery history event serializer"""
    
    class Meta:
        model = ShipmentEvent
        fields = ['id', 'status', 'description', 'location', 'timestamp']
        read_only_fields = ['id', 'timestamp']


class DeliveryItemSerializer(serializers.ModelSerializer):
    """Delivery item serializer"""
    
    metal_name = serializers.CharField(source='metal.name', read_only=True)
    metal_symbol = serializers.CharField(source='metal.symbol', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = PortfolioItem
        fields = ['id', 'metal_name', 'metal_symbol', 'product_name', 'weight_oz', 'quantity', 'status']
        read_only_fields = ['id', 'metal_name', 'metal_symbol', 'product_name', 'weight_oz', 'quantity', 'status']


class AdminDeliverySerializer(serializers.ModelSerializer):
    """Admin delivery/shipment serializer with full details"""
    
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    shipping_address = serializers.JSONField(source='destination_address', read_only=True)
    items = DeliveryItemSerializer(many=True, read_only=True)
    history = DeliveryHistorySerializer(source='events', many=True, read_only=True)
    
    class Meta:
        model = Shipment
        fields = [
            'id', 'user', 'user_email', 'user_name', 'status', 'carrier',
            'tracking_number', 'shipping_address', 'items', 'history',
            'estimated_delivery', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']
    
    def get_user_name(self, obj):
        """Get full name or username"""
        full_name = f"{obj.user.first_name} {obj.user.last_name}".strip()
        return full_name if full_name else obj.user.username


# Legacy shipment serializers (kept for backward compatibility)
class ShipmentEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShipmentEvent
        fields = '__all__'


class PortfolioItemSimpleSerializer(serializers.ModelSerializer):
    metal_name = serializers.CharField(source='metal.name', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = PortfolioItem
        fields = ['id', 'metal_name', 'product_name', 'weight_oz', 'quantity', 'status']


class AdminShipmentSerializer(serializers.ModelSerializer):
    """Shipment with full details"""
    
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    items = PortfolioItemSimpleSerializer(many=True, read_only=True)
    events = ShipmentEventSerializer(many=True, read_only=True)
    
    class Meta:
        model = Shipment
        fields = '__all__'
    
    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username


# Product Management Serializers
class AdminMetalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Metal
        fields = '__all__'


class AdminProductSerializer(serializers.ModelSerializer):
    metal_name = serializers.CharField(source='metal.name', read_only=True)
    
    class Meta:
        model = Product
        fields = '__all__'


# Audit Log Serializers
class AdminActionSerializer(serializers.ModelSerializer):
    admin_email = serializers.CharField(source='admin_user.email', read_only=True)
    
    class Meta:
        model = AdminAction
        fields = '__all__'


# Dashboard Serializers
class DashboardMetricsSerializer(serializers.Serializer):
    """Dashboard metrics with trends"""
    
    total_users = serializers.IntegerField()
    active_users_30d = serializers.IntegerField()
    pending_kyc = serializers.IntegerField()
    pending_transactions = serializers.IntegerField()
    active_deliveries = serializers.IntegerField()
    transaction_volume = serializers.DecimalField(max_digits=15, decimal_places=2)
    trends = serializers.DictField()
