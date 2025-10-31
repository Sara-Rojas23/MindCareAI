// ===== MindCare AI - Historial de Emociones =====
const API_BASE_URL = (typeof window.API_BASE_URL !== 'undefined') ? window.API_BASE_URL : '/api';
const ENTRIES_PER_PAGE = 10;

let currentPage = 1;
let totalPages = 1;
let allEntries = [];
let filteredEntries = [];

// Inicialización
document.addEventListener('DOMContentLoaded', async function() {
    console.log('📖 Inicializando página de historial');
    
    if (!isAuthenticated()) {
        console.log('❌ Usuario no autenticado');
        window.location.href = '/login.html';
        return;
    }

    console.log('✅ Usuario autenticado');
    setupNavbar();
    setupEventListeners();
    await loadHistory();
});


// Funciones de autenticación
function isAuthenticated() {
    return !!(localStorage.getItem('mindcare_token') && localStorage.getItem('mindcare_user'));
}

function getUserData() {
    try {
        return JSON.parse(localStorage.getItem('mindcare_user'));
    } catch (e) {
        return null;
    }
}

function setupNavbar() {
    const user = getUserData();
    const userWelcome = document.getElementById('userWelcome');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (user && userWelcome) {
        userWelcome.textContent = `👤 ${user.name}`;
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = '/login.html';
        });
    }
}

function setupEventListeners() {
    const applyBtn = document.getElementById('applyFilters');
    const clearBtn = document.getElementById('clearFilters');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    if (applyBtn) applyBtn.addEventListener('click', applyFilters);
    if (clearBtn) clearBtn.addEventListener('click', clearFilters);
    if (prevBtn) prevBtn.addEventListener('click', () => changePage(currentPage - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => changePage(currentPage + 1));
}

// Carga de datos
async function loadHistory() {
    try {
        console.log('📊 Cargando historial...');
        showLoading(true);
        
        const token = localStorage.getItem('mindcare_token');
        const response = await fetch(`${API_BASE_URL}/emotions/history`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Error al cargar historial');

        const data = await response.json();
        allEntries = data.emotions || [];
        filteredEntries = [...allEntries];
        
        console.log(`✅ ${allEntries.length} entradas cargadas`);
        
        calculatePagination();
        displayEntries();
        updateStatistics();
    } catch (error) {
        console.error('❌ Error:', error);
        showError('Error al cargar el historial');
    } finally {
        showLoading(false);
    }
}

// Visualización de entradas
function displayEntries() {
    const container = document.getElementById('historyContainer');
    if (!container) return;
    
    if (filteredEntries.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <h3>No hay entradas disponibles</h3>
                <p>Comienza a registrar tus emociones</p>
                <a href="/" class="btn btn-primary">✏️ Crear entrada</a>
            </div>
        `;
        return;
    }
    
    const start = (currentPage - 1) * ENTRIES_PER_PAGE;
    const end = start + ENTRIES_PER_PAGE;
    const pageEntries = filteredEntries.slice(start, end);
    
    container.innerHTML = pageEntries.map((e, i) => createEntryCard(e, start + i + 1)).join('');
    updatePaginationUI();
}

function createEntryCard(entry, index) {
    const emoji = getEmotionEmoji(entry.emotion);
    const date = formatDate(entry.created_at);
    const conf = Math.round(entry.confidence);
    const confClass = conf >= 80 ? 'confidence-high' : conf >= 60 ? 'confidence-medium' : 'confidence-low';
    const preview = entry.text.substring(0, 150) + (entry.text.length > 150 ? '...' : '');
    
    return `
        <div class="history-entry" onclick="showEntryDetails(${entry.id})">
            <div class="entry-header">
                <div class="emotion-badge">
                    <span class="emotion-emoji">${emoji}</span>
                    <span class="emotion-name">${entry.emotion}</span>
                </div>
                <span class="confidence-badge ${confClass}">${conf}%</span>
            </div>
            <div class="entry-meta">
                <span class="entry-number">#${index}</span>
                <span class="entry-date">📅 ${date}</span>
            </div>
            <div class="entry-preview">${preview}</div>
            <button class="view-details-btn" onclick="event.stopPropagation(); showEntryDetails(${entry.id})">
                Ver detalles 👁️
            </button>
        </div>
    `;
}

function getEmotionEmoji(emotion) {
    const emojis = {
        joy: '😊', happiness: '😄', sadness: '😢', anger: '😠',
        fear: '😰', surprise: '😲', love: '❤️', neutral: '😐',
        disgust: '😖', anxiety: '😰', excitement: '🤩', calm: '😌'
    };
    return emojis[emotion.toLowerCase()] || '🤔';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const days = Math.floor((now - date) / 86400000);
    
    if (days === 0) {
        return `Hoy ${date.toLocaleTimeString('es-ES', {hour:'2-digit',minute:'2-digit'})}`;
    } else if (days === 1) {
        return `Ayer ${date.toLocaleTimeString('es-ES', {hour:'2-digit',minute:'2-digit'})}`;
    }
    return date.toLocaleDateString('es-ES', {
        day:'numeric', month:'short', year:'numeric',
        hour:'2-digit', minute:'2-digit'
    });
}

// Modal de detalles
function showEntryDetails(entryId) {
    const entry = filteredEntries.find(e => e.id === entryId) || allEntries.find(e => e.id === entryId);
    if (!entry) return;
    
    const emoji = getEmotionEmoji(entry.emotion);
    const date = formatDate(entry.created_at);
    const conf = Math.round(entry.confidence);
    const confClass = conf >= 80 ? 'confidence-high' : conf >= 60 ? 'confidence-medium' : 'confidence-low';
    
    const modal = `
        <div class="modal-overlay" onclick="closeModal()">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <div class="modal-title">
                        <span class="emotion-emoji-large">${emoji}</span>
                        <h2>${entry.emotion}</h2>
                    </div>
                    <button class="modal-close" onclick="closeModal()">✖️</button>
                </div>
                <div class="modal-body">
                    <div class="detail-row">
                        <strong>📅 Fecha:</strong>
                        <span>${date}</span>
                    </div>
                    <div class="detail-row">
                        <strong>🎯 Confianza:</strong>
                        <span class="confidence-badge ${confClass}">${conf}%</span>
                    </div>
                    <div class="detail-text">
                        <strong>📝 Texto completo:</strong>
                        <p>${entry.text}</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button onclick="closeModal()" class="btn btn-secondary">Cerrar</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modal);
}

function closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) modal.remove();
}

// Paginación
function calculatePagination() {
    totalPages = Math.ceil(filteredEntries.length / ENTRIES_PER_PAGE);
    if (currentPage > totalPages) currentPage = Math.max(1, totalPages);
}

function changePage(newPage) {
    if (newPage < 1 || newPage > totalPages) return;
    currentPage = newPage;
    displayEntries();
    window.scrollTo({top:0,behavior:'smooth'});
}

function updatePaginationUI() {
    const info = document.getElementById('pageInfo');
    const prev = document.getElementById('prevPage');
    const next = document.getElementById('nextPage');
    
    if (info) {
        const start = (currentPage - 1) * ENTRIES_PER_PAGE + 1;
        const end = Math.min(currentPage * ENTRIES_PER_PAGE, filteredEntries.length);
        info.textContent = `${start}-${end} de ${filteredEntries.length} | Página ${currentPage}/${totalPages}`;
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

// Estadísticas
function updateStatistics() {
    const stats = document.getElementById('statsContainer');
    if (!stats || filteredEntries.length === 0) return;
    
    const counts = {};
    let totalConf = 0;
    
    filteredEntries.forEach(e => {
        counts[e.emotion] = (counts[e.emotion] || 0) + 1;
        totalConf += e.confidence;
    });
    
    const mostCommon = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    const avgConf = Math.round(totalConf / filteredEntries.length);
    
    stats.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon">📈</div>
            <div class="stat-content">
                <h4>Total de entradas</h4>
                <p class="stat-value">${filteredEntries.length}</p>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">${getEmotionEmoji(mostCommon)}</div>
            <div class="stat-content">
                <h4>Emoción frecuente</h4>
                <p class="stat-value">${mostCommon}</p>
                <small>${counts[mostCommon]} veces</small>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">🎯</div>
            <div class="stat-content">
                <h4>Confianza promedio</h4>
                <p class="stat-value">${avgConf}%</p>
            </div>
        </div>
    `;
}

// Filtros
function applyFilters() {
    const emotion = (document.getElementById('emotionFilter')?.value || '').toLowerCase();
    const start = document.getElementById('startDate')?.value || '';
    const end = document.getElementById('endDate')?.value || '';
    const minC = parseFloat(document.getElementById('confidenceMin')?.value) || 0;
    const maxC = parseFloat(document.getElementById('confidenceMax')?.value) || 100;
    
    filteredEntries = allEntries.filter(e => {
        if (emotion && !e.emotion.toLowerCase().includes(emotion)) return false;
        if (start && new Date(e.created_at) < new Date(start)) return false;
        if (end) {
            const endDate = new Date(end);
            endDate.setHours(23,59,59);
            if (new Date(e.created_at) > endDate) return false;
        }
        if (e.confidence < minC || e.confidence > maxC) return false;
        return true;
    });
    
    currentPage = 1;
    calculatePagination();
    displayEntries();
    updateStatistics();
}

function clearFilters() {
    ['emotionFilter','startDate','endDate'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    
    const minC = document.getElementById('confidenceMin');
    const maxC = document.getElementById('confidenceMax');
    if (minC) minC.value = '0';
    if (maxC) maxC.value = '100';
    
    filteredEntries = [...allEntries];
    currentPage = 1;
    calculatePagination();
    displayEntries();
    updateStatistics();
}

// Utilidades
function showLoading(show) {
    const container = document.getElementById('historyContainer');
    if (!container) return;
    
    if (show) {
        container.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>⏳ Cargando historial...</p>
            </div>
        `;
    }
}

function showError(message) {
    const container = document.getElementById('historyContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div class="error-state">
            <div class="error-icon">⚠️</div>
            <h3>Error</h3>
            <p>${message}</p>
            <button onclick="location.reload()" class="btn btn-primary">🔄 Reintentar</button>
        </div>
    `;
}

// Exportar funciones globales
window.showEntryDetails = showEntryDetails;
window.closeModal = closeModal;

console.log('📖 History.js cargado correctamente');