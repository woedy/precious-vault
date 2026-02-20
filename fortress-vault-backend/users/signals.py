from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, Wallet

@receiver(post_save, sender=User)
def create_user_wallet(sender, instance, created, **kwargs):
    """Automatically create a wallet for every new user"""
    if created:
        Wallet.objects.get_or_create(user=instance)
