# App de Encuestas

Aplicación web para crear, gestionar y analizar encuestas con sistema de roles.

## Stack Tecnológico

- **Backend**: Django + Django REST Framework
- **Frontend**: React + Vite + TypeScript
- **Base de datos**: PostgreSQL
- **Autenticación**: JWT
- **Documentación API**: OpenAPI/Swagger
- **Containerización**: Docker

## Características

- ✅ Creación y edición de encuestas
- ✅ Tipos de preguntas: Opción única, Opción múltiple, Matriz de satisfacción
- ✅ Enlaces públicos para responder encuestas
- ✅ Estadísticas con gráficas (pastel y barras)
- ✅ Exportación a Excel
- ✅ Sistema de roles: Admin, Creador, Visualizador
- ✅ Fechas de inicio y cierre de encuestas

## Instalación

### Requisitos
- Docker y Docker Compose
- Git

### Ejecutar la aplicación

#### Opción 1: Script de inicialización (recomendado)

```bash
# Dar permisos de ejecución
chmod +x init.sh

# Ejecutar script de inicialización
./init.sh
```

#### Opción 2: Manual

```bash
# 1. Crear archivo .env en backend/
cp backend/.env.example backend/.env
# Editar backend/.env con tus configuraciones

# 2. Construir y levantar los contenedores
docker-compose up --build

# 3. En otra terminal, ejecutar migraciones
docker-compose exec backend python manage.py migrate

# 4. Crear superusuario
docker-compose exec backend python manage.py createsuperuser
```

### Acceder a la aplicación

Una vez iniciados los servicios:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Swagger/OpenAPI**: http://localhost:8000/api/docs/
- **Admin Django**: http://localhost:8000/admin/

### Comandos útiles

```bash
# Limpiar todo (contenedores, volúmenes, imágenes) y reiniciar desde cero
./clean.sh
./init.sh

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down

# Detener y eliminar volúmenes (limpia la base de datos)
docker-compose down -v

# Reiniciar servicios
docker-compose restart

# Acceder a la shell del backend
docker-compose exec backend bash

# Ejecutar comandos Django
docker-compose exec backend python manage.py <comando>

# Crear superusuario automáticamente (con credenciales por defecto)
./create_superuser.sh

# O crear superusuario interactivamente
docker-compose exec backend python manage.py createsuperuser
```

### Credenciales por defecto del superusuario

Si usas el script `create_superuser.sh`, se creará un superusuario con:

- **Username**: `admin`
- **Password**: `admin123`
- **Email**: `admin@example.com`
- **Role**: `admin`

⚠️ **IMPORTANTE**: Cambia estas credenciales en producción.

Para personalizar las credenciales:

```bash
SUPERUSER_USERNAME=miadmin SUPERUSER_PASSWORD=micontraseña ./create_superuser.sh
```

## Estructura del Proyecto

```
AppEncuestas/
├── backend/          # Django backend
├── frontend/         # React + Vite frontend
├── docker-compose.yml
└── README.md
```

## Roles

- **Admin**: Acceso completo, puede ver y gestionar todo
- **Creador**: Puede crear encuestas, editarlas y ver estadísticas de sus encuestas
- **Visualizador**: Puede ver estadísticas de encuestas asignadas por el admin

