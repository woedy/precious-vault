"""
Celery tasks for trading app
"""

from celery import shared_task
from django.conf import settings
from decimal import Decimal, InvalidOperation
import random
import logging
import requests

from django.core.cache import cache

from .models import Metal, PortfolioItem

logger = logging.getLogger(__name__)


@shared_task
def update_metal_prices():
    """Update metal prices.

    If METAL_PRICE_API_KEY is configured, fetch real spot prices.
    Otherwise fall back to simulated price changes.
    """
    try:
        fx_rate_usd_to_gbp = _fetch_usd_to_gbp_rate()
        if fx_rate_usd_to_gbp is not None:
            cache.set('fx:usd_to_gbp', str(fx_rate_usd_to_gbp), timeout=60 * 60 * 6)

        if getattr(settings, 'METAL_PRICE_API_KEY', '') or getattr(settings, 'FX_API_KEY', ''):
            updated = _update_metal_prices_from_api()
            if updated:
                from .consumers import broadcast_price_update
                broadcast_price_update()
                return f"Updated {updated} metal prices"

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


def _fetch_usd_to_gbp_rate():
    try:
        base_url = getattr(settings, 'FX_BASE_URL', 'https://api.exchangerate.host').rstrip('/')
        url = f"{base_url}/latest"
        params = {
            'base': 'USD',
            'symbols': 'GBP',
        }

        api_key = getattr(settings, 'FX_API_KEY', '')
        if api_key:
            params['access_key'] = api_key

        res = requests.get(url, params=params, timeout=15)
        res.raise_for_status()
        data = res.json()

        rate = None
        if isinstance(data, dict):
            rates = data.get('rates')
            if isinstance(rates, dict):
                rate = rates.get('GBP')

        if rate is None:
            return None

        return Decimal(str(rate))
    except Exception as e:
        logger.warning(f"Failed to fetch FX USD->GBP rate: {e}")
        return None


def _update_metal_prices_from_api():
    """Fetch and update metals using configured live pricing provider."""
    provider = getattr(settings, 'METAL_PRICE_API_PROVIDER', 'metalsapi').lower().strip()

    if provider == 'exchangerate_host' or (not getattr(settings, 'METAL_PRICE_API_KEY', '') and getattr(settings, 'FX_API_KEY', '')):
        prices = _fetch_metal_prices_from_exchangerate_host()
    else:
        prices = _fetch_metal_prices_from_metals_api()

    if not prices:
        return 0

    trading_symbol_map = {
        'Au': 'XAU',
        'Ag': 'XAG',
        'Pt': 'XPT',
        'Pd': 'XPD',
    }

    updated = 0
    for metal in Metal.objects.all():
        api_symbol = trading_symbol_map.get(metal.symbol)
        if not api_symbol:
            continue

        new_price = prices.get(api_symbol)
        if new_price is None:
            continue

        old_price = metal.current_price

        if old_price and old_price != 0:
            price_change_24h = ((new_price - old_price) / old_price) * 100
        else:
            price_change_24h = Decimal('0')

        metal.current_price = new_price
        metal.price_change_24h = price_change_24h
        metal.save(update_fields=['current_price', 'price_change_24h', 'last_updated'])
        updated += 1
        logger.info(f"Updated {metal.symbol} price to ${new_price}")

    return updated


def _fetch_metal_prices_from_metals_api():
    """Fetch USD per oz from metals-api.com style endpoint."""
    api_key = getattr(settings, 'METAL_PRICE_API_KEY', '')
    if not api_key:
        return {}

    base_url = getattr(settings, 'METAL_PRICE_API_URL', 'https://metals-api.com/api/latest').strip() or 'https://metals-api.com/api/latest'
    params = {
        'access_key': api_key,
        'base': 'USD',
        'symbols': 'XAU,XAG,XPT,XPD',
    }

    res = requests.get(base_url, params=params, timeout=20)
    res.raise_for_status()
    data = res.json()

    if not isinstance(data, dict) or not data.get('success', True):
        raise ValueError(f"Metal price API returned error: {data}")

    rates = data.get('rates')
    if not isinstance(rates, dict):
        raise ValueError('Metal price API missing rates')

    symbol_to_price_usd_per_oz = {}
    for symbol in ['XAU', 'XAG', 'XPT', 'XPD']:
        v = rates.get(symbol)
        if v is None:
            continue
        try:
            dec = Decimal(str(v))
        except (InvalidOperation, TypeError):
            continue
        if dec == 0:
            continue
        symbol_to_price_usd_per_oz[symbol] = (Decimal('1') / dec)

    return symbol_to_price_usd_per_oz


def _fetch_metal_prices_from_exchangerate_host():
    """Fetch USD per oz from exchangerate.host /live format.

    Expected response contains quotes such as:
      USDXAU, USDXAG, USDXPT, USDXPD
    where each value is ounces per USD, so we invert to get USD per ounce.
    """
    api_key = getattr(settings, 'FX_API_KEY', '')
    if not api_key:
        return {}

    base_url = getattr(settings, 'FX_BASE_URL', 'https://api.exchangerate.host').rstrip('/')
    url = f"{base_url}/live"
    params = {
        'source': 'USD',
        'currencies': 'XAU,XAG,XPT,XPD',
        'access_key': api_key,
    }

    res = requests.get(url, params=params, timeout=20)
    res.raise_for_status()
    data = res.json()

    if not isinstance(data, dict):
        raise ValueError('FX API returned non-JSON response')

    if data.get('success') is False:
        raise ValueError(f"FX API returned error: {data}")

    quotes = data.get('quotes') or {}
    if not isinstance(quotes, dict):
        raise ValueError('FX API missing quotes object')

    symbol_to_price_usd_per_oz = {}
    for symbol in ['XAU', 'XAG', 'XPT', 'XPD']:
        raw = quotes.get(f'USD{symbol}')
        if raw is None:
            continue
        try:
            dec = Decimal(str(raw))
        except (InvalidOperation, TypeError):
            continue
        if dec == 0:
            continue
        symbol_to_price_usd_per_oz[symbol] = (Decimal('1') / dec)

    return symbol_to_price_usd_per_oz


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
