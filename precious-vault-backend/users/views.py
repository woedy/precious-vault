"""
User views
"""

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
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
    
    @action(detail=False, methods=['post'])
    def submit_kyc(self, request):
        """Submit KYC information"""
        serializer = KYCSubmissionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        data = serializer.validated_data
        
        # Update user info
        user.first_name = data['first_name']
        user.last_name = data['last_name']
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
