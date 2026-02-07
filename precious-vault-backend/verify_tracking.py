
import os
import django
import sys
from decimal import Decimal
from django.utils import timezone

# Add backend to path
sys.path.append('c:/Dev/precious-vault/precious-vault-backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User, Wallet
from trading.models import Metal, Product, PortfolioItem, Shipment, ShipmentEvent
from rest_framework.test import APIRequestFactory, force_authenticate
from trading.views import TradingViewSet, ShipmentViewSet

def verify_tracking_flow():
    # 1. Setup user
    user, _ = User.objects.get_or_create(
        email='test_tracking@example.com',
        defaults={'username': 'test_tracking', 'first_name': 'Track', 'last_name': 'Test'}
    )
    
    # Ensure user has enough funds
    wallet, _ = Wallet.objects.get_or_create(user=user)
    wallet.cash_balance = Decimal('10000.00')
    wallet.save()
    
    # 2. Create item
    metal = Metal.objects.first()
    product = Product.objects.filter(metal=metal).first()
    item = PortfolioItem.objects.create(
        user=user,
        metal=metal,
        product=product,
        weight_oz=Decimal('1.0'),
        quantity=1,
        status=PortfolioItem.Status.VAULTED,
        purchase_price=metal.current_price
    )
    
    # 3. Request delivery
    data = {
        'items': [{'portfolio_item_id': str(item.id), 'quantity': 1}],
        'carrier': 'fedex',
        'destination': {'street': '456 Track Rd', 'city': 'Tracktown', 'zip_code': '54321', 'country': 'Trackland'}
    }
    
    factory = APIRequestFactory()
    request = factory.post('/trading/trade/request_delivery/', data, format='json')
    force_authenticate(request, user=user)
    
    viewset = TradingViewSet.as_view({'post': 'request_delivery'})
    print("Requesting delivery...")
    response = viewset(request)
    
    if response.status_code == 201:
        shipment_id = response.data['shipment']['id']
        print(f"SUCCESS: Shipment created: {shipment_id}")
        
        # 4. Add more events manually to simulate logistics progress
        shipment = Shipment.objects.get(id=shipment_id)
        
        # Update tracking number
        shipment.tracking_number = f"TRK{timezone.now().strftime('%Y%m%d%H%M%S')}"
        shipment.status = Shipment.Status.SHIPPED
        shipment.save()
        
        print(f"Added tracking number: {shipment.tracking_number}")
        
        ShipmentEvent.objects.create(
            shipment=shipment,
            status=Shipment.Status.SHIPPED,
            description="Package has been picked up from the vault and is in transit to the sorting center.",
            location="Zurich Hub"
        )
        
        ShipmentEvent.objects.create(
            shipment=shipment,
            status=Shipment.Status.IN_TRANSIT,
            description="Package is currently in transit between international hubs.",
            location="London Heathrow"
        )
        
        # 5. Verify tracking endpoint
        request = factory.get('/trading/shipments/')
        force_authenticate(request, user=user)
        viewset_shipments = ShipmentViewSet.as_view({'get': 'list'})
        
        print("Checking tracking endpoint...")
        response = viewset_shipments(request)
        
        if response.status_code == 200:
            shipments = response.data
            print(f"Retrieved {len(shipments)} shipments.")
            latest = shipments[0]
            print(f"Latest status: {latest['status']}")
            print(f"Events count: {len(latest['events'])}")
            
            for event in latest['events']:
                print(f"  - [{event['status']}] {event['description']} ({event['location']})")
        else:
            print(f"FAILED to list shipments: {response.status_code}")
    else:
        print(f"FAILED to create shipment: {response.status_code}")
        print(response.data)

if __name__ == "__main__":
    verify_tracking_flow()
