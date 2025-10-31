// 🎭 MindCare AI - Análisis de Emociones
// Configuración de la aplicación  
const API_BASE_URL = (typeof window.API_BASE_URL !== 'undefined') ? window.API_BASE_URL : '/api';

// Elementos del DOM
const emotionForm = document.getElementById('emotionForm');
const emotionText = document.getElementById('emotionText');
const charCount = document.getElementById('charCount');
const analyzeBtn = document.getElementById('analyzeBtn');
const btnText = document.querySelector('.btn-text');
const loadingSpinner = document.querySelector('.loading-spinner');
const resultsSection = document.getElementById('resultsSection');
const newAnalysisBtn = document.getElementById('newAnalysisBtn');

// Estado de la aplicación
let isAnalyzing = false;
let showingFullHistory = false; // Para controlar si mostramos 5 o todas las entradas
let allHistoryEntries = []; // Guardar todas las entradas

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎭 Iniciando aplicación MindCare AI');
    setTimeout(initializeApp, 50);
});

// Verificar autenticación al cargar
function checkAuthenticationOnLoad() {
    const token = localStorage.getItem('mindcare_token');
    const user = localStorage.getItem('mindcare_user');
    
    if (token && user) {
        console.log('✅ Usuario autenticado');
        showAuthenticatedUI();
    } else {
        console.log('ℹ️ Usuario no autenticado');
        showUnauthenticatedUI();
    }
}

// Mostrar UI para usuarios autenticados
function showAuthenticatedUI() {
    const authButtons = document.getElementById('authButtons');
    const logoutButton = document.getElementById('logoutButton');
    
    if (authButtons) {
        authButtons.style.display = 'none';
    }
    
    if (logoutButton) {
        logoutButton.style.display = 'block';
    }
    
    try {
        const userData = JSON.parse(localStorage.getItem('mindcare_user'));
        const userWelcome = document.getElementById('userWelcome');
        if (userWelcome && userData && userData.name) {
            userWelcome.textContent = `👤 ${userData.name}`;
        }
    } catch (e) {
        console.error('Error al parsear datos del usuario:', e);
    }
}

// Mostrar UI para usuarios no autenticados
function showUnauthenticatedUI() {
    const authButtons = document.getElementById('authButtons');
    const logoutButton = document.getElementById('logoutButton');
    
    if (authButtons) {
        authButtons.style.display = 'flex';
    }
    
    if (logoutButton) {
        logoutButton.style.display = 'none';
    }
}

// Inicializar aplicación
function initializeApp() {
    console.log('🔧 Configurando aplicación...');
    
    // Verificar autenticación
    checkAuthenticationOnLoad();
    
    // Configurar contador de caracteres
    if (emotionText && charCount) {
        emotionText.addEventListener('input', updateCharCount);
    }
    
    // Configurar formulario
    if (emotionForm) {
        emotionForm.addEventListener('submit', handleSubmit);
    }
    
    // Botón de nuevo análisis
    if (newAnalysisBtn) {
        newAnalysisBtn.addEventListener('click', resetForm);
    }
    
    // Botón de cerrar sesión
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Botón de Ver Historial en el navbar
    const navHistoryBtn = document.getElementById('navHistoryBtn');
    if (navHistoryBtn) {
        navHistoryBtn.addEventListener('click', toggleFullHistory);
    }
    
    console.log('✅ Aplicación inicializada correctamente');
}

// Actualizar contador de caracteres
function updateCharCount() {
    const count = emotionText.value.length;
    charCount.textContent = `${count}/500`;
    
    if (count > 500) {
        charCount.style.color = '#e74c3c';
    } else if (count > 400) {
        charCount.style.color = '#f39c12';
    } else {
        charCount.style.color = '#666';
    }
}

// Manejar envío del formulario
async function handleSubmit(e) {
    e.preventDefault();
    
    if (isAnalyzing) return;
    
    const text = emotionText.value.trim();
    
    if (!text) {
        showError('⚠️ Por favor, escribe algo para analizar');
        return;
    }
    
    if (text.length < 10) {
        showError('⚠️ El texto debe tener al menos 10 caracteres');
        return;
    }
    
    if (text.length > 500) {
        showError('⚠️ El texto no puede exceder los 500 caracteres');
        return;
    }
    
    await analyzeEmotion(text);
}

// Analizar emoción
async function analyzeEmotion(text) {
    try {
        isAnalyzing = true;
        updateButtonState(true);
        
        console.log('🔍 Analizando texto...');
        
        const token = localStorage.getItem('mindcare_token');
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${API_BASE_URL}/emotions/analyze`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ text })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Error al analizar el texto');
        }
        
        console.log('✅ Análisis completado');
        console.log('📊 Datos recibidos:', data);
        
        // Normalizar la respuesta del servidor
        const analysisData = {
            emotion: data.data?.analysis?.primaryEmotion || 'calma',
            confidence: data.data?.analysis?.confidence || 60,
            feedback: data.data?.analysis?.context || 'Análisis completado'
        };
        
        displayResults(analysisData);
        
    } catch (error) {
        console.error('❌ Error en el análisis:', error);
        showError('❌ ' + error.message);
    } finally {
        isAnalyzing = false;
        updateButtonState(false);
    }
}

// Actualizar estado del botón
function updateButtonState(analyzing) {
    if (analyzing) {
        analyzeBtn.disabled = true;
        btnText.textContent = 'Analizando';
        loadingSpinner.classList.add('active');
    } else {
        analyzeBtn.disabled = false;
        btnText.textContent = 'Analizar Emoción';
        loadingSpinner.classList.remove('active');
    }
}

// Mostrar resultados
function displayResults(data) {
    const emotionName = document.getElementById('emotionName');
    const emotionEmoji = document.getElementById('emotionEmoji');
    const confidenceValue = document.getElementById('confidenceValue');
    const confidenceFill = document.querySelector('.confidence-fill');
    const feedbackText = document.getElementById('feedbackText');
    
    if (!emotionName || !emotionEmoji || !confidenceValue || !confidenceFill || !feedbackText) {
        console.error('❌ Elementos de resultados no encontrados');
        return;
    }
    
    // Obtener emoji según la emoción
    const emoji = getEmotionEmoji(data.emotion);
    
    // Actualizar contenido
    emotionName.textContent = data.emotion.charAt(0).toUpperCase() + data.emotion.slice(1);
    emotionEmoji.textContent = emoji;
    
    const confidence = Math.round(data.confidence);
    confidenceValue.textContent = `${confidence}%`;
    confidenceFill.style.width = `${confidence}%`;
    
    // Color según confianza
    if (confidence >= 80) {
        confidenceFill.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    } else if (confidence >= 60) {
        confidenceFill.style.background = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
    } else {
        confidenceFill.style.background = 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)';
    }
    
    // Retroalimentación
    feedbackText.textContent = data.feedback || generateFeedback(data.emotion, confidence);
    
    // Mostrar sección de resultados con animación
    resultsSection.classList.add('show');
    
    // Scroll suave a resultados
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // Cargar historial después del análisis
    console.log('📊 Cargando historial después del análisis...');
    setTimeout(() => {
        loadHistoryAfterAnalysis();
    }, 500);
}

// Nota: getEmotionEmoji() ahora está en shared-utils.js

// Generar retroalimentación
function generateFeedback(emotion, confidence) {
    if (!emotion) return 'Gracias por compartir tus sentimientos 💭';
    
    const emotionLower = emotion.toLowerCase();
    
    const feedbacks = {
        'alegría': [
            '¡Qué bueno leer que estás sintiendo alegría! 😊',
            '¡Me alegra que estés pasando por un buen momento! ✨',
            'La alegría es contagiosa. ¡Sigue así! 🌟'
        ],
        'tristeza': [
            'Entiendo que estés pasando por un momento difícil. Es válido sentirse así 💙',
            'La tristeza es parte de la vida. Recuerda que no estás solo 🤗',
            'Está bien sentirse triste. Permítete experimentar tus emociones 🌧️'
        ],
        'enojo': [
            'Noto que hay algo que te molesta. Es importante reconocer el enojo 🔥',
            'El enojo es una emoción válida. Trata de canalizarlo de forma constructiva 💪',
            'Reconocer tu enojo es el primer paso para gestionarlo 🎯'
        ],
        'miedo': [
            'Es comprensible que sientas miedo. Enfrentar los temores requiere valentía 🛡️',
            'El miedo nos protege, pero no dejes que te paralice 🌟',
            'Está bien tener miedo. Eres más fuerte de lo que crees 💪'
        ],
        'sorpresa': [
            '¡Veo que algo te ha sorprendido! La vida está llena de momentos inesperados ✨',
            '¡Qué interesante! Las sorpresas nos mantienen alertas 🎊',
            'Las sorpresas le dan sabor a la vida 🎁'
        ],
        'ansiedad': [
            'La ansiedad puede ser abrumadora. Respira profundo, estás seguro 🌊',
            'Es válido sentir ansiedad. Toma un momento para ti 🧘',
            'La ansiedad es una respuesta natural. Enfócate en el presente 🌸'
        ],
        'estrés': [
            'El estrés es señal de que necesitas un descanso. Cuida de ti 🌿',
            'Identifica lo que te estresa y busca formas de aliviarlo 💆',
            'El estrés es temporal. Respira y toma las cosas con calma 🍃'
        ],
        'calma': [
            'Qué bien que te sientas en calma. Disfruta este estado de paz 🕊️',
            'La calma es un regalo. Aprovecha este momento de tranquilidad 🌅',
            'La serenidad que sientes es valiosa. Cultívala 🧘‍♀️'
        ],
        'nostalgia': [
            'Los recuerdos son parte de nuestra historia. Honra el pasado pero vive el presente 📖',
            'La nostalgia nos conecta con momentos especiales 🕰️',
            'Es hermoso recordar. Esos momentos te han formado ⭐'
        ],
        'joy': [
            '¡Qué bueno leer que estás sintiendo alegría! 😊',
            '¡Me alegra que estés pasando por un buen momento! ✨',
            'La alegría es contagiosa. ¡Sigue así! 🌟'
        ],
        'happiness': [
            '¡Qué maravilloso que te sientas feliz! 🎉',
            'La felicidad se refleja en tus palabras. ¡Disfrútala! 💫',
            '¡Es hermoso verte tan feliz! Sigue cultivando esa emoción 🌈'
        ],
        'sadness': [
            'Entiendo que estés pasando por un momento difícil. Es válido sentirse así 💙',
            'La tristeza es parte de la vida. Recuerda que no estás solo 🤗',
            'Está bien sentirse triste. Permítete experimentar tus emociones 🌧️'
        ],
        'anger': [
            'Noto que hay algo que te molesta. Es importante reconocer el enojo 🔥',
            'El enojo es una emoción válida. Trata de canalizarlo de forma constructiva 💪',
            'Reconocer tu enojo es el primer paso para gestionarlo 🎯'
        ],
        'fear': [
            'Es comprensible que sientas miedo. Enfrentar los temores requiere valentía 🛡️',
            'El miedo nos protege, pero no dejes que te paralice 🌟',
            'Está bien tener miedo. Eres más fuerte de lo que crees 💪'
        ],
        'surprise': [
            '¡Veo que algo te ha sorprendido! La vida está llena de momentos inesperados ✨',
            '¡Qué interesante! Las sorpresas nos mantienen alertas 🎊',
            'Las sorpresas le dan sabor a la vida 🎁'
        ],
        'love': [
            '¡Qué hermoso sentimiento! El amor es una de las emociones más poderosas ❤️',
            'El amor que expresas es inspirador 💕',
            '¡Qué maravilloso es el amor! Sigue compartiendo esa energía 💖'
        ],
        'neutral': [
            'A veces estar en calma está bien. No todas las emociones son intensas 😌',
            'La neutralidad también es importante. Te da espacio para reflexionar 🧘',
            'Estar en un estado neutral te permite observar con claridad 👁️'
        ]
    };
    
    const emotionFeedbacks = feedbacks[emotionLower] || [
        'Gracias por compartir tus sentimientos 💭',
        'Es importante reconocer nuestras emociones 🎭',
        'Tus emociones son válidas 💫'
    ];
    
    return emotionFeedbacks[Math.floor(Math.random() * emotionFeedbacks.length)];
}

// Resetear formulario
function resetForm() {
    emotionText.value = '';
    updateCharCount();
    resultsSection.classList.remove('show');
    emotionText.focus();
}

// Mostrar error
function showError(message) {
    // Usar el modal del sistema de auth si existe
    if (typeof window.showErrorModal === 'function') {
        window.showErrorModal(message);
    } else {
        // Fallback a alert si no hay modal
        alert(message);
    }
}

// Cerrar sesión
function handleLogout() {
    console.log('👋 Cerrando sesión...');
    localStorage.removeItem('mindcare_token');
    localStorage.removeItem('mindcare_user');
    showUnauthenticatedUI();
    resetForm();
    
    // Ocultar historial
    const historySection = document.getElementById('historySection');
    if (historySection) {
        historySection.style.display = 'none';
    }
    
    if (typeof window.showSuccessModal === 'function') {
        window.showSuccessModal('👋 Sesión cerrada exitosamente');
    }
}

// ===== FUNCIONALIDAD DE HISTORIAL INTEGRADO =====

// Cargar historial después de un análisis exitoso
function loadHistoryAfterAnalysis() {
    console.log('📊 Mostrando sección de historial...');
    const token = localStorage.getItem('mindcare_token');
    
    if (!token) {
        console.log('⚠️ No hay token, no se puede cargar historial');
        return;
    }
    
    // Mostrar sección de historial
    const historySection = document.getElementById('historySection');
    if (historySection) {
        historySection.style.display = 'block';
    }
    
    // Cargar datos
    loadHistoryData();
}

// Cargar datos del historial desde la API
async function loadHistoryData() {
    console.log('🔍 Solicitando historial de emociones...');
    
    const historyLoading = document.getElementById('historyLoading');
    const historyEntries = document.getElementById('historyEntries');
    
    // Mostrar estado de carga
    if (historyLoading) historyLoading.style.display = 'block';
    if (historyEntries) historyEntries.style.display = 'none';
    
    try {
        const token = localStorage.getItem('mindcare_token');
        const response = await fetch(`${API_BASE_URL}/emotions/history`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📡 Respuesta del servidor:', response.status);
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('✅ Datos recibidos:', result);
        
        if (historyLoading) historyLoading.style.display = 'none';
        
        // El endpoint devuelve { success: true, data: { entries: [...], stats: [...] } }
        const entries = result.data?.entries || result.data;
        
        if (result.success && entries && entries.length > 0) {
            console.log(`📝 Mostrando ${entries.length} entradas`);
            displayHistoryEntries(entries);
        } else {
            console.log('📝 No hay entradas en el historial');
            if (historyEntries) {
                historyEntries.innerHTML = '<p style="text-align: center; color: #718096; padding: 20px;">📝 Aún no tienes entradas en tu historial.</p>';
                historyEntries.style.display = 'block';
            }
        }
        
    } catch (error) {
        console.error('❌ Error al cargar historial:', error);
        if (historyLoading) historyLoading.style.display = 'none';
        if (historyEntries) {
            historyEntries.innerHTML = `
                <p style="text-align: center; color: #e53e3e; padding: 20px;">⚠️ Error al cargar el historial<br>${error.message}</p>
            `;
            historyEntries.style.display = 'block';
        }
    }
}

// Mostrar entradas del historial en el DOM
function displayHistoryEntries(entries) {
    console.log(`📝 Mostrando ${entries.length} entradas`);
    
    const historyEntries = document.getElementById('historyEntries');
    if (!historyEntries) return;
    
    historyEntries.innerHTML = '';
    historyEntries.style.display = 'grid';
    
    // Guardar todas las entradas globalmente
    allHistoryEntries = entries;
    
    // Mostrar 5 o todas según el estado
    const entriesToShow = showingFullHistory ? entries : entries.slice(0, 5);
    
    entriesToShow.forEach(entry => {
        const entryElement = createHistoryEntry(entry);
        historyEntries.appendChild(entryElement);
    });
    
    // Actualizar texto del botón según el estado
    const navHistoryBtn = document.getElementById('navHistoryBtn');
    if (navHistoryBtn && entries.length > 5) {
        navHistoryBtn.textContent = showingFullHistory ? 
            `📊 Ver menos (${entries.length} totales)` : 
            `📊 Ver Historial Completo (${entries.length} entradas)`;
    }
    
    console.log(`✅ Mostrando ${entriesToShow.length} de ${entries.length} entradas`);
}

// Crear elemento HTML para una entrada del historial
function createHistoryEntry(entry) {
    const div = document.createElement('div');
    div.className = 'history-entry';
    
    const emoji = getEmotionEmoji(entry.emotion); // Función compartida
    const formattedDate = formatDate(entry.created_at); // Función compartida
    const preview = truncateText(entry.text, 150); // Función compartida
    
    div.innerHTML = `
        <div class="history-entry-header">
            <div class="history-entry-emotion">
                <span style="font-size: 1.5rem;">${emoji}</span>
                <span>${entry.emotion}</span>
            </div>
            <span class="history-entry-date">${formattedDate}</span>
        </div>
        <div class="history-entry-text">"${preview}"</div>
        <div class="history-entry-confidence">
            Confianza: ${Math.round(entry.confidence)}%
        </div>
    `;
    
    return div;
}

// Alternar entre mostrar todas las entradas o solo las últimas 5
function toggleFullHistory() {
    console.log('🔄 Alternando vista de historial');
    
    // Cambiar el estado
    showingFullHistory = !showingFullHistory;
    
    // Si no hay entradas cargadas, cargar primero
    if (allHistoryEntries.length === 0) {
        loadHistoryAfterAnalysis();
        return;
    }
    
    // Mostrar el historial con el nuevo estado
    displayHistoryEntries(allHistoryEntries);
    
    // Hacer scroll suave hacia la sección de historial
    const historySection = document.getElementById('historySection');
    if (historySection && historySection.style.display !== 'none') {
        historySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    console.log(`✅ Mostrando ${showingFullHistory ? 'TODAS' : 'últimas 5'} las entradas`);
}

console.log('✅ Script de aplicación cargado');
