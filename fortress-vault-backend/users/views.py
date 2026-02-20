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
from .models import User, Address, ChatThread, ChatMessage
from .consumers import broadcast_chat_message
from .serializers import (
    UserSerializer, AddressSerializer, KYCSubmissionSerializer, Enable2FASerializer,
    ChatThreadSerializer, ChatMessageSerializer, ChatSendMessageSerializer
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
        """Generate and send 4-digit OTP with a 60-second cooldown"""
        user = request.user
        
        if user.otp_created_at and (timezone.now() - user.otp_created_at).total_seconds() < 10:
            return Response(
                {'message': 'Verification code already sent to your email.'}, 
                status=status.HTTP_200_OK
            )
        
        # Prevent rapid-fire duplicate requests (60s cooldown)
        if user.otp_created_at and (timezone.now() - user.otp_created_at).total_seconds() < 60:
            return Response(
                {'message': 'Please wait a moment before requesting another code.'}, 
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        otp = f"{random.randint(1000, 9999)}"
        user.otp_code = otp
        user.otp_created_at = timezone.now()
        user.save(update_fields=['otp_code', 'otp_created_at'])
        
        # Send email
        from utils.emails import send_html_email
        send_html_email(
            subject="Fortress Vault - Your Verification Code",
            template_name="emails/otp.html",
            context={'user': user, 'otp': otp},
            recipient_list=[user.email]
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




class ChatViewSet(viewsets.ViewSet):
    """Customer support chat endpoints."""

    permission_classes = [IsAuthenticated]

    def _get_or_create_thread(self, user):
        """Ensure one canonical thread per customer for stable realtime behavior."""
        thread = ChatThread.objects.filter(customer=user).order_by('-updated_at').first()
        if thread:
            if thread.status == ChatThread.Status.CLOSED:
                thread.status = ChatThread.Status.OPEN
                thread.save(update_fields=['status', 'updated_at'])
            return thread

        return ChatThread.objects.create(
            customer=user,
            status=ChatThread.Status.OPEN,
            subject='Shipment Support'
        )

    @action(detail=False, methods=['get'])
    def my_thread(self, request):
        thread = self._get_or_create_thread(request.user)
        serializer = ChatThreadSerializer(thread, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def messages(self, request):
        thread = self._get_or_create_thread(request.user)
        messages = thread.messages.select_related('sender').all()
        thread.messages.exclude(sender=request.user).filter(is_read=False).update(is_read=True)
        serializer = ChatMessageSerializer(messages, many=True)
        return Response({'thread_id': str(thread.id), 'messages': serializer.data})

    @action(detail=False, methods=['post'])
    def send(self, request):
        serializer = ChatSendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        thread = self._get_or_create_thread(request.user)
        message = ChatMessage.objects.create(
            thread=thread,
            sender=request.user,
            body=serializer.validated_data['body'].strip()
        )
        thread.save(update_fields=['updated_at'])

        message_payload = ChatMessageSerializer(message).data
        broadcast_chat_message(thread.id, message_payload)

        return Response({'message': 'Message sent', 'data': message_payload}, status=status.HTTP_201_CREATED)
