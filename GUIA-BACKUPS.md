# 💾 GUÍA DE USO - SISTEMA DE BACKUPS

## 📚 Descripción
Sistema completo de gestión de backups para la base de datos SQLite de MindCare AI, accesible desde el frontend.

## 🎯 Características Implementadas

### 1. **Crear Backup**
- Crea una copia de seguridad de la base de datos actual
- Nombre automático con timestamp: `mindcare_backup_YYYY-MM-DDTHH-MM-SS.db`
- Se guarda en la carpeta `backups/`

### 2. **Listar Backups**
- Muestra todos los backups disponibles
- Información detallada: nombre, fecha, tamaño
- Ordenados del más reciente al más antiguo

### 3. **Descargar Backup**
- Descarga cualquier backup a tu computadora
- Útil para guardar copias externas

### 4. **Restaurar Backup**
- Restaura la base de datos desde cualquier backup
- **Seguridad**: Crea un backup automático antes de restaurar
- Nombre del backup de seguridad: `mindcare_before_restore_[timestamp].db`

### 5. **Eliminar Backup**
- Elimina backups que ya no necesites
- Confirmación antes de eliminar

---

## 📖 CÓMO USAR PARA LA DEMOSTRACIÓN

### Paso 1: Acceder a la Página de Backups
1. Inicia sesión en MindCare AI
2. En el header, haz clic en el botón **"💾 Backups"**
3. Se abrirá la página de gestión de backups

### Paso 2: Crear un Backup (DEMOSTRACIÓN INICIAL)
```
1. Haz clic en "💾 Crear Backup"
2. Confirma la creación
3. Verás el mensaje: "✅ Backup creado exitosamente: [nombre_archivo]"
4. El backup aparecerá en la lista
```

**Qué mostrar al profesor:**
- El archivo creado tiene un nombre único con fecha y hora
- Aparece inmediatamente en la lista
- Muestra el tamaño del archivo

### Paso 3: Crear Varios Backups (PARA MOSTRAR SELECCIÓN)
```
1. Ve a la página principal
2. Crea 2-3 entradas emocionales nuevas
3. Regresa a Backups
4. Crea otro backup
5. Repite 2-3 veces
```

**Resultado:** Tendrás varios backups con diferentes estados de la base de datos.

### Paso 4: Descargar un Backup Específico
```
1. En la lista de backups, elige cualquiera
2. Haz clic en "📥 Descargar"
3. El archivo se descargará a tu carpeta de Descargas
```

**Qué mostrar al profesor:**
- Puedes descargar CUALQUIER backup, no solo el último
- El archivo descargado es una copia exacta de la base de datos

### Paso 5: Restaurar un Backup ESPECÍFICO (LO MÁS IMPORTANTE)
```
1. Elige un backup ANTIGUO de la lista (no el más reciente)
2. Haz clic en "🔄 Restaurar"
3. Lee la advertencia que dice:
   "⚠️ ADVERTENCIA: Esto restaurará la base de datos desde [nombre]"
4. Confirma la restauración
5. Verás el mensaje:
   "✅ Base de datos restaurada desde: [backup_antiguo]
    🛡️ Backup de seguridad: [backup_actual]"
```

**QUÉ MOSTRAR AL PROFESOR (CRÍTICO):**
1. **Antes de restaurar:**
   - Ve a la página principal
   - Muestra las entradas actuales (por ejemplo, 10 entradas)
   
2. **Restaurar backup antiguo:**
   - Elige un backup de hace 2-3 creaciones atrás
   - Restaura ese backup específico
   
3. **Después de restaurar:**
   - Recarga la página principal
   - **DEMOSTRACIÓN**: Ahora hay menos entradas (por ejemplo, 7 entradas)
   - Las últimas 3 entradas desaparecieron porque restauraste un estado anterior
   
4. **Backup de seguridad:**
   - Ve a la página de backups
   - Muestra que se creó un backup automático antes de restaurar
   - Nombre: `mindcare_before_restore_[timestamp].db`
   - Este backup tiene el estado "actual" antes de restaurar

### Paso 6: Re-restaurar el Backup de Seguridad (OPCIONAL)
```
1. Localiza el backup "mindcare_before_restore_..."
2. Restaura ese backup
3. Verás que recuperas el estado actual
```

---

## 🎓 PUNTOS CLAVE PARA LA CALIFICACIÓN

### ✅ Funcionalidad Completa
- ✓ Crear backups manualmente desde el frontend
- ✓ Listar TODOS los backups disponibles
- ✓ Descargar CUALQUIER backup (no solo el último)
- ✓ Restaurar CUALQUIER backup específico (no solo el último)
- ✓ Eliminar backups
- ✓ Backup de seguridad automático antes de restaurar

### ✅ Demostración Visual
1. **Crear datos** → Crear backup → **Crear más datos** → Crear backup
2. **Mostrar múltiples backups** en la lista
3. **Restaurar un backup ANTIGUO** (no el último)
4. **Verificar que los datos volvieron** al estado antiguo
5. **Mostrar el backup de seguridad** creado automáticamente

### ✅ Seguridad
- Autenticación requerida (token JWT)
- Backup de seguridad antes de restaurar
- Confirmaciones antes de acciones críticas

---

## 🔧 Detalles Técnicos

### Backend (API Endpoints)
```
GET    /api/backup/list              - Lista todos los backups
POST   /api/backup/create            - Crea un nuevo backup
GET    /api/backup/download/:filename - Descarga un backup
POST   /api/backup/restore/:filename  - Restaura un backup
DELETE /api/backup/delete/:filename   - Elimina un backup
```

### Frontend (backup.html)
- Interfaz intuitiva con botones grandes
- Alertas visuales de éxito/error
- Confirmaciones antes de acciones destructivas
- Información detallada de cada backup

### Estructura de Archivos
```
MindCareAI1/
├── backups/                    # Carpeta de backups
│   ├── .gitkeep                # Para mantener la carpeta en Git
│   ├── mindcare_backup_2024-10-31T12-30-45.db
│   ├── mindcare_backup_2024-10-31T13-15-20.db
│   └── mindcare_before_restore_1730399876543.db
├── data/
│   └── mindcare.db             # Base de datos principal
├── public/
│   └── backup.html             # Interfaz de gestión
└── src/routes/
    └── backup.js               # Rutas del backend
```

---

## 📝 Script de Demostración Recomendado

**Para el profesor (5 minutos):**

1. **Preparación (1 min):**
   - Login en MindCare AI
   - Crea 3 entradas emocionales
   - Haz clic en "💾 Backups"
   - Crea primer backup (estado con 3 entradas)

2. **Generar cambios (1 min):**
   - Vuelve a inicio
   - Crea 2 entradas más (total 5)
   - Vuelve a Backups
   - Crea segundo backup (estado con 5 entradas)

3. **Demostración de restauración (2 min):**
   - Muestra la lista: 2 backups disponibles
   - Haz clic en el primer backup (el antiguo con 3 entradas)
   - Haz clic en "🔄 Restaurar"
   - Confirma la restauración
   - **Punto clave:** "Mira profesor, estoy restaurando el backup ANTIGUO, no el último"

4. **Verificación (1 min):**
   - Vuelve a la página principal
   - Muestra que ahora solo hay 3 entradas
   - "Las últimas 2 entradas desaparecieron porque restauramos el estado anterior"
   - Vuelve a Backups
   - Muestra el backup de seguridad creado automáticamente

5. **Extra (opcional):**
   - Descarga un backup para mostrar que se guarda localmente
   - Elimina un backup antiguo

---

## ⚠️ IMPORTANTE PARA LA DEMOSTRACIÓN

### ✅ SÍ hacer:
- Crear varios backups con estados diferentes
- Restaurar un backup ANTIGUO (no el último)
- Verificar visualmente el cambio en los datos
- Mostrar el backup de seguridad

### ❌ NO hacer:
- Solo crear un backup
- Solo restaurar el último backup
- No verificar que funcionó

---

## 🎯 Criterios de Evaluación Cubiertos

1. ✅ **Crear backups manualmente** - Botón "Crear Backup"
2. ✅ **Seleccionar backup específico** - Lista con todos los backups
3. ✅ **Restaurar backup elegido** - Botón "Restaurar" en cada backup
4. ✅ **Verificar restauración** - Cambios visibles en los datos
5. ✅ **Interfaz frontend** - Página dedicada con UI intuitiva
6. ✅ **Seguridad** - Backup automático antes de restaurar

---

## 🚀 ¡Listo para la Demostración!

El sistema está completo y funcional. Solo necesitas seguir los pasos de demostración para mostrar que puedes:
- ✅ Crear backups manualmente
- ✅ Ver todos los backups disponibles
- ✅ Elegir cualquier backup específico
- ✅ Restaurar ese backup elegido
- ✅ Verificar que funcionó

¡Buena suerte con la calificación! 🎓
