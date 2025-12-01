# Debug de Login

## Pasos para diagnosticar el problema de login

### 1. Verificar que los servicios estén corriendo

```bash
docker-compose ps
```

Debes ver:
- `backend` corriendo en puerto 8000
- `frontend` corriendo en puerto 3000
- `db` corriendo en puerto 5432

### 2. Verificar logs del backend

```bash
docker-compose logs backend | tail -50
```

Busca errores relacionados con:
- Autenticación
- CORS
- Base de datos
- JWT

### 3. Probar el endpoint de login directamente

```bash
# Desde tu terminal
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin"}'
```

Deberías recibir algo como:
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### 4. Verificar en el navegador

1. Abre las herramientas de desarrollador (F12)
2. Ve a la pestaña "Network" (Red)
3. Intenta iniciar sesión
4. Busca la petición a `/api/auth/login/`
5. Revisa:
   - Status code (debe ser 200)
   - Response (debe tener access y refresh)
   - Headers (verifica CORS)

### 5. Verificar credenciales

Las credenciales por defecto son:
- Username: `admin`
- Password: `admin`

Si no funcionan, puedes crear un nuevo usuario desde el admin de Django:
```bash
docker-compose exec backend python manage.py createsuperuser
```

### 6. Verificar CORS

Si ves errores de CORS en la consola del navegador, verifica que en `backend/config/settings.py` esté:

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
```

### 7. Verificar variables de entorno

En el frontend, verifica que la URL de la API sea correcta. Abre la consola del navegador y ejecuta:

```javascript
console.log(import.meta.env.VITE_API_URL)
```

Debe mostrar: `http://localhost:8000` o estar vacío (usará el default)

### 8. Limpiar y reiniciar

Si nada funciona:

```bash
# Limpiar todo
./clean.sh

# Reiniciar
./init.sh
```

### Errores comunes

1. **"No se pudo conectar con el servidor"**
   - El backend no está corriendo
   - Verifica: `docker-compose ps`

2. **"401 Unauthorized"**
   - Credenciales incorrectas
   - Usuario no existe
   - Verifica: `docker-compose exec backend python manage.py shell` y luego `from accounts.models import User; User.objects.all()`

3. **"CORS error"**
   - El origen no está permitido
   - Verifica la configuración de CORS en settings.py

4. **"Network Error"**
   - El backend no está accesible
   - Verifica que el puerto 8000 esté libre
   - Verifica: `curl http://localhost:8000/api/docs/`

