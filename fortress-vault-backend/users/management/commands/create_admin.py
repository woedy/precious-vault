"""
Management command to create admin users
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Create an admin user with staff privileges'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='Admin email address')
        parser.add_argument('password', type=str, help='Admin password')
        parser.add_argument(
            '--superuser',
            action='store_true',
            help='Make the user a superuser (full admin access)',
        )
        parser.add_argument(
            '--first-name',
            type=str,
            default='',
            help='First name (optional)',
        )
        parser.add_argument(
            '--last-name',
            type=str,
            default='',
            help='Last name (optional)',
        )

    def handle(self, *args, **options):
        email = options['email']
        password = options['password']
        is_superuser = options['superuser']
        first_name = options['first_name']
        last_name = options['last_name']

        # Check if user already exists
        if User.objects.filter(email=email).exists():
            self.stdout.write(
                self.style.ERROR(f'User with email {email} already exists!')
            )
            return

        # Generate username from email (before @ symbol)
        username = email.split('@')[0]
        
        # Ensure username is unique
        base_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1

        # Create the user
        if is_superuser:
            user = User.objects.create_superuser(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
            )
            self.stdout.write(
                self.style.SUCCESS(
                    f'Superuser created successfully: {email}'
                )
            )
        else:
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
            )
            user.is_staff = True
            user.save()
            self.stdout.write(
                self.style.SUCCESS(
                    f'Staff user created successfully: {email}'
                )
            )

        self.stdout.write(
            self.style.SUCCESS(
                f'Admin user can now log in at http://localhost:3001'
            )
        )
