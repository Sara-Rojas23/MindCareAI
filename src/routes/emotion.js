const express = require('express');
const router = express.Router();
const EmotionController = require('../controllers/emotionController');
const AuthMiddleware = require('../middleware/auth');

// Crear instancia del controlador
const emotionController = new EmotionController();

// Ruta para analizar emociones (con autenticación opcional)
router.post('/analyze', 
    AuthMiddleware.optionalAuthenticate,
    emotionController.analyzeEmotion.bind(emotionController)
);

// Ruta para obtener recomendaciones (con autenticación opcional)
router.post('/recommendations', 
    AuthMiddleware.optionalAuthenticate,
    emotionController.getRecommendations.bind(emotionController)
);

// Rutas protegidas (requieren autenticación)

// Obtener historial de emociones del usuario
router.get('/history', 
    AuthMiddleware.authenticate,
    emotionController.getEmotionHistory.bind(emotionController)
);

// Obtener estadísticas del usuario
router.get('/stats', 
    AuthMiddleware.authenticate,
    emotionController.getUserStats.bind(emotionController)
);

module.exports = router;