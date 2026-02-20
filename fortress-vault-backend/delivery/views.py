"""
Delivery views
"""

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db import transaction as db_transaction
from datetime import date, timedelta
import uuid

from .models import DeliveryRequest, DeliveryItem, DeliveryHistory
from trading.models import PortfolioItem
from .serializers import (
    DeliveryRequestSerializer, CreateDeliveryRequestSerializer, DeliveryHistorySerializer
)


class DeliveryViewSet(viewsets.ModelViewSet):
    """Delivery viewset"""
    
    queryset = DeliveryRequest.objects.all()
    serializer_class = DeliveryRequestSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Users can only see their own deliveries"""
        return DeliveryRequest.objects.filter(user=self.request.user).prefetch_related(
            'items', 'history'
        )
    
    def create(self, request):
        """Create delivery request"""
        serializer = CreateDeliveryRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        data = serializer.validated_data
        
        # Verify user has verified address
        if not user.addresses.filter(is_verified=True).exists():
            return Response(
                {'error': 'Verified address required for delivery'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Validate portfolio items belong to user and are vaulted
        portfolio_items = []
        for item_data in data['items']:
            portfolio_item = get_object_or_404(
                PortfolioItem,
                id=item_data['portfolio_item_id'],
                user=user,
                status=PortfolioItem.Status.VAULTED
            )
            portfolio_items.append({
                'item': portfolio_item,
                'quantity': int(item_data['quantity'])
            })
        
        # Create delivery request
        with db_transaction.atomic():
            delivery = DeliveryRequest.objects.create(
                user=user,
                tracking_number=f"PV-{uuid.uuid4().hex[:12].upper()}",
                carrier=data['carrier'],
                destination_address=data['destination_address'],
                estimated_arrival=date.today() + timedelta(days=7),
                status=DeliveryRequest.Status.PROCESSING
            )
            
            # Create delivery items and update portfolio status
            for item_info in portfolio_items:
                DeliveryItem.objects.create(
                    delivery_request=delivery,
                    portfolio_item=item_info['item'],
                    quantity=item_info['quantity']
                )
                
                # Update portfolio item status
                item_info['item'].status = PortfolioItem.Status.IN_TRANSIT
                item_info['item'].save()
            
            # Create initial history entry
            DeliveryHistory.objects.create(
                delivery_request=delivery,
                status='Processing',
                description='Delivery request received and being processed'
            )
        
        return Response(
            DeliveryRequestSerializer(delivery).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['get'])
    def tracking(self, request, pk=None):
        """Get delivery tracking history"""
        delivery = self.get_object()
        history = delivery.history.all()
        serializer = DeliveryHistorySerializer(history, many=True)
        return Response(serializer.data)
