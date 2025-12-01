#!/bin/bash

echo "🧹 Limpiando contenedores y volúmenes Docker..."

# Detener y eliminar contenedores
echo "🛑 Deteniendo contenedores..."
docker-compose down

# Eliminar volúmenes (incluye la base de datos)
echo "🗑️  Eliminando volúmenes..."
docker-compose down -v

# Opcional: eliminar imágenes también
read -p "¿Deseas eliminar también las imágenes? (s/n): " -r
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo "🗑️  Eliminando imágenes..."
    docker-compose down --rmi all
fi

echo ""
echo "✅ Limpieza completada!"
echo ""
echo "Ahora puedes ejecutar: ./init.sh"

