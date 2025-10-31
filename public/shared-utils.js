// 🔧 MindCare AI - Utilidades Compartidas
// Funciones reutilizables entre diferentes módulos

/**
 * Obtiene el emoji correspondiente a una emoción
 * @param {string} emotion - Nombre de la emoción en español o inglés
 * @returns {string} - Emoji representativo
 */
function getEmotionEmoji(emotion) {
    if (!emotion) return '🎭';
    
    const emotionLower = emotion.toLowerCase();
    
    const emojis = {
        // Español
        'alegría': '😊',
        'tristeza': '😢',
        'enojo': '😠',
        'miedo': '😨',
        'sorpresa': '😲',
        'disgusto': '😖',
        'ansiedad': '😰',
        'estrés': '😓',
        'calma': '😌',
        'nostalgia': '🥺',
        // Inglés
        'joy': '😊',
        'happiness': '😄',
        'sadness': '😢',
        'anger': '😠',
        'fear': '😨',
        'surprise': '😲',
        'love': '❤️',
        'neutral': '😐',
        'anxiety': '😰',
        'stress': '😓',
        'disgust': '😖',
        'calm': '😌'
    };
    
    return emojis[emotionLower] || '🎭';
}

/**
 * Formatea una fecha en español
 * @param {string|Date} dateString - Fecha a formatear
 * @param {boolean} includeTime - Si incluir hora y minutos
 * @returns {string} - Fecha formateada
 */
function formatDate(dateString, includeTime = true) {
    const date = new Date(dateString);
    const options = {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    };
    
    if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
    }
    
    return date.toLocaleDateString('es-ES', options);
}

/**
 * Obtiene clase CSS según nivel de confianza
 * @param {number} confidence - Porcentaje de confianza (0-100)
 * @returns {string} - Nombre de clase CSS
 */
function getConfidenceClass(confidence) {
    const conf = Math.round(confidence);
    if (conf >= 80) return 'confidence-high';
    if (conf >= 60) return 'confidence-medium';
    return 'confidence-low';
}

/**
 * Verifica si el usuario está autenticado
 * @returns {boolean} - True si hay token y datos de usuario
 */
function isAuthenticated() {
    const token = localStorage.getItem('mindcare_token');
    const user = localStorage.getItem('mindcare_user');
    return !!(token && user);
}

/**
 * Obtiene datos del usuario desde localStorage
 * @returns {Object|null} - Datos del usuario o null si hay error
 */
function getUserData() {
    try {
        const userStr = localStorage.getItem('mindcare_user');
        return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
        console.error('❌ Error parseando datos de usuario:', e);
        return null;
    }
}

/**
 * Trunca texto a una longitud máxima
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @returns {string} - Texto truncado con "..." si excede
 */
function truncateText(text, maxLength = 150) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

console.log('✅ Utilidades compartidas cargadas');
