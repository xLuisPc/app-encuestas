#!/bin/bash

# Script de inicialización completo del proyecto

echo "🚀 Inicializando App de Encuestas..."

# Crear archivo .env si no existe
if [ ! -f backend/.env ]; then
    echo "📝 Creando archivo .env..."
    cat > backend/.env << EOF
SECRET_KEY=django-insecure-change-me-in-production-$(openssl rand -hex 32)
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0
DB_NAME=encuestas_db
DB_USER=encuestas_user
DB_PASSWORD=encuestas_pass
DB_HOST=db
DB_PORT=5432
EOF
    echo "✅ Archivo .env creado"
else
    echo "ℹ️  Archivo .env ya existe"
fi

# Construir y levantar contenedores
echo "🐳 Construyendo contenedores Docker..."
docker-compose build

echo "🚀 Levantando servicios..."
docker-compose up -d

# Esperar a que la base de datos esté lista
echo "⏳ Esperando a que la base de datos esté lista..."
sleep 15

# Verificar que el contenedor del backend esté corriendo
echo "🔍 Verificando que el backend esté listo..."
for i in {1..30}; do
    if docker-compose exec -T backend python manage.py check --deploy > /dev/null 2>&1; then
        break
    fi
    echo "   Esperando... ($i/30)"
    sleep 2
done

# Crear migraciones si no existen
echo "📝 Verificando migraciones..."
if [ ! -d "backend/accounts/migrations" ]; then
    echo "   Creando directorio de migraciones para accounts..."
    mkdir -p backend/accounts/migrations
    touch backend/accounts/migrations/__init__.py
fi

if [ ! -d "backend/surveys/migrations" ]; then
    echo "   Creando directorio de migraciones para surveys..."
    mkdir -p backend/surveys/migrations
    touch backend/surveys/migrations/__init__.py
fi

# Crear migraciones
echo "📦 Creando migraciones..."
MIGRATION_OUTPUT=$(docker-compose exec -T backend python manage.py makemigrations accounts surveys 2>&1)
if echo "$MIGRATION_OUTPUT" | grep -q "No changes detected"; then
    echo "   ✅ Las migraciones ya están creadas"
else
    echo "$MIGRATION_OUTPUT"
fi

# Ejecutar migraciones
echo "📦 Ejecutando migraciones..."
MIGRATE_OUTPUT=$(docker-compose exec -T backend python manage.py migrate --noinput 2>&1)
if [ $? -eq 0 ]; then
    echo "   ✅ Migraciones ejecutadas correctamente"
else
    echo "   ⚠️  Error al ejecutar migraciones, reintentando..."
    echo "$MIGRATE_OUTPUT"
    sleep 5
    docker-compose exec -T backend python manage.py migrate --noinput
    if [ $? -eq 0 ]; then
        echo "   ✅ Migraciones ejecutadas correctamente en el segundo intento"
    else
        echo "   ❌ Error persistente al ejecutar migraciones"
        exit 1
    fi
fi

# Crear superusuario automáticamente
echo ""
echo "👤 Creando superusuario admin..."

# Credenciales por defecto
USERNAME="admin"
EMAIL="admin@example.com"
PASSWORD="admin"

# Esperar un momento para asegurar que la base de datos esté lista
sleep 3

# Verificar si el usuario ya existe y crear si no existe
docker-compose exec -T backend python manage.py shell << EOF
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import User

username = '${USERNAME}'
email = '${EMAIL}'
password = '${PASSWORD}'

try:
    if User.objects.filter(username=username).exists():
        print('ℹ️  El usuario {} ya existe.'.format(username))
    else:
        User.objects.create_superuser(
            username=username,
            email=email,
            password=password,
            role='admin'
        )
        print('✅ Superusuario creado exitosamente!')
except Exception as e:
    print('❌ Error al crear superusuario: {}'.format(str(e)))
    import traceback
    traceback.print_exc()
EOF

echo ""
echo "✅ ¡Inicialización completada!"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "📋 Servicios disponibles:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:8000"
echo "   - Swagger: http://localhost:8000/api/docs/"
echo "   - Admin Django: http://localhost:8000/admin/"
echo ""
echo "🔐 Credenciales del Administrador:"
echo "   Username: ${USERNAME}"
echo "   Password: ${PASSWORD}"
echo "   Email: ${EMAIL}"
echo "   Role: admin"
echo ""
echo "💡 El administrador puede crear usuarios desde:"
echo "   - Admin Django: http://localhost:8000/admin/accounts/user/add/"
echo "   - O desde la API usando el token JWT"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Para detener los servicios: docker-compose down"
echo "Para ver los logs: docker-compose logs -f"
