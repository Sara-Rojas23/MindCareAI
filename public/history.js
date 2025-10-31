// MindCare AI - Historial de Emociones
const API_BASE_URL = '/api';
const ENTRIES_PER_PAGE = 10;

let currentPage = 1;
let totalPages = 1;
let allEntries = [];
let filteredEntries = [];

document.addEventListener('DOMContentLoaded', async function() {
    console.log(' Inicializando página de historial...');
    
    // Verificar autenticación
    if (!isAuthenticated()) {
        console.log(' Usuario no autenticado, redirigiendo...');
        window.location.href = '/login.html';
        return;
    }
    
    console.log(' Usuario autenticado');
    
    // Mostrar navbar y contenido principal
    const authNavbar = document.getElementById('authNavbar');
    const historyMain = document.getElementById('historyMain');
    
    if (authNavbar) {
        authNavbar.style.display = 'block';
        console.log(' Navbar mostrada');
    }
    
    if (historyMain) {
        historyMain.style.display = 'block';
        console.log(' Contenido principal mostrado');
    }
    
    setupNavbar();
    setupEventListeners();
    await loadHistory();
});

function isAuthenticated() {
    const token = localStorage.getItem('mindcare_token');
    const user = localStorage.getItem('mindcare_user');
    console.log(' Token presente:', !!token);
    console.log(' Usuario presente:', !!user);
    return !!(token && user);
}

function getUserData() {
    try {
        const userStr = localStorage.getItem('mindcare_user');
        return JSON.parse(userStr);
    } catch (e) {
        console.error(' Error parseando datos de usuario:', e);
        return null;
    }
}

function setupNavbar() {
    const user = getUserData();
    const userWelcome = document.getElementById('userWelcome');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (user && userWelcome) {
        userWelcome.textContent = user.name || user.email;
        console.log(' Bienvenida configurada para:', user.name);
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            console.log(' Cerrando sesión...');
            localStorage.clear();
            window.location.href = '/login.html';
        });
    }
}

function setupEventListeners() {
    const refreshBtn = document.getElementById('refreshHistory');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    if (refreshBtn) refreshBtn.addEventListener('click', () => {
        console.log(' Recargando historial...');
        loadHistory();
    });
    if (prevBtn) prevBtn.addEventListener('click', () => changePage(currentPage - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => changePage(currentPage + 1));
    
    console.log(' Event listeners configurados');
}

async function loadHistory() {
    try {
        console.log(' Iniciando carga de historial...');
        showLoading(true);
        
        const token = localStorage.getItem('mindcare_token');
        console.log(' Token para petición:', token ? token.substring(0, 20) + '...' : 'NO HAY TOKEN');
        
        const url = API_BASE_URL + '/emotions/history';
        console.log(' Haciendo petición a:', url);
        
        const response = await fetch(url, {
            headers: { 
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });
        
        console.log(' Respuesta recibida:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(' Error en respuesta:', errorText);
            throw new Error('Error al cargar historial: ' + response.status);
        }
        
        const data = await response.json();
        console.log(' Datos recibidos:', data);
        
        allEntries = data.emotions || [];
        filteredEntries = [...allEntries];
        
        console.log(' Entradas cargadas:', allEntries.length);
        
        calculatePagination();
        displayEntries();
        updateStatistics();
        
    } catch (error) {
        console.error(' Error cargando historial:', error);
        showError('Error al cargar el historial: ' + error.message);
    } finally {
        showLoading(false);
    }
}

function displayEntries() {
    console.log(' Mostrando entradas, total filtradas:', filteredEntries.length);
    
    const container = document.getElementById('entriesContainer');
    const historyList = document.getElementById('historyList');
    const emptyState = document.getElementById('emptyState');
    const loadingState = document.getElementById('loadingState');
    
    if (!container) {
        console.error(' No se encontró entriesContainer');
        return;
    }
    
    if (loadingState) loadingState.style.display = 'none';
    
    if (filteredEntries.length === 0) {
        console.log('ℹ No hay entradas, mostrando estado vacío');
        if (emptyState) emptyState.style.display = 'block';
        if (historyList) historyList.style.display = 'none';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    if (historyList) historyList.style.display = 'block';
    
    const start = (currentPage - 1) * ENTRIES_PER_PAGE;
    const end = start + ENTRIES_PER_PAGE;
    const pageEntries = filteredEntries.slice(start, end);
    
    console.log(' Mostrando entradas', start, '-', end, 'de', filteredEntries.length);
    
    container.innerHTML = pageEntries.map((e, i) => createEntryCard(e, start + i + 1)).join('');
    updatePaginationUI();
    
    console.log(' Entradas renderizadas');
}

function createEntryCard(entry, index) {
    const emoji = getEmotionEmoji(entry.emotion);
    const conf = Math.round(entry.confidence);
    const confClass = conf >= 80 ? 'confidence-high' : conf >= 60 ? 'confidence-medium' : 'confidence-low';
    const preview = entry.text ? entry.text.substring(0, 150) : '';
    const date = new Date(entry.created_at).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    return '<div class="history-entry"><div class="entry-header"><div class="emotion-badge"><span style="font-size: 2rem;">' + emoji + '</span><span style="font-weight: 600;">' + entry.emotion + '</span></div><span class="confidence-badge ' + confClass + '">' + conf + '%</span></div><div class="entry-meta" style="color: #666; font-size: 0.9rem; margin: 0.5rem 0;"><span> ' + date + '</span></div><div class="entry-preview" style="color: #333; line-height: 1.6;">' + preview + '</div></div>';
}

function getEmotionEmoji(emotion) {
    const emojis = {
        alegría: '😊',
        tristeza: '😢',
        enojo: '😠',
        miedo: '😰',
        estrés: '😫',
        calma: '😌',
        disgusto: '🤢',
        ansiedad: '😰',
        nostalgia: '🥺',
        joy: '😊',
        happiness: '😊',
        sadness: '😢',
        anger: '😠',
        fear: '😰',
        stress: '😫',
        calm: '😌',
        disgust: '🤢'
    };
    return emojis[emotion.toLowerCase()] || '😐';
}

function calculatePagination() {
    totalPages = Math.ceil(filteredEntries.length / ENTRIES_PER_PAGE);
    if (currentPage > totalPages) currentPage = Math.max(1, totalPages);
    console.log(' Paginación: página', currentPage, 'de', totalPages);
}

function changePage(newPage) {
    if (newPage < 1 || newPage > totalPages) return;
    console.log(' Cambiando a página', newPage);
    currentPage = newPage;
    displayEntries();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updatePaginationUI() {
    const pagination = document.getElementById('pagination');
    const info = document.getElementById('pageInfo');
    const prev = document.getElementById('prevPage');
    const next = document.getElementById('nextPage');
    
    if (totalPages > 1 && pagination) {
        pagination.style.display = 'flex';
    }
    
    if (info) {
        const start = (currentPage - 1) * ENTRIES_PER_PAGE + 1;
        const end = Math.min(currentPage * ENTRIES_PER_PAGE, filteredEntries.length);
        info.textContent = start + '-' + end + ' de ' + filteredEntries.length + ' | Página ' + currentPage + '/' + totalPages;
    }
    
    if (prev) {
        prev.disabled = currentPage === 1;
        prev.classList.toggle('disabled', currentPage === 1);
    }
    
    if (next) {
        next.disabled = currentPage === totalPages;
        next.classList.toggle('disabled', currentPage === totalPages);
    }
}

function updateStatistics() {
    console.log(' Actualizando estadísticas...');
    
    if (filteredEntries.length === 0) {
        console.log('ℹ No hay entradas para estadísticas');
        return;
    }
    
    const totalEl = document.getElementById('totalEntries');
    const topEmotionEl = document.getElementById('topEmotion');
    const avgConfEl = document.getElementById('avgConfidence');
    
    const counts = {};
    let totalConf = 0;
    
    filteredEntries.forEach(e => {
        counts[e.emotion] = (counts[e.emotion] || 0) + 1;
        totalConf += e.confidence;
    });
    
    const mostCommon = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    const avgConf = Math.round(totalConf / filteredEntries.length);
    
    if (totalEl) totalEl.textContent = filteredEntries.length;
    if (topEmotionEl) topEmotionEl.textContent = mostCommon + ' ' + getEmotionEmoji(mostCommon);
    if (avgConfEl) avgConfEl.textContent = avgConf + '%';
    
    console.log(' Estadísticas actualizadas: Total=' + filteredEntries.length + ', Principal=' + mostCommon + ', Confianza=' + avgConf + '%');
}

function showLoading(show) {
    const loadingState = document.getElementById('loadingState');
    const historyList = document.getElementById('historyList');
    const emptyState = document.getElementById('emptyState');
    
    if (show) {
        console.log(' Mostrando estado de carga');
        if (loadingState) loadingState.style.display = 'flex';
        if (historyList) historyList.style.display = 'none';
        if (emptyState) emptyState.style.display = 'none';
    } else {
        console.log(' Ocultando estado de carga');
        if (loadingState) loadingState.style.display = 'none';
    }
}

function showError(message) {
    console.error(' Mostrando error:', message);
    const container = document.getElementById('entriesContainer');
    if (container) {
        container.innerHTML = '<div class="error-state" style="text-align: center; padding: 3rem; background: #fff3f3; border-radius: 12px; border: 2px solid #ff6b6b;"><div style="font-size: 3rem; margin-bottom: 1rem;"></div><h3 style="color: #ff6b6b; margin-bottom: 1rem;">Error</h3><p style="color: #666;">' + message + '</p><button onclick="location.reload()" class="btn-primary" style="margin-top: 1rem;"> Reintentar</button></div>';
    }
}