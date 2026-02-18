from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('admin_api', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='DevEmail',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('subject', models.CharField(max_length=255)),
                ('from_email', models.CharField(blank=True, default='', max_length=255)),
                ('recipient_list', models.JSONField(default=list)),
                ('text_content', models.TextField(blank=True, default='')),
                ('html_content', models.TextField(blank=True, default='')),
                ('template_name', models.CharField(blank=True, default='', max_length=255)),
                ('context', models.JSONField(default=dict)),
                ('status', models.CharField(default='sent', max_length=20)),
                ('error', models.TextField(blank=True, default='')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'db_table': 'dev_emails',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='devemail',
            index=models.Index(fields=['created_at'], name='dev_emails_created_at_idx'),
        ),
        migrations.AddIndex(
            model_name='devemail',
            index=models.Index(fields=['status'], name='dev_emails_status_idx'),
        ),
    ]
