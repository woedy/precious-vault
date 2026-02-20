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
