from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('admin_api', '0003_rename_dev_emails_created_at_idx_dev_emails_created_9ccf19_idx_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='PlatformSettings',
            fields=[
                ('id', models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, serialize=False)),
                ('metals_buying_enabled', models.BooleanField(default=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'platform_settings',
            },
        ),
    ]
