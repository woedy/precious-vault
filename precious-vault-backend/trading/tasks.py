"""
Celery tasks for trading app
"""

from celery import shared_task
from django.utils import timezone
from decimal import Decimal
import random
import logging

from .models import Metal, PortfolioItem

logger = logging.getLogger(__name__)


@shared_task
def update_metal_prices():
    """Update metal prices (simulated for MVP)"""
    try:
        metals = Metal.objects.all()
        
        for metal in metals:
            # Simulate price change (-2% to +2%)
            change_percent = Decimal(str(random.uniform(-0.02, 0.02)))
            new_price = metal.current_price * (1 + change_percent)
            
            # Calculate 24h change
            price_change_24h = ((new_price - metal.current_price) / metal.current_price) * 100
            
            metal.current_price = new_price
            metal.price_change_24h = price_change_24h
            metal.save()
            
            logger.info(f"Updated {metal.symbol} price to ${new_price}")
        
        # Broadcast price updates via WebSocket
        from .consumers import broadcast_price_update
        broadcast_price_update()
        
        return f"Updated {metals.count()} metal prices"
    except Exception as e:
        logger.error(f"Error updating metal prices: {e}")
        raise


@shared_task
def calculate_portfolio_values():
    """Recalculate portfolio values based on current prices"""
    try:
        portfolio_items = PortfolioItem.objects.select_related('metal').all()
        
        for item in portfolio_items:
            current_value = item.weight_oz * item.metal.current_price
            logger.debug(f"Portfolio item {item.id}: {item.weight_oz}oz @ ${item.metal.current_price} = ${current_value}")
        
        return f"Calculated values for {portfolio_items.count()} portfolio items"
    except Exception as e:
        logger.error(f"Error calculating portfolio values: {e}")
        raise


@shared_task
def send_transaction_notification(user_id, transaction_id):
    """Send transaction notification email"""
    try:
        from users.models import User
        from .models import Transaction
        
        user = User.objects.get(id=user_id)
        transaction = Transaction.objects.get(id=transaction_id)
        
        # For MVP, just log the notification
        logger.info(f"Transaction notification for {user.email}: {transaction.transaction_type} - ${transaction.total_value}")
        
        # In production, send actual email here
        # send_mail(...)
        
        return f"Notification sent to {user.email}"
    except Exception as e:
        logger.error(f"Error sending transaction notification: {e}")
        raise
