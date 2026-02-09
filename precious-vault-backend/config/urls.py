"""
Main URL configuration
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('djoser.urls')),
    path('api/auth/', include('djoser.urls.jwt')),
    path('api/users/', include('users.urls')),
    path('api/trading/', include('trading.urls')),
    path('api/vaults/', include('vaults.urls')),
    path('api/delivery/', include('delivery.urls')),
    path('api/admin/', include('admin_api.urls')),  # Admin API endpoints
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
