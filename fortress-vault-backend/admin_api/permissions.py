"""
Admin API permissions
"""

from rest_framework.permissions import BasePermission


class IsAdminUser(BasePermission):
    """
    Allow access only to admin users (is_staff=True or is_superuser=True)
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            (request.user.is_staff or request.user.is_superuser)
        )
