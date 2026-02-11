"""
Seed database with initial data
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from decimal import Decimal

from trading.models import Metal, Product
from vaults.models import Vault


class Command(BaseCommand):
    help = 'Seed database with initial metals, products, and vaults'
    
    def handle(self, *args, **options):
        self.stdout.write('Seeding database...')
        
        with transaction.atomic():
            # Create metals
            self.stdout.write('Creating metals...')
            metals = {
                'gold': Metal.objects.create(
                    name='Gold',
                    symbol='Au',
                    current_price=Decimal('2024.50'),
                    price_change_24h=Decimal('1.25')
                ),
                'silver': Metal.objects.create(
                    name='Silver',
                    symbol='Ag',
                    current_price=Decimal('24.15'),
                    price_change_24h=Decimal('-0.35')
                ),
                'platinum': Metal.objects.create(
                    name='Platinum',
                    symbol='Pt',
                    current_price=Decimal('925.00'),
                    price_change_24h=Decimal('0.85')
                ),
                'palladium': Metal.objects.create(
                    name='Palladium',
                    symbol='Pd',
                    current_price=Decimal('1050.00'),
                    price_change_24h=Decimal('-1.10')
                ),
            }
            
            # Create products
            self.stdout.write('Creating products...')
            
            # Gold products
            Product.objects.create(
                metal=metals['gold'],
                name='1 oz Gold Bar',
                manufacturer='PAMP Suisse',
                purity='.9999',
                weight_oz=Decimal('1.0000'),
                premium_per_oz=Decimal('45.00'),
                product_type='bar'
            )
            
            Product.objects.create(
                metal=metals['gold'],
                name='1 oz American Gold Eagle',
                manufacturer='US Mint',
                purity='.9167',
                weight_oz=Decimal('1.0000'),
                premium_per_oz=Decimal('85.00'),
                product_type='coin'
            )
            
            Product.objects.create(
                metal=metals['gold'],
                name='10 oz Gold Bar',
                manufacturer='PAMP Suisse',
                purity='.9999',
                weight_oz=Decimal('10.0000'),
                premium_per_oz=Decimal('35.00'),
                product_type='bar'
            )
            
            # Silver products
            Product.objects.create(
                metal=metals['silver'],
                name='1 oz Silver Bar',
                manufacturer='PAMP Suisse',
                purity='.999',
                weight_oz=Decimal('1.0000'),
                premium_per_oz=Decimal('3.50'),
                product_type='bar'
            )
            
            Product.objects.create(
                metal=metals['silver'],
                name='1 oz American Silver Eagle',
                manufacturer='US Mint',
                purity='.999',
                weight_oz=Decimal('1.0000'),
                premium_per_oz=Decimal('5.00'),
                product_type='coin'
            )
            
            # Platinum products
            Product.objects.create(
                metal=metals['platinum'],
                name='1 oz Platinum Bar',
                manufacturer='PAMP Suisse',
                purity='.9995',
                weight_oz=Decimal('1.0000'),
                premium_per_oz=Decimal('55.00'),
                product_type='bar'
            )
            
            # Create vaults
            self.stdout.write('Creating vaults...')
            
            Vault.objects.create(
                name='Zurich Secure Storage',
                city='Zurich',
                country='Switzerland',
                flag_emoji='🇨🇭',
                storage_fee_percent=Decimal('0.0008'),
                is_allocated=True,
                is_insured=True,
                capacity_percent=65,
                status='active'
            )
            
            Vault.objects.create(
                name='New York Vault',
                city='New York',
                country='United States',
                flag_emoji='🇺🇸',
                storage_fee_percent=Decimal('0.0012'),
                is_allocated=True,
                is_insured=True,
                capacity_percent=72,
                status='active'
            )
            
            Vault.objects.create(
                name='Singapore Storage',
                city='Singapore',
                country='Singapore',
                flag_emoji='🇸🇬',
                storage_fee_percent=Decimal('0.0010'),
                is_allocated=True,
                is_insured=True,
                capacity_percent=58,
                status='active'
            )
            
            Vault.objects.create(
                name='London Vault',
                city='London',
                country='United Kingdom',
                flag_emoji='🇬🇧',
                storage_fee_percent=Decimal('0.0009'),
                is_allocated=True,
                is_insured=True,
                capacity_percent=80,
                status='active'
            )
        
        self.stdout.write(self.style.SUCCESS('Database seeded successfully!'))
        self.stdout.write(f'Created {Metal.objects.count()} metals')
        self.stdout.write(f'Created {Product.objects.count()} products')
        self.stdout.write(f'Created {Vault.objects.count()} vaults')
