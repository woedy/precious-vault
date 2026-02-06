"""
WebSocket consumers for real-time updates
"""

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


class PriceConsumer(AsyncWebsocketConsumer):
    """Real-time metal price updates"""
    
    async def connect(self):
        """Handle WebSocket connection"""
        self.room_group_name = 'metal_prices'
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Send current prices on connect
        prices = await self.get_current_prices()
        await self.send(text_data=json.dumps({
            'type': 'price_update',
            'prices': prices
        }))
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def price_update(self, event):
        """Receive price update from room group"""
        await self.send(text_data=json.dumps({
            'type': 'price_update',
            'prices': event['prices']
        }))
    
    @database_sync_to_async
    def get_current_prices(self):
        """Get current metal prices from database"""
        from trading.models import Metal
        from trading.serializers import MetalSerializer
        
        metals = Metal.objects.all()
        return MetalSerializer(metals, many=True).data


class PortfolioConsumer(AsyncWebsocketConsumer):
    """Real-time portfolio updates"""
    
    async def connect(self):
        """Handle WebSocket connection"""
        self.user = self.scope['user']
        
        if not self.user.is_authenticated:
            await self.close()
            return
        
        self.room_group_name = f'portfolio_{self.user.id}'
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
    
    async def portfolio_update(self, event):
        """Receive portfolio update from room group"""
        await self.send(text_data=json.dumps({
            'type': 'portfolio_update',
            'data': event['data']
        }))


class DeliveryConsumer(AsyncWebsocketConsumer):
    """Real-time delivery tracking updates"""
    
    async def connect(self):
        """Handle WebSocket connection"""
        self.user = self.scope['user']
        self.delivery_id = self.scope['url_route']['kwargs']['delivery_id']
        
        if not self.user.is_authenticated:
            await self.close()
            return
        
        # Verify user owns this delivery
        has_access = await self.verify_delivery_access()
        if not has_access:
            await self.close()
            return
        
        self.room_group_name = f'delivery_{self.delivery_id}'
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
    
    async def delivery_update(self, event):
        """Receive delivery update from room group"""
        await self.send(text_data=json.dumps({
            'type': 'delivery_update',
            'data': event['data']
        }))
    
    @database_sync_to_async
    def verify_delivery_access(self):
        """Verify user has access to this delivery"""
        from delivery.models import DeliveryRequest
        
        try:
            DeliveryRequest.objects.get(id=self.delivery_id, user=self.user)
            return True
        except DeliveryRequest.DoesNotExist:
            return False


# Helper function to broadcast price updates
def broadcast_price_update():
    """Broadcast price update to all connected clients"""
    from trading.models import Metal
    from trading.serializers import MetalSerializer
    
    channel_layer = get_channel_layer()
    metals = Metal.objects.all()
    prices = MetalSerializer(metals, many=True).data
    
    async_to_sync(channel_layer.group_send)(
        'metal_prices',
        {
            'type': 'price_update',
            'prices': prices
        }
    )
