
from django.contrib.auth.models import AnonymousUser
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model
from urllib.parse import parse_qs

@database_sync_to_async
def get_user(token_key):
    try:
        User = get_user_model()
        access_token = AccessToken(token_key)
        user = User.objects.get(id=access_token['user_id'])
        return user
    except Exception:
        return AnonymousUser()

class JwtAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        # Parse query string
        query_string = scope.get('query_string', b'').decode()
        query_params = parse_qs(query_string)
        token = query_params.get('token')

        if token:
            scope['user'] = await get_user(token[0])
        else:
            if 'user' not in scope:
                 scope['user'] = AnonymousUser()

        return await super().__call__(scope, receive, send)
