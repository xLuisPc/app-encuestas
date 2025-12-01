"""
Script para crear un superusuario automáticamente
Uso: python manage.py shell < create_superuser.py
O: docker-compose exec backend python manage.py shell < create_superuser.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import User

# Credenciales por defecto (cambiar en producción)
USERNAME = 'admin'
EMAIL = 'admin@example.com'
PASSWORD = 'admin123'
ROLE = 'admin'

if User.objects.filter(username=USERNAME).exists():
    print(f'El usuario {USERNAME} ya existe.')
else:
    User.objects.create_superuser(
        username=USERNAME,
        email=EMAIL,
        password=PASSWORD,
        role=ROLE
    )
    print(f'Superusuario creado exitosamente!')
    print(f'Username: {USERNAME}')
    print(f'Password: {PASSWORD}')
    print(f'Role: {ROLE}')
    print('\n⚠️  IMPORTANTE: Cambia la contraseña después del primer inicio de sesión!')

