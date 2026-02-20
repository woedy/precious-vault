from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from users.models import User
from .models import Shipment


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
