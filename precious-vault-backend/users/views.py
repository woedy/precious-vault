import random
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from .models import User, Address
from .serializers import (
    UserSerializer, AddressSerializer, KYCSubmissionSerializer, Enable2FASerializer
)


class UserViewSet(viewsets.ModelViewSet):
    """User profile viewset"""
    
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Users can only see their own profile"""
        return User.objects.filter(id=self.request.user.id)
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user profile"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['patch', 'put'])
    def update_me(self, request):
        """Update current user profile"""
        serializer = self.get_serializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def submit_kyc(self, request):
        """Submit KYC information"""
        serializer = KYCSubmissionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        data = serializer.validated_data
        
        # Update user info - only if provided in data
        first_name = data.get('first_name')
        last_name = data.get('last_name')
        if first_name:
            user.first_name = first_name
        if last_name:
            user.last_name = last_name
        user.phone_number = data['phone_number']
        user.kyc_status = User.KYCStatus.VERIFIED  # Auto-verify for MVP
        user.save()
        
        # Create or update address
        Address.objects.update_or_create(
            user=user,
            defaults={
                'street': data['street'],
                'city': data['city'],
                'state': data.get('state', ''),
                'zip_code': data['zip_code'],
                'country': data['country'],
                'is_verified': True  # Auto-verify for MVP
            }
        )
        
        return Response({
            'message': 'KYC submitted successfully',
            'kyc_status': user.kyc_status
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'])
    def send_otp(self, request):
        """Generate and send 4-digit OTP"""
        user = request.user
        otp = f"{random.randint(1000, 9999)}"
        user.otp_code = otp
        user.otp_created_at = timezone.now()
        user.save()
        
        # Send email (using console backend by default in settings)
        send_mail(
            "Precious Vault - Your Verification Code",
            f"Your verification code is: {otp}",
            settings.EMAIL_HOST_USER or "noreply@preciousvault.com",
            [user.email],
            fail_silently=False,
        )
        
        return Response({'message': 'OTP sent successfully'}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def verify_otp(self, request):
        """Verify 4-digit OTP"""
        code = request.data.get('code')
        if not code:
            return Response({'error': 'Code is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        user = request.user
        if user.otp_code == code:
            # Check expiry (e.g., 10 minutes)
            if timezone.now() - user.otp_created_at > timezone.timedelta(minutes=10):
                return Response({'error': 'OTP expired'}, status=status.HTTP_400_BAD_REQUEST)
            
            user.is_email_verified = True
            user.otp_code = None
            user.save()
            return Response({'message': 'Email verified successfully', 'is_email_verified': True}, status=status.HTTP_200_OK)
        
        return Response({'error': 'Invalid code'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_id(self, request):
        """Upload identity document"""
        user = request.user
        file_obj = request.data.get('document')
        
        if not file_obj:
            return Response({'error': 'No document provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        user.identity_document = file_obj
        user.kyc_status = User.KYCStatus.PENDING
        user.save()
        
        return Response({
            'message': 'Identity document uploaded successfully',
            'identity_document': user.identity_document.url,
            'kyc_status': user.kyc_status
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def enable_2fa(self, request):
        """Enable/disable 2FA"""
        serializer = Enable2FASerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        user.two_factor_enabled = serializer.validated_data['enabled']
        user.save()
        
        return Response({
            'message': '2FA updated successfully',
            'two_factor_enabled': user.two_factor_enabled
        }, status=status.HTTP_200_OK)


class AddressViewSet(viewsets.ModelViewSet):
    """Address viewset"""
    
    queryset = Address.objects.all()
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Users can only see their own addresses"""
        return Address.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        """Set user when creating address"""
        serializer.save(user=self.request.user)
