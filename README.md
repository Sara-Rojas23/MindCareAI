# 🧠 MindCare AI - Diario Emocional Inteligente

Sistema web de análisis emocional con inteligencia artificial que ayuda a las personas a comprender y gestionar mejor sus emociones a través de un diario interactivo.

## ✨ Características Principales

- 🎭 **Análisis de Emociones con IA**: Detección inteligente de emociones en español usando OpenAI GPT-3.5
- 🔐 **Sistema de Autenticación**: Login y registro seguro con JWT y bcrypt
- 💬 **Retroalimentación Personalizada**: Mensajes personalizados según la emoción detectada
- 📊 **Visualización Interactiva**: Emojis animados y barras de progreso para mostrar resultados
- 💾 **Historial de Emociones**: Guarda todas las entradas emocionales en SQLite
- 🎨 **Interfaz Moderna**: Diseño responsivo con animaciones suaves
- 🔄 **Sistema Fallback**: Análisis por palabras clave cuando la API no está disponible

## 🎯 Emociones Detectadas

El sistema reconoce y analiza las siguientes emociones en español:

- 😊 Alegría
- 😢 Tristeza  
- 😠 Enojo
- 😨 Miedo
- 😲 Sorpresa
- 😖 Disgusto
- 😰 Ansiedad
- 😓 Estrés
- 😌 Calma
- 🥺 Nostalgia

## 📁 Estructura del Proyecto

```
MindCareAI1/
├── src/
│   ├── controllers/
│   │   ├── authController.js       # Lógica de autenticación
│   │   └── emotionController.js    # Lógica de análisis emocional
│   ├── services/
│   │   └── emotionService.js       # Servicio de IA con OpenAI
│   ├── middleware/
│   │   └── auth.js                 # Middleware de autenticación JWT
│   ├── models/
│   │   ├── database.js             # Configuración de SQLite
│   │   └── User.js                 # Modelo de usuario
│   └── routes/
│       ├── auth.js                 # Rutas de autenticación
│       └── emotion.js              # Rutas de emociones
├── public/
│   ├── index.html                  # Página principal
│   ├── login.html                  # Página de inicio de sesión
│   ├── register.html               # Página de registro
│   ├── history.html                # Historial de emociones
│   ├── styles.css                  # Estilos CSS globales
│   ├── mindcare-auth.js            # Sistema de autenticación frontend
│   └── app-clean.js                # Lógica de análisis frontend
├── data/
│   └── mindcare.db                 # Base de datos SQLite
├── server.js                       # Servidor Express principal
├── package.json                    # Dependencias del proyecto
├── .env.example                    # Variables de entorno (ejemplo)
├── .gitignore                      # Archivos excluidos de Git
└── README.md                       # Este archivo
```

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** - Entorno de ejecución
- **Express.js** - Framework web
- **SQLite3** - Base de datos
- **OpenAI API** - Análisis de emociones con IA
- **JWT** - Autenticación con tokens
- **bcryptjs** - Hash de contraseñas
- **express-validator** - Validación de datos

### Frontend
- **HTML5** - Estructura
- **CSS3** - Estilos y animaciones
- **JavaScript ES6+** - Lógica del cliente
- **Fetch API** - Comunicación con el servidor

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/MindCareAI.git
cd MindCareAI
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo de ejemplo y configura tu API key de OpenAI:

```bash
cp .env.example .env
```

Edita el archivo `.env` y configura las variables:

```env
OPENAI_API_KEY=tu_api_key_de_openai_aqui
PORT=3000
NODE_ENV=development
JWT_SECRET=tu_secreto_jwt_aqui
```

### 4. Iniciar el servidor

```bash
npm start
```

El servidor estará disponible en: `http://localhost:3000`

## 📝 Uso de la Aplicación

### 1. Registro de Usuario
- Navega a la página de registro
- Completa el formulario con tu nombre, email y contraseña
- Haz clic en "Registrarse"

### 2. Iniciar Sesión
- Ingresa tu email y contraseña
- El sistema te redirigirá a la página principal

### 3. Analizar Emociones
- Escribe sobre cómo te sientes (mínimo 10 caracteres)
- Haz clic en "Analizar Emoción"
- Verás:
  - 😊 Emoji animado de la emoción detectada
  - Nombre de la emoción en español
  - Barra de progreso con nivel de confianza
  - Retroalimentación personalizada

### 4. Ver Historial
- Todas tus entradas se guardan automáticamente
- Accede al historial para ver tu progreso emocional

## 🔑 API Endpoints

### Autenticación

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Tu Nombre",
  "email": "tu@email.com",
  "password": "tuPassword123"
}
```

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "tu@email.com",
  "password": "tuPassword123"
}
```

### Análisis de Emociones

```http
POST /api/emotions/analyze
Authorization: Bearer <tu_token_jwt>
Content-Type: application/json

{
  "text": "Hoy me siento muy feliz porque logré terminar mi proyecto"
}
```

```http
GET /api/emotions/history
Authorization: Bearer <tu_token_jwt>
```

## 🎨 Características de la Interfaz

- ✅ **Responsive Design**: Funciona en móviles, tablets y escritorio
- ✅ **Animaciones Suaves**: Transiciones fluidas entre estados
- ✅ **Emojis Animados**: Emoji con animación bounceIn al aparecer
- ✅ **Barra de Progreso**: Animación de llenado para mostrar confianza
- ✅ **Feedback Visual**: Colores y mensajes según la emoción
- ✅ **Gestión de Sesión**: Botones dinámicos según estado de autenticación

## 🔒 Seguridad

- 🔐 Contraseñas hasheadas con bcrypt (10 rounds)
- 🎫 Autenticación con JWT (JSON Web Tokens)
- 🛡️ Validación de datos con express-validator
- 🔒 Middleware de autenticación para rutas protegidas
- 🚫 Protección contra inyección SQL (prepared statements)

## 🚀 Ejecutar la aplicación

### Modo desarrollo
```bash
npm run dev
```

### Modo producción
```bash
npm start
```

La aplicación estará disponible en: `http://localhost:3000`

## 🔧 API Endpoints

### Analizar emociones
```
POST /api/emotions/analyze
Content-Type: application/json

{
  "text": "Texto a analizar..."
}
```

### Obtener recomendaciones
```
POST /api/emotions/recommendations
Content-Type: application/json

{
  "emotion": "alegría",
  "context": "contexto del análisis"
}
```

## 🎯 Cómo usar la aplicación

1. **Escribir texto**: Describe cómo te sientes en el área de texto
2. **Analizar**: Haz clic en "Analizar mis emociones"
3. **Ver resultados**: Observa la emoción principal, porcentaje de confianza y desglose
4. **Leer recomendaciones**: Revisa los consejos y actividades personalizadas
5. **Nuevo análisis**: Haz clic en "Realizar nuevo análisis" para empezar de nuevo

## 🧠 Emociones detectadas

El sistema puede identificar las siguientes emociones:

- Alegría
- Tristeza
- Enojo
- Miedo
- Sorpresa
- Disgusto
- Ansiedad
- Estrés
- Calma
- Nostalgia

## 🔄 Sistema de respaldo

Si la API de OpenAI no está disponible, el sistema utiliza un análisis basado en palabras clave que:

- Identifica palabras relacionadas con emociones
- Calcula porcentajes basados en coincidencias
- Proporciona un análisis básico pero funcional

## 🚧 Roadmap - Próximas Funcionalidades

- [ ] Gráficas de tendencias emocionales
- [ ] Exportar historial en PDF/CSV
- [ ] Notificaciones y recordatorios
- [ ] Temas oscuro/claro
- [ ] Integración con calendarios
- [ ] Análisis de patrones emocionales
- [ ] Recomendaciones de profesionales

## 📊 Base de Datos

### Tabla Users
```sql
- id: INTEGER PRIMARY KEY
- name: TEXT NOT NULL
- email: TEXT UNIQUE NOT NULL  
- password: TEXT NOT NULL (hasheada)
- created_at: DATETIME DEFAULT CURRENT_TIMESTAMP
```

### Tabla emotion_entries
```sql
- id: INTEGER PRIMARY KEY
- user_id: INTEGER (FK a users)
- text: TEXT NOT NULL
- emotion: TEXT NOT NULL
- confidence: REAL NOT NULL
- created_at: DATETIME DEFAULT CURRENT_TIMESTAMP
```

## � Solución de Problemas

### La aplicación no carga
```bash
# Verifica que el servidor esté corriendo
npm start

# Revisa el puerto
netstat -ano | findstr :3000
```

### Error de autenticación
- Asegúrate de que `JWT_SECRET` esté configurado en `.env`
- Verifica que la contraseña tenga al menos 6 caracteres
- Limpia el localStorage del navegador

### Error con OpenAI API
- Verifica que tu API key sea válida
- Revisa que tengas créditos en tu cuenta de OpenAI
- La app funcionará con análisis de respaldo si no hay API key

### Base de datos corrupta
```bash
# Elimina y recrea la base de datos
rm data/mindcare.db
npm start
```

## 📚 Documentación Técnica

### Arquitectura
```
Cliente (Browser) <-> Express.js <-> SQLite
                          |
                          v
                    OpenAI API
```

### Flujo de Autenticación
1. Usuario se registra/inicia sesión
2. Servidor valida credenciales
3. Genera token JWT
4. Cliente almacena token en localStorage
5. Token se envía en headers para rutas protegidas

### Flujo de Análisis
1. Usuario escribe texto
2. Frontend envía POST a `/api/emotions/analyze`
3. Backend procesa con OpenAI o fallback
4. Respuesta normalizada al frontend
5. Frontend muestra resultados con animaciones

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! 

### Cómo contribuir
1. 🍴 Fork el proyecto
2. 🌿 Crea una rama (`git checkout -b feature/NuevaCaracteristica`)
3. 💾 Commit tus cambios (`git commit -m 'Agregar nueva característica'`)
4. 📤 Push a la rama (`git push origin feature/NuevaCaracteristica`)
5. 🔃 Abre un Pull Request

### Código de Conducta
- Sé respetuoso con otros colaboradores
- Escribe código limpio y documentado
- Prueba tus cambios antes de hacer PR

## 📄 Licencia

Este proyecto está bajo la Licencia ISC - ver el archivo LICENSE para más detalles.

## 👨‍💻 Autor

Desarrollado con ❤️ para ayudar a las personas a comprender y gestionar mejor sus emociones.

## 🙏 Agradecimientos

- OpenAI por su increíble API
- Comunidad de Node.js
- Todos los que contribuyan al proyecto

---

**📌 Estado del Proyecto**: ✅ Funcional y en Producción  
**📅 Última Actualización**: Octubre 2025  
**🔖 Versión**: 1.0.0  
**⚡ Stack**: Node.js + Express + SQLite + OpenAI + JWT

---

### 💡 ¿Necesitas ayuda?

Si encuentras algún problema o tienes preguntas:
1. Revisa la sección de Solución de Problemas
2. Busca en los Issues existentes
3. Crea un nuevo Issue con detalles

### ⭐ ¿Te gusta el proyecto?

¡Dale una estrella en GitHub! ⭐

---

**Made with 🧠 and 💻 | MindCare AI © 2025**