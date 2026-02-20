"""
WebSocket consumers for notifications and support
"""

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


class NotificationConsumer(AsyncWebsocketConsumer):
    """Real-time notifications consumer"""
    
    async def connect(self):
        """Handle WebSocket connection"""
        self.user = self.scope['user']
        
        if not self.user.is_authenticated:
            await self.close()
            return
        
        self.room_group_name = f'notifications_{self.user.id}'
        
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
    
    async def notification(self, event):
        """Receive notification from room group"""
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'data': event['data']
        }))


class ChatConsumer(AsyncWebsocketConsumer):
    """Realtime support chat consumer."""

    async def connect(self):
        self.user = self.scope['user']
        self.thread_id = str(self.scope['url_route']['kwargs']['thread_id'])

        if not self.user.is_authenticated:
            await self.close()
            return

        has_access = await self.verify_thread_access()
        if not has_access:
            await self.close()
            return

        self.room_group_name = f'chat_{self.thread_id}'
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': event['message']
        }))

    @database_sync_to_async
    def verify_thread_access(self):
        from .models import ChatThread
        try:
            thread = ChatThread.objects.get(id=self.thread_id)
            return thread.customer_id == self.user.id or self.user.is_staff
        except ChatThread.DoesNotExist:
            return False


def broadcast_chat_message(thread_id, payload):
    channel_layer = get_channel_layer()
    try:
        async_to_sync(channel_layer.group_send)(
            f'chat_{thread_id}',
            {
                'type': 'chat_message',
                'message': payload,
            }
        )
    except Exception:
        # Non-fatal in environments where Redis/Channels are unavailable.
        return
