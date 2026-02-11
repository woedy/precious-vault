#!/usr/bin/env python
"""
Script to verify admin API URL configuration
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.urls import get_resolver

def list_admin_urls():
    """List all admin API URLs"""
    resolver = get_resolver()
    admin_urls = []
    
    for pattern in resolver.url_patterns:
        if hasattr(pattern, 'url_patterns'):
            # This is an included URLconf
            if 'admin_api' in str(pattern.pattern):
                for sub_pattern in pattern.url_patterns:
                    url = f"/api/admin/{sub_pattern.pattern}"
                    name = getattr(sub_pattern, 'name', 'N/A')
                    admin_urls.append((url, name))
    
    return admin_urls

if __name__ == '__main__':
    print("Admin API URLs:")
    print("-" * 80)
    
    urls = list_admin_urls()
    
    if not urls:
        print("ERROR: No admin URLs found!")
        sys.exit(1)
    
    for url, name in sorted(urls):
        print(f"{url:<60} {name}")
    
    print("-" * 80)
    print(f"Total admin URLs: {len(urls)}")
    print("\nAdmin API URLs are properly configured!")
