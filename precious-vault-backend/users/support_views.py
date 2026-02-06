"""
Support views (placeholder for frontend compatibility)
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


@api_view(['GET', 'OPTIONS'])
@permission_classes([IsAuthenticated])
def unread_count(request):
    """Get unread support messages count (placeholder)"""
    return Response({'count': 0})
