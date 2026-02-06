"""
Trading views
"""

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.db import transaction as db_transaction
from decimal import Decimal
from datetime import date, timedelta
import uuid

from .models import Metal, Product, PortfolioItem, Transaction
from vaults.models import Vault
from users.models import Wallet
from .serializers import (
    MetalSerializer, ProductSerializer, PortfolioItemSerializer,
    TransactionSerializer, BuyMetalSerializer, SellMetalSerializer, ConvertMetalSerializer
)


class MetalViewSet(viewsets.ReadOnlyModelViewSet):
    """Metal viewset - read only"""
    
    queryset = Metal.objects.all()
    serializer_class = MetalSerializer
    permission_classes = [AllowAny]


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """Product viewset - read only"""
    
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]


class PortfolioViewSet(viewsets.ReadOnlyModelViewSet):
    """Portfolio viewset"""
    
    queryset = PortfolioItem.objects.all()
    serializer_class = PortfolioItemSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Users can only see their own portfolio"""
        return PortfolioItem.objects.filter(user=self.request.user).select_related(
            'metal', 'product', 'vault_location'
        )
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Get dashboard data"""
        user = request.user
        portfolio_items = self.get_queryset()
        
        # Calculate total portfolio value
        total_value = sum(
            float(item.weight_oz * item.metal.current_price)
            for item in portfolio_items
        )
        
        # Get holdings by metal
        holdings = {}
        for item in portfolio_items:
            metal_symbol = item.metal.symbol
            if metal_symbol not in holdings:
                holdings[metal_symbol] = {
                    'metal': MetalSerializer(item.metal).data,
                    'total_oz': 0,
                    'total_value': 0
                }
            holdings[metal_symbol]['total_oz'] += float(item.weight_oz)
            holdings[metal_symbol]['total_value'] += float(item.weight_oz * item.metal.current_price)
        
        # Safely get cash balance
        wallet = getattr(user, 'wallet', None)
        cash_balance = float(wallet.cash_balance) if wallet else 0.0
        
        return Response({
            'total_value': total_value,
            'cash_balance': cash_balance,
            'holdings': list(holdings.values()),
            'portfolio_items': PortfolioItemSerializer(portfolio_items, many=True).data
        })



class TransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """Transaction viewset"""
    
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Users can only see their own transactions"""
        return Transaction.objects.filter(user=self.request.user).select_related('metal')


class TradingViewSet(viewsets.ViewSet):
    """Trading operations viewset"""
    
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def buy(self, request):
        """Buy precious metals"""
        serializer = BuyMetalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        data = serializer.validated_data
        
        # Check KYC
        if user.kyc_status != 'verified':
            return Response(
                {'error': 'KYC verification required before purchasing'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get product
        product = get_object_or_404(Product, id=data['product_id'], is_active=True)
        quantity = data['quantity']
        
        # Calculate costs
        spot_price = product.metal.current_price
        total_weight = product.weight_oz * quantity
        spot_cost = total_weight * spot_price
        premium_cost = total_weight * product.premium_per_oz
        total_cost = spot_cost + premium_cost
        
        # Check wallet balance
        if user.wallet.cash_balance < total_cost:
            return Response(
                {'error': 'Insufficient funds'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Process purchase
        with db_transaction.atomic():
            # Deduct from wallet
            user.wallet.cash_balance -= Decimal(str(total_cost))
            user.wallet.save()
            
            # Create portfolio item
            vault_location = None
            item_status = PortfolioItem.Status.DELIVERED
            
            if data['delivery_method'] == 'vault':
                vault_location = get_object_or_404(Vault, id=data['vault_id'])
                item_status = PortfolioItem.Status.VAULTED
            
            portfolio_item = PortfolioItem.objects.create(
                user=user,
                metal=product.metal,
                product=product,
                weight_oz=total_weight,
                quantity=quantity,
                vault_location=vault_location,
                purchase_price=spot_price,
                status=item_status
            )
            
            # Create transaction
            transaction = Transaction.objects.create(
                user=user,
                transaction_type=Transaction.TransactionType.BUY,
                metal=product.metal,
                amount_oz=total_weight,
                price_per_oz=spot_price,
                total_value=total_cost,
                fees=premium_cost,
                status=Transaction.Status.COMPLETED
            )
        
        return Response({
            'message': 'Purchase successful',
            'transaction': TransactionSerializer(transaction).data,
            'portfolio_item': PortfolioItemSerializer(portfolio_item).data
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'])
    def sell(self, request):
        """Sell precious metals"""
        serializer = SellMetalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        data = serializer.validated_data
        
        # Get portfolio item
        portfolio_item = get_object_or_404(
            PortfolioItem,
            id=data['portfolio_item_id'],
            user=user,
            status=PortfolioItem.Status.VAULTED
        )
        
        amount_oz = data['amount_oz']
        
        # Validate amount
        if amount_oz > portfolio_item.weight_oz:
            return Response(
                {'error': 'Insufficient holdings'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calculate proceeds (0.5% fee)
        current_price = portfolio_item.metal.current_price
        gross_value = amount_oz * current_price
        fee = gross_value * Decimal('0.005')
        net_proceeds = gross_value - fee
        
        # Process sale
        with db_transaction.atomic():
            # Add to wallet
            user.wallet.cash_balance += net_proceeds
            user.wallet.save()
            
            # Update portfolio item
            portfolio_item.weight_oz -= amount_oz
            if portfolio_item.weight_oz == 0:
                portfolio_item.delete()
            else:
                portfolio_item.save()
            
            # Create transaction
            transaction = Transaction.objects.create(
                user=user,
                transaction_type=Transaction.TransactionType.SELL,
                metal=portfolio_item.metal,
                amount_oz=amount_oz,
                price_per_oz=current_price,
                total_value=gross_value,
                fees=fee,
                status=Transaction.Status.COMPLETED
            )
        
        return Response({
            'message': 'Sale successful',
            'transaction': TransactionSerializer(transaction).data,
            'proceeds': float(net_proceeds)
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'])
    def convert(self, request):
        """Convert metals to cash"""
        serializer = ConvertMetalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        data = serializer.validated_data
        
        # Get portfolio item
        portfolio_item = get_object_or_404(
            PortfolioItem,
            id=data['portfolio_item_id'],
            user=user,
            status=PortfolioItem.Status.VAULTED
        )
        
        amount_oz = data['amount_oz']
        
        # Validate amount
        if amount_oz > portfolio_item.weight_oz:
            return Response(
                {'error': 'Insufficient holdings'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calculate proceeds (2% fee)
        current_price = portfolio_item.metal.current_price
        gross_value = amount_oz * current_price
        fee = gross_value * Decimal('0.02')
        net_proceeds = gross_value - fee
        
        # Process conversion
        with db_transaction.atomic():
            # Add to wallet
            user.wallet.cash_balance += net_proceeds
            user.wallet.save()
            
            # Update portfolio item
            portfolio_item.weight_oz -= amount_oz
            if portfolio_item.weight_oz == 0:
                portfolio_item.delete()
            else:
                portfolio_item.save()
            
            # Create transaction
            transaction = Transaction.objects.create(
                user=user,
                transaction_type=Transaction.TransactionType.CONVERT,
                metal=portfolio_item.metal,
                amount_oz=amount_oz,
                price_per_oz=current_price,
                total_value=gross_value,
                fees=fee,
                status=Transaction.Status.COMPLETED
            )
        
        return Response({
            'message': 'Conversion successful',
            'transaction': TransactionSerializer(transaction).data,
            'cash_received': float(net_proceeds)
        }, status=status.HTTP_200_OK)
