from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('admin_api', '0005_platformsettings_metals_selling_enabled'),
    ]

    operations = [
        migrations.AddField(
            model_name='platformsettings',
            name='metals_convert_enabled',
            field=models.BooleanField(default=True),
        ),
    ]
