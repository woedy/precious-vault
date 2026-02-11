"""
Admin API pagination classes
"""

from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class AdminPagination(PageNumberPagination):
    """
    Standard pagination for admin API endpoints.
    
    Provides consistent pagination with:
    - Default page size of 20 items
    - Configurable page_size query parameter (max 100)
    - Response format: {results, count, page, page_size, total_pages}
    """
    
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
    
    def get_paginated_response(self, data):
        """
        Return paginated response in admin API format
        """
        return Response({
            'results': data,
            'count': self.page.paginator.count,
            'page': self.page.number,
            'page_size': self.page.paginator.per_page,
            'total_pages': self.page.paginator.num_pages
        })
