from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from users.models import User
from vaults.models import Vault


class ChatEndpointsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.customer = User.objects.create_user(email='customer@test.com', username='customer', password='pass12345')
        self.admin = User.objects.create_user(email='admin@test.com', username='admin', password='pass12345', is_staff=True)

    def test_customer_chat_thread_and_send_message(self):
        self.client.force_authenticate(user=self.customer)

        thread_resp = self.client.get('/api/users/chat/my_thread/')
        self.assertEqual(thread_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(thread_resp.data['customer_email'], self.customer.email)

        send_resp = self.client.post('/api/users/chat/send/', {'body': 'Need shipment update'})
        self.assertEqual(send_resp.status_code, status.HTTP_201_CREATED)

        msgs_resp = self.client.get('/api/users/chat/messages/')
        self.assertEqual(msgs_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(msgs_resp.data['messages']), 1)

    def test_admin_can_list_and_reply(self):
        self.client.force_authenticate(user=self.customer)
        self.client.post('/api/users/chat/send/', {'body': 'Hello admin'})

        self.client.force_authenticate(user=self.admin)
        list_resp = self.client.get('/api/admin/chats/')
        self.assertEqual(list_resp.status_code, status.HTTP_200_OK)

        results = list_resp.data['results'] if isinstance(list_resp.data, dict) and 'results' in list_resp.data else list_resp.data
        self.assertGreaterEqual(len(results), 1)
        thread_id = results[0]['id']

        reply_resp = self.client.post(f'/api/admin/chats/{thread_id}/send/', {'body': 'We are checking your shipment'})
        self.assertEqual(reply_resp.status_code, status.HTTP_201_CREATED)

        thread_msgs = self.client.get(f'/api/admin/chats/{thread_id}/messages/')
        self.assertEqual(thread_msgs.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(thread_msgs.data['messages']), 2)


class PreferredVaultPersistenceTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email='investor@test.com', username='investor', password='pass12345')
        self.vault = Vault.objects.create(
            name='Zurich Secure Vault',
            city='Zurich',
            country='Switzerland',
            storage_fee_percent='0.0008',
            status=Vault.Status.ACTIVE,
        )
        self.client.force_authenticate(user=self.user)

    def test_update_me_persists_preferred_vault(self):
        resp = self.client.patch('/api/users/profile/update_me/', {'preferred_vault': str(self.vault.id)}, format='json')

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.preferred_vault_id, self.vault.id)

    def test_submit_kyc_persists_preferred_vault(self):
        payload = {
            'phone_number': '+15551234567',
            'street': '1 Gold Street',
            'city': 'Geneva',
            'state': '',
            'zip_code': '1201',
            'country': 'Switzerland',
            'preferred_vault': str(self.vault.id),
        }

        resp = self.client.post('/api/users/profile/submit_kyc/', payload, format='json')

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.preferred_vault_id, self.vault.id)
