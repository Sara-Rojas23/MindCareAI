# MindCare AI - Diario Emocional MVP

Un MVP (Producto Mínimo Viable) de una aplicación web de diario emocional que utiliza inteligencia artificial para analizar emociones y proporcionar recomendaciones personalizadas.

## 🚀 Características

- **Análisis de emociones con IA**: Utiliza OpenAI GPT-3.5 para detectar emociones en texto
- **Análisis de respaldo**: Sistema fallback con palabras clave si la API no está disponible
- **Recomendaciones personalizadas**: Consejos y actividades basados en la emoción detectada
- **Interfaz moderna**: UI responsiva con animaciones y diseño atractivo
- **Análisis en tiempo real**: Resultados inmediatos con porcentajes de confianza

## 📁 Estructura del proyecto

```
MindCareAI1/
├── src/
│   ├── controllers/
│   │   └── emotionController.js    # Lógica de control para emociones
│   ├── services/
│   │   └── emotionService.js       # Servicio de análisis de IA
│   └── routes/
│       └── emotion.js              # Rutas de la API
├── public/
│   ├── index.html                  # Página principal
│   ├── styles.css                  # Estilos CSS
│   └── app.js                      # JavaScript del frontend
├── server.js                       # Servidor Express
├── package.json                    # Dependencias del proyecto
├── .env.example                    # Variables de entorno (ejemplo)
├── .gitignore                      # Archivos a ignorar en git
└── README.md                       # Este archivo
```

## 🛠️ Instalación y configuración

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Copia el archivo de ejemplo y configura tu API key de OpenAI:

```bash
cp .env.example .env
```

Edita el archivo `.env` y agrega tu API key de OpenAI:

```env
OPENAI_API_KEY=tu_api_key_de_openai_aqui
PORT=3000
NODE_ENV=development
```

### 3. Obtener una API Key de OpenAI

1. Ve a [OpenAI API](https://platform.openai.com/api-keys)
2. Crea una cuenta o inicia sesión
3. Genera una nueva API key
4. Copia la key al archivo `.env`

**Nota**: Si no tienes API key, la aplicación funcionará con el sistema de análisis de respaldo basado en palabras clave.

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

## 🚧 Funcionalidades futuras (Roadmap)

- [ ] Sistema de autenticación de usuarios
- [ ] Base de datos para historial de emociones
- [ ] Visualización de datos con gráficas
- [ ] Seguimiento de hábitos diarios
- [ ] Exportar datos para profesionales
- [ ] Notificaciones y recordatorios
- [ ] Análisis de tendencias emocionales

## 🛡️ Seguridad y privacidad

- No se almacenan datos personales en esta versión MVP
- Las consultas a la API son temporales
- Manejo de errores seguro
- Validación de entrada de datos

## 📱 Compatibilidad

- ✅ Chrome, Firefox, Safari, Edge
- ✅ Dispositivos móviles y tablets
- ✅ Diseño responsivo

## 🤝 Contribuir

Este es un MVP en desarrollo. Las contribuciones son bienvenidas:

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

ISC License - ver archivo LICENSE para detalles

## 🆘 Solución de problemas

### Error: "API Key no configurada"
- Asegúrate de tener un archivo `.env` con `OPENAI_API_KEY`
- Verifica que la API key sea válida

### Error: "No se pudo conectar con el servidor"
- Verifica que el servidor esté ejecutándose en el puerto correcto
- Revisa que no haya conflictos de puertos

### El análisis no funciona
- La aplicación funcionará con el sistema de respaldo
- Revisa la consola del navegador para más detalles

## 📞 Contacto

Desarrollado como MVP para demostrar capacidades de análisis emocional con IA.

---

**Versión**: 1.0.0  
**Estado**: MVP - Producto Mínimo Viable  
**Tecnologías**: Node.js, Express, OpenAI API, HTML5, CSS3, JavaScript ES6