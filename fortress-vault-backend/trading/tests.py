from decimal import Decimal

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from users.models import User
from .models import Metal, Shipment, Transaction


class ShipmentWorkflowViewSetTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='customer@test.com',
            username='customer',
            password='testpass123'
        )
        self.shipment = Shipment.objects.create(
            user=self.user,
            carrier='fedex',
            status=Shipment.Status.REQUESTED,
            destination_address={'street': '123 Main St'}
        )
        self.shipment.initialize_workflow()

    def test_customer_can_view_workflow(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get(f'/api/trading/shipments/{self.shipment.id}/workflow/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('stages', response.data)
        self.assertEqual(len(response.data['stages']), 8)

    def test_customer_cannot_complete_non_action_stage(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            f'/api/trading/shipments/{self.shipment.id}/complete_stage_action/',
            {'action_note': 'All good'}
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('does not require customer action', response.data['error'])


class TransactionActivityFeedTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='activity@test.com',
            username='activity_user',
            password='testpass123'
        )
        self.other_user = User.objects.create_user(
            email='other@test.com',
            username='other_user',
            password='testpass123'
        )
        self.metal = Metal.objects.create(
            name='Gold',
            symbol='XAU',
            current_price=Decimal('2300.00'),
            price_change_24h=Decimal('0.00')
        )

    def test_user_activity_transactions_include_generated_transaction_types(self):
        Transaction.objects.create(
            user=self.user,
            transaction_type=Transaction.TransactionType.WITHDRAWAL,
            total_value=Decimal('1200.00'),
            fees=Decimal('12.00'),
            status=Transaction.Status.COMPLETED
        )
        Transaction.objects.create(
            user=self.user,
            transaction_type=Transaction.TransactionType.STORAGE_FEE,
            total_value=Decimal('25.00'),
            fees=Decimal('0.00'),
            status=Transaction.Status.COMPLETED
        )
        Transaction.objects.create(
            user=self.user,
            transaction_type=Transaction.TransactionType.BUY,
            metal=self.metal,
            amount_oz=Decimal('1.5000'),
            price_per_oz=Decimal('2300.00'),
            total_value=Decimal('3490.00'),
            fees=Decimal('40.00'),
            status=Transaction.Status.COMPLETED
        )
        # Other user's transaction should never leak into this feed
        Transaction.objects.create(
            user=self.other_user,
            transaction_type=Transaction.TransactionType.DEPOSIT,
            total_value=Decimal('500.00'),
            fees=Decimal('0.00'),
            status=Transaction.Status.COMPLETED
        )

        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/trading/transactions/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)

        txn_types = [item['transaction_type'] for item in response.data['results']]
        self.assertIn(Transaction.TransactionType.WITHDRAWAL, txn_types)
        self.assertIn(Transaction.TransactionType.STORAGE_FEE, txn_types)
        self.assertNotIn(Transaction.TransactionType.DEPOSIT, txn_types)


class OutstandingDebtsTests(TestCase):
    def setUp(self):
        from users.models import Wallet

        self.client = APIClient()
        self.user = User.objects.create_user(
            email='debts@test.com',
            username='debts_user',
            password='testpass123'
        )
        self.wallet, _ = Wallet.objects.get_or_create(user=self.user, defaults={'cash_balance': Decimal('1000.00')})
        self.wallet.cash_balance = Decimal('1000.00')
        self.wallet.save(update_fields=['cash_balance'])

        Transaction.objects.create(
            user=self.user,
            transaction_type=Transaction.TransactionType.STORAGE_FEE,
            total_value=Decimal('120.00'),
            fees=Decimal('0.00'),
            status=Transaction.Status.PENDING,
        )
        Transaction.objects.create(
            user=self.user,
            transaction_type=Transaction.TransactionType.TAX,
            total_value=Decimal('80.00'),
            fees=Decimal('0.00'),
            status=Transaction.Status.PENDING,
        )

    def test_outstanding_debts_summary(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get('/api/trading/transactions/outstanding_debts/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)
        self.assertEqual(Decimal(str(response.data['total_due'])), Decimal('200.0'))

    def test_settle_outstanding_debts(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post('/api/trading/transactions/settle_outstanding_debts/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.cash_balance, Decimal('800.00'))
        self.assertEqual(
            Transaction.objects.filter(
                user=self.user,
                transaction_type__in=[Transaction.TransactionType.STORAGE_FEE, Transaction.TransactionType.TAX],
                status=Transaction.Status.PENDING,
            ).count(),
            0,
        )

    def test_settle_outstanding_debts_requires_sufficient_balance(self):
        self.wallet.cash_balance = Decimal('50.00')
        self.wallet.save(update_fields=['cash_balance'])
        self.client.force_authenticate(user=self.user)

        response = self.client.post('/api/trading/transactions/settle_outstanding_debts/')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Insufficient cash balance', response.data['error'])


class ConvertFeatureToggleTests(TestCase):
    def setUp(self):
        from users.models import Wallet
        from admin_api.models import PlatformSettings
        from .models import Product, PortfolioItem

        self.client = APIClient()
        self.user = User.objects.create_user(
            email='convert-user@test.com',
            username='convert_user',
            password='testpass123',
            kyc_status=User.KYCStatus.VERIFIED,
        )
        Wallet.objects.get_or_create(user=self.user, defaults={'cash_balance': Decimal('0.00')})

        self.metal = Metal.objects.create(
            name='Gold',
            symbol='AU2',
            current_price=Decimal('2300.00'),
            price_change_24h=Decimal('0.00')
        )
        self.product = Product.objects.create(
            name='Gold Bar 1oz',
            metal=self.metal,
            manufacturer='Test Mint',
            purity='.9999',
            weight_oz=Decimal('1.0'),
            premium_per_oz=Decimal('50.00'),
            product_type=Product.ProductType.BAR
        )
        self.portfolio_item = PortfolioItem.objects.create(
            user=self.user,
            metal=self.metal,
            product=self.product,
            weight_oz=Decimal('1.0000'),
            quantity=1,
            purchase_price=Decimal('2200.00'),
            status=PortfolioItem.Status.VAULTED,
        )

        self.settings = PlatformSettings.get_solo()

    def test_convert_disabled_returns_503(self):
        self.settings.metals_convert_enabled = False
        self.settings.save(update_fields=['metals_convert_enabled'])
        self.client.force_authenticate(user=self.user)

        response = self.client.post('/api/trading/trade/convert/', {
            'portfolio_item_id': str(self.portfolio_item.id),
            'amount_oz': '0.1000',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertIn('temporarily unavailable', response.data['error'])
