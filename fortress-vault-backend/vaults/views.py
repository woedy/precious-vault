"""
Vault views
"""

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Vault
from .serializers import VaultSerializer
from trading.models import PortfolioItem
from trading.serializers import PortfolioItemSerializer


class VaultViewSet(viewsets.ReadOnlyModelViewSet):
    """Vault viewset"""
    
    queryset = Vault.objects.filter(status=Vault.Status.ACTIVE)
    serializer_class = VaultSerializer
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_assets(self, request):
        """Get user's vaulted assets"""
        vaulted_items = PortfolioItem.objects.filter(
            user=request.user,
            status=PortfolioItem.Status.VAULTED
        ).select_related('metal', 'product', 'vault_location')
        
        serializer = PortfolioItemSerializer(vaulted_items, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def set_preferred(self, request):
        """Set preferred vault"""
        vault_id = request.data.get('vault_id')
        
        if not vault_id:
            return Response({'error': 'vault_id is required'}, status=400)
        
        try:
            vault = Vault.objects.get(id=vault_id, status=Vault.Status.ACTIVE)
            user = request.user
            user.preferred_vault = vault
            user.save()
            
            return Response({
                'message': 'Preferred vault updated',
                'vault': VaultSerializer(vault).data
            })
        except Vault.DoesNotExist:
            return Response({'error': 'Vault not found'}, status=404)
