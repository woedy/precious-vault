
import os
import django
import sys
from decimal import Decimal

# Add backend to path
sys.path.append('c:/Dev/precious-vault/precious-vault-backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User, Wallet, Address
from trading.models import Metal, Product, PortfolioItem, Transaction
from trading.serializers import DeliveryRequestSerializer
from rest_framework.test import APIRequestFactory, force_authenticate
from trading.views import TradingViewSet

def verify_delivery_flow():
    # 1. Setup - get or create a test user
    user, created = User.objects.get_or_create(
        email='test_delivery@example.com',
        defaults={'username': 'test_delivery', 'first_name': 'Test', 'last_name': 'Delivery'}
    )
    if created:
        user.set_password('password123')
        user.save()
    
    # Ensure user has enough funds
    wallet, _ = Wallet.objects.get_or_create(user=user)
    wallet.cash_balance = Decimal('10000.00')
    wallet.save()
    
    # Ensure user has a vaulted item
    metal = Metal.objects.first()
    product = Product.objects.filter(metal=metal).first()
    
    # Clear old items to have a clean state
    PortfolioItem.objects.filter(user=user).delete()
    
    item = PortfolioItem.objects.create(
        user=user,
        metal=metal,
        product=product,
        weight_oz=Decimal('1.0'),
        quantity=1,
        status=PortfolioItem.Status.VAULTED,
        purchase_price=metal.current_price
    )
    
    print(f"Created vaulted item: {item.id} ({item.weight_oz}oz {metal.name})")

    # 2. Prepare Delivery Request
    data = {
        'items': [
            {'portfolio_item_id': str(item.id), 'quantity': 1}
        ],
        'carrier': 'fedex',
        'destination': {
            'street': '123 Test St',
            'city': 'Test City',
            'zip_code': '12345',
            'country': 'Test Country'
        }
    }
    
    # 3. Call viewset action
    factory = APIRequestFactory()
    request = factory.post('/trading/trade/request_delivery/', data, format='json')
    force_authenticate(request, user=user)
    
    viewset = TradingViewSet.as_view({'post': 'request_delivery'})
    
    print("Submitting delivery request...")
    response = viewset(request)
    
    if response.status_code == 201:
        print("SUCCESS: Delivery request submitted.")
        
        # 4. Verify side effects
        item.refresh_from_db()
        print(f"New item status: {item.status}")
        
        if item.status == PortfolioItem.Status.IN_TRANSIT:
            print("CORRECT: Item is now 'in_transit'.")
        else:
            print(f"ERROR: Expected 'in_transit', got {item.status}")
            
        # Check transaction
        tx = Transaction.objects.filter(user=user, transaction_type=Transaction.TransactionType.WITHDRAWAL).first()
        if tx:
            print(f"Transaction created: {tx.id}, Type: {tx.transaction_type}, Fees: ${tx.fees}")
        else:
            print("ERROR: Transaction not found.")
            
        # Check wallet
        wallet.refresh_from_db()
        print(f"New wallet balance: ${wallet.cash_balance}")
    else:
        print(f"FAILED: Status {response.status_code}")
        print(response.data)

if __name__ == "__main__":
    verify_delivery_flow()
