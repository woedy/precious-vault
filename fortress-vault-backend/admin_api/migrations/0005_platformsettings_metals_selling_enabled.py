from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('admin_api', '0004_platformsettings'),
    ]

    operations = [
        migrations.AddField(
            model_name='platformsettings',
            name='metals_selling_enabled',
            field=models.BooleanField(default=True),
        ),
    ]
