#!/bin/bash

echo "👤 Creando superusuario..."

# Credenciales por defecto
USERNAME=${SUPERUSER_USERNAME:-admin}
EMAIL=${SUPERUSER_EMAIL:-admin@example.com}
PASSWORD=${SUPERUSER_PASSWORD:-admin123}

docker-compose exec -T backend python manage.py shell << EOF
from accounts.models import User
import os

if User.objects.filter(username='${USERNAME}').exists():
    print('El usuario ${USERNAME} ya existe.')
else:
    User.objects.create_superuser(
        username='${USERNAME}',
        email='${EMAIL}',
        password='${PASSWORD}',
        role='admin'
    )
    print('✅ Superusuario creado exitosamente!')
    print('Username: ${USERNAME}')
    print('Password: ${PASSWORD}')
    print('')
    print('⚠️  IMPORTANTE: Cambia la contraseña después del primer inicio de sesión!')
EOF

