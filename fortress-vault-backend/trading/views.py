"""
Trading views
"""

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.db import transaction as db_transaction
from decimal import Decimal, InvalidOperation
from datetime import date, timedelta
from django.utils import timezone
import uuid

from django.core.cache import cache

from .models import Metal, Product, PortfolioItem, Transaction, Shipment, ShipmentEvent, ShipmentWorkflowStage
from vaults.models import Vault
from users.models import Wallet
from admin_api.models import PlatformSettings
from .serializers import (
    MetalSerializer, ProductSerializer, PortfolioItemSerializer,
    TransactionSerializer, BuyMetalSerializer, SellMetalSerializer, ConvertMetalSerializer,
    DeliveryRequestSerializer, ShipmentSerializer
)


class MetalViewSet(viewsets.ReadOnlyModelViewSet):
    """Metal viewset - read only"""
    
    queryset = Metal.objects.all()
    serializer_class = MetalSerializer
    permission_classes = [AllowAny]


class ShipmentViewSet(viewsets.ReadOnlyModelViewSet):
    """Shipment viewset for users"""

    serializer_class = ShipmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Users can only see their own shipments"""
        return Shipment.objects.filter(user=self.request.user).prefetch_related('events', 'items', 'workflow_stages')

    def _get_in_progress_stage(self, shipment):
        return shipment.workflow_stages.filter(status=ShipmentWorkflowStage.StageStatus.IN_PROGRESS).order_by('stage_order').first()

    @action(detail=True, methods=['get'])
    def workflow(self, request, pk=None):
        shipment = get_object_or_404(self.get_queryset(), pk=pk)
        stages = shipment.workflow_stages.all().order_by('stage_order')
        active_stage = self._get_in_progress_stage(shipment)

        return Response({
            'shipment_id': str(shipment.id),
            'status': shipment.status,
            'active_stage': {
                'id': str(active_stage.id),
                'code': active_stage.code,
                'name': active_stage.name,
                'is_blocked': active_stage.is_blocked,
                'requires_customer_action': active_stage.requires_customer_action,
                'customer_action_completed': active_stage.customer_action_completed,
            } if active_stage else None,
            'stages': ShipmentSerializer(shipment).data['workflow_stages']
        })

    @action(detail=True, methods=['post'])
    def complete_stage_action(self, request, pk=None):
        shipment = get_object_or_404(self.get_queryset(), pk=pk)
        active_stage = self._get_in_progress_stage(shipment)

        if not active_stage:
            return Response({'error': 'No active workflow stage to update'}, status=status.HTTP_400_BAD_REQUEST)

        if active_stage.is_blocked:
            return Response({'error': 'This stage is blocked by admin and cannot be progressed'}, status=status.HTTP_400_BAD_REQUEST)

        if not active_stage.requires_customer_action:
            return Response({'error': 'Active stage does not require customer action'}, status=status.HTTP_400_BAD_REQUEST)

        action_note = request.data.get('action_note', '').strip()
        if not action_note:
            return Response({'error': 'action_note is required to complete this stage'}, status=status.HTTP_400_BAD_REQUEST)

        with db_transaction.atomic():
            active_stage.customer_action_completed = True
            active_stage.customer_action_note = action_note
            active_stage.customer_action_completed_at = timezone.now()
            active_stage.status = ShipmentWorkflowStage.StageStatus.COMPLETED
            active_stage.completed_at = timezone.now()
            active_stage.save()

            ShipmentEvent.objects.create(
                shipment=shipment,
                status=shipment.status,
                description=f"Customer completed stage '{active_stage.name}': {action_note}",
                location='Customer Portal'
            )

            next_stage = shipment.workflow_stages.filter(stage_order__gt=active_stage.stage_order).order_by('stage_order').first()
            if next_stage:
                next_stage.status = ShipmentWorkflowStage.StageStatus.IN_PROGRESS
                next_stage.save(update_fields=['status', 'updated_at'])

        return Response({'message': 'Stage action submitted successfully', 'shipment': ShipmentSerializer(shipment).data})


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """Product viewset - read only"""
    
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]


class PlatformSettingsPublicView(viewsets.ViewSet):
    permission_classes = [AllowAny]

    @action(detail=False, methods=['get'])
    def retrieve(self, request):
        obj = PlatformSettings.get_solo()
        return Response({'metals_buying_enabled': obj.metals_buying_enabled, 'metals_selling_enabled': obj.metals_selling_enabled, 'metals_convert_enabled': obj.metals_convert_enabled})


class MetalPricesPublicView(viewsets.ViewSet):
    permission_classes = [AllowAny]

    @action(detail=False, methods=['get'])
    def retrieve(self, request):
        fx_rate = cache.get('fx:usd_to_gbp')
        fx_rate_decimal = None
        if fx_rate is not None:
            try:
                fx_rate_decimal = Decimal(str(fx_rate))
            except Exception:
                fx_rate_decimal = None

        metals = Metal.objects.all().order_by('symbol')
        items = []
        for metal in metals:
            usd = metal.current_price
            gbp = None
            if fx_rate_decimal is not None:
                gbp = (usd * fx_rate_decimal)

            items.append({
                'id': str(metal.id),
                'name': metal.name,
                'symbol': metal.symbol,
                'image_url': MetalSerializer.get_image_url_for_symbol(metal.symbol),
                'price_usd_per_oz': float(usd),
                'price_gbp_per_oz': float(gbp) if gbp is not None else None,
                'last_updated': metal.last_updated,
            })

        return Response({
            'fx': {
                'usd_to_gbp': float(fx_rate_decimal) if fx_rate_decimal is not None else None,
            },
            'metals': items,
            'count': len(items),
        })


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



    @action(detail=False, methods=['get'])
    def outstanding_debts(self, request):
        """Summarize unpaid storage and tax debt transactions."""
        debt_types = [Transaction.TransactionType.STORAGE_FEE, Transaction.TransactionType.TAX]
        debts_qs = Transaction.objects.filter(
            user=request.user,
            status=Transaction.Status.PENDING,
            transaction_type__in=debt_types,
        ).order_by('created_at')

        total_due = sum((tx.total_value + tx.fees) for tx in debts_qs)

        return Response({
            'count': debts_qs.count(),
            'total_due': float(total_due),
            'currency': 'USD',
            'items': TransactionSerializer(debts_qs, many=True).data,
        })

    @action(detail=False, methods=['post'])
    def settle_outstanding_debts(self, request):
        """Settle all pending storage/tax debts if cash balance is sufficient."""
        user = request.user
        wallet, _ = Wallet.objects.get_or_create(user=user)
        debt_types = [Transaction.TransactionType.STORAGE_FEE, Transaction.TransactionType.TAX]
        debts_qs = Transaction.objects.filter(
            user=user,
            status=Transaction.Status.PENDING,
            transaction_type__in=debt_types,
        ).order_by('created_at')

        debts = list(debts_qs)
        if not debts:
            return Response({'message': 'No outstanding debts found', 'settled_count': 0, 'remaining_balance': float(wallet.cash_balance)})

        total_due = sum((tx.total_value + tx.fees) for tx in debts)

        if wallet.cash_balance < total_due:
            return Response(
                {
                    'error': 'Insufficient cash balance to settle outstanding debts',
                    'total_due': float(total_due),
                    'cash_balance': float(wallet.cash_balance),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        with db_transaction.atomic():
            wallet.cash_balance -= total_due
            wallet.save(update_fields=['cash_balance'])
            Transaction.objects.filter(id__in=[tx.id for tx in debts]).update(status=Transaction.Status.COMPLETED)
            settlement_tx = Transaction.objects.create(
                user=user,
                transaction_type=Transaction.TransactionType.WITHDRAWAL,
                total_value=total_due,
                fees=Decimal('0.00'),
                status=Transaction.Status.COMPLETED,
            )

        return Response({
            'message': 'Outstanding debts settled successfully',
            'settled_count': len(debts),
            'total_paid': float(total_due),
            'remaining_balance': float(wallet.cash_balance),
            'settlement_transaction': TransactionSerializer(settlement_tx).data,
        })

class TradingViewSet(viewsets.ViewSet):
    """Trading operations viewset"""
    
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def buy(self, request):
        """Buy precious metals"""
        settings_obj = PlatformSettings.get_solo()
        if not settings_obj.metals_buying_enabled:
            return Response(
                {'error': 'Purchasing is temporarily unavailable. Please contact an administrator.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

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
        
        # Check wallet existence
        if not hasattr(user, 'wallet'):
            return Response(
                {'error': 'User wallet not found. Please contact support.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check wallet balance
        if user.wallet.cash_balance < total_cost:
            return Response(
                {'error': 'Insufficient funds in your cash balance. Please deposit funds before purchasing.'},
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
        settings_obj = PlatformSettings.get_solo()
        if not settings_obj.metals_selling_enabled:
            return Response(
                {'error': 'Selling is temporarily unavailable. Please try again later or contact support.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

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
        settings_obj = PlatformSettings.get_solo()
        if not settings_obj.metals_convert_enabled:
            return Response(
                {'error': 'Converting to cash is temporarily unavailable. Please contact an administrator.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

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

    @action(detail=False, methods=['post'])
    def deposit(self, request):
        """Deposit funds into wallet"""
        amount = request.data.get('amount')
        if not amount:
            return Response({'error': 'Amount is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            amount_decimal = Decimal(str(amount))
            if amount_decimal <= 0:
                return Response({'error': 'Amount must be positive'}, status=status.HTTP_400_BAD_REQUEST)
        except (ValueError, TypeError, InvalidOperation):
            return Response({'error': 'Invalid amount format'}, status=status.HTTP_400_BAD_REQUEST)
        
        user = request.user
        
        with db_transaction.atomic():
            # Add to wallet
            if not hasattr(user, 'wallet'):
                Wallet.objects.create(user=user)
            
            user.wallet.cash_balance += amount_decimal
            user.wallet.save()
            
            # Create transaction
            transaction = Transaction.objects.create(
                user=user,
                transaction_type=Transaction.TransactionType.DEPOSIT,
                total_value=amount_decimal,
                status=Transaction.Status.COMPLETED
            )
            
        return Response({
            'message': 'Deposit successful',
            'transaction': TransactionSerializer(transaction).data,
            'new_balance': float(user.wallet.cash_balance)
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def request_delivery(self, request):
        """Request physical delivery of vaulted items"""
        serializer = DeliveryRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        data = serializer.validated_data
        
        with db_transaction.atomic():
            total_oz = Decimal('0')
            total_value = Decimal('0')
            primary_metal = None
            
            for item_data in data['items']:
                portfolio_item = get_object_or_404(
                    PortfolioItem,
                    id=item_data['portfolio_item_id'],
                    user=user,
                    status=PortfolioItem.Status.VAULTED
                )
                
                # Check quantity
                if item_data['quantity'] > portfolio_item.quantity:
                    return Response(
                        {'error': f'Insufficient quantity for item {portfolio_item.id}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Update item status
                # If partial delivery, we might need to split the item, but for now we assume full item withdrawal
                # based on the frontend logic where you select "items" (which are PortfolioItems)
                portfolio_item.status = PortfolioItem.Status.IN_TRANSIT
                portfolio_item.save()
                
                total_oz += portfolio_item.weight_oz
                total_value += portfolio_item.weight_oz * portfolio_item.metal.current_price
                if not primary_metal:
                    primary_metal = portfolio_item.metal

            # Calculate fees (approximation based on frontend)
            handling_fee = Decimal(str(len(data['items']) * 50))
            shipping_fee = Decimal('500' if data['carrier'] == 'brinks' else '150')
            insurance_fee = total_value * Decimal('0.01')
            total_fees = handling_fee + shipping_fee + insurance_fee
            
            # Note: In a real system we would deduct these fees from the wallet, 
            # but for now we'll just record them in the transaction.
            if user.wallet.cash_balance < total_fees:
                 return Response(
                    {'error': f'Insufficient funds to cover delivery fees (${total_fees:,.2f})'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            user.wallet.cash_balance -= total_fees
            user.wallet.save()

            # Create transaction
            transaction = Transaction.objects.create(
                user=user,
                transaction_type=Transaction.TransactionType.WITHDRAWAL,
                metal=primary_metal,
                amount_oz=total_oz,
                total_value=total_value + total_fees,
                fees=total_fees,
                status=Transaction.Status.COMPLETED
            )
            
            # Create Shipment
            shipment = Shipment.objects.create(
                user=user,
                carrier=data['carrier'],
                destination_address=data['destination'],
                status=Shipment.Status.REQUESTED
            )
            shipment.initialize_workflow()
            
            # Link items to shipment
            for item_data in data['items']:
                PortfolioItem.objects.filter(id=item_data['portfolio_item_id']).update(shipment=shipment)
            
            # Create initial event
            ShipmentEvent.objects.create(
                shipment=shipment,
                status=Shipment.Status.REQUESTED,
                description="Physical delivery request received and processing initiated.",
                location="Main Vault"
            )
            
        return Response({
            'message': 'Delivery request submitted successfully',
            'transaction': TransactionSerializer(transaction).data,
            'shipment': ShipmentSerializer(shipment).data
        }, status=status.HTTP_201_CREATED)
