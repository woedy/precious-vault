"""
Delivery tasks
"""

from celery import shared_task
import logging

logger = logging.getLogger(__name__)


@shared_task
def update_delivery_status(delivery_id, status, description):
    """Update delivery status and broadcast to WebSocket"""
    try:
        from delivery.models import DeliveryRequest, DeliveryHistory
        from asgiref.sync import async_to_sync
        from channels.layers import get_channel_layer
        
        delivery = DeliveryRequest.objects.get(id=delivery_id)
        delivery.status = status
        delivery.save()
        
        # Create history entry
        DeliveryHistory.objects.create(
            delivery_request=delivery,
            status=status,
            description=description
        )
        
        # Broadcast to WebSocket
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'delivery_{delivery_id}',
            {
                'type': 'delivery_update',
                'data': {
                    'status': status,
                    'description': description
                }
            }
        )
        
        logger.info(f"Updated delivery {delivery.tracking_number} to {status}")
        return f"Delivery {delivery.tracking_number} updated"
    except Exception as e:
        logger.error(f"Error updating delivery status: {e}")
        raise
