import os
import django
import sys
from django.utils import timezone
from decimal import Decimal

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

# Force file based backend for verification and print path
from django.conf import settings
settings.EMAIL_BACKEND = 'django.core.mail.backends.filebased.EmailBackend'
if not os.path.exists(settings.EMAIL_FILE_PATH):
    os.makedirs(settings.EMAIL_FILE_PATH)
print(f"Using Email Backend: {settings.EMAIL_BACKEND}")
print(f"Writing emails to: {settings.EMAIL_FILE_PATH}")

from users.models import User
# from delivery.models import DeliveryRequest # Not strictly needed if we mock
from admin_api.utils import send_kyc_decision_email, send_account_status_email, send_shipment_update_email
from utils.emails import send_html_email

def run_verification():
    print("Starting email verification...")
    
    # Create or get dummy user
    email = "test_user_email_verify@example.com"
    # We need to wrap db operations in atomic if running in shell sometimes, but simple get_or_create is fine
    try:
        user = User.objects.get(email=email)
        print(f"Using existing test user: {email}")
    except User.DoesNotExist:
        user = User.objects.create_user(
            username='testuser_verify',
            email=email,
            password='password123',
            first_name='Test',
            last_name='User',
            phone_number='+15551234567'
        )
        print(f"Created test user: {email}")

    # 1. Test OTP Email (mimicking the view logic)
    otp = "1234"
    print("Sending OTP email...")
    send_html_email(
        subject="Fortress Vault - Your Verification Code",
        template_name="emails/otp.html",
        context={'user': user, 'otp': otp},
        recipient_list=[user.email]
    )

    # 2. Test KYC Approved
    print("Sending KYC Approved email...")
    send_kyc_decision_email(user, approved=True)

    # 3. Test KYC Rejected
    print("Sending KYC Rejected email...")
    send_kyc_decision_email(user, approved=False, reason="ID document was blurry.")

    # 4. Test Account Suspended
    print("Sending Account Suspended email...")
    send_account_status_email(user, suspended=True, reason="Suspicious activity detected.")

    # 5. Test Account Reactivated
    print("Sending Account Reactivated email...")
    send_account_status_email(user, suspended=False)
    
    # 6. Test Shipment Update
    print("Sending Shipment Update email...")
    
    class MockDeliveryRequest:
        def __init__(self, user):
            self.user = user
            self.tracking_number = "TRACK123456789"
            self.carrier = "FedEx"
            self.status = "shipped"
            self.estimated_arrival = timezone.now().date() + timezone.timedelta(days=3)
        
        def get_status_display(self):
            return "Shipped"
            
    shipment = MockDeliveryRequest(user)
    send_shipment_update_email(shipment)

    print("Verification complete. Check 'sent_emails' directory for output.")

if __name__ == "__main__":
    run_verification()
