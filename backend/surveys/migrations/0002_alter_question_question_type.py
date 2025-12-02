from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('surveys', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='question',
            name='question_type',
            field=models.CharField(
                # dejamos max_length 10 para coincidir con la columna existente
                max_length=20,
                choices=[
                    ('single', 'Opción Única'),
                    ('multiple', 'Opción Múltiple'),
                    ('matrix', 'Matriz opción única'),
                    ('matrix_mul', 'Matriz Opción Múltiple'),
                    ('open', 'Respuesta abierta'),
                ],
            ),
        ),
    ]


