// MindCare AI - Historial de Emociones
const API_BASE_URL = '/api';
const ENTRIES_PER_PAGE = 10;

let currentPage = 1;
let totalPages = 1;
let allEntries = [];
let filteredEntries = [];

document.addEventListener('DOMContentLoaded', async function() {
    console.log('📖 Inicializando página de historial...');
    
    // Verificar autenticación
    const token = localStorage.getItem('mindcare_token');
    const user = localStorage.getItem('mindcare_user');
    
    if (!token || !user) {
        console.log('⚠️ Usuario no autenticado, redirigiendo...');
        window.location.href = '/login.html';
        return;
    }
    
    console.log('✅ Usuario autenticado');
    
    // Mostrar navbar y contenido principal
    const authNavbar = document.getElementById('authNavbar');
    const historyMain = document.getElementById('historyMain');
    
    if (authNavbar) authNavbar.style.display = 'block';
    if (historyMain) historyMain.style.display = 'block';
    
    setupNavbar();
    setupEventListeners();
    await loadHistory();
});

function setupNavbar() {
    try {
        const userStr = localStorage.getItem('mindcare_user');
        const user = JSON.parse(userStr);
        const userWelcome = document.getElementById('userWelcome');
        const logoutBtn = document.getElementById('logoutBtn');
        
        if (user && userWelcome) {
            userWelcome.textContent = user.name || user.email;
        }
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.clear();
                window.location.href = '/login.html';
            });
        }
    } catch (e) {
        console.error('❌ Error configurando navbar:', e);
    }
}

function setupEventListeners() {
    const refreshBtn = document.getElementById('refreshHistory');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    if (refreshBtn) refreshBtn.addEventListener('click', () => loadHistory());
    if (prevBtn) prevBtn.addEventListener('click', () => changePage(currentPage - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => changePage(currentPage + 1));
}

async function loadHistory() {
    try {
        console.log('🔍 Cargando historial...');
        showLoading(true);
        
        const token = localStorage.getItem('mindcare_token');
        const response = await fetch(`${API_BASE_URL}/emotions/history`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📡 Respuesta:', response.status);
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Datos recibidos:', data);
        
        // Extraer entradas (igual que en app-clean.js)
        allEntries = data.data?.entries || data.entries || [];
        filteredEntries = [...allEntries];
        
        console.log(`📝 Total entradas: ${allEntries.length}`);
        
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

function displayEntries() {
    const container = document.getElementById('entriesContainer');
    const historyList = document.getElementById('historyList');
    const emptyState = document.getElementById('emptyState');
    const loadingState = document.getElementById('loadingState');
    
    if (!container) return;
    
    if (loadingState) loadingState.style.display = 'none';
    
    if (filteredEntries.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        if (historyList) historyList.style.display = 'none';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    if (historyList) historyList.style.display = 'block';
    
    const start = (currentPage - 1) * ENTRIES_PER_PAGE;
    const end = start + ENTRIES_PER_PAGE;
    const pageEntries = filteredEntries.slice(start, end);
    
    // Usar la MISMA función que app-clean.js
    container.innerHTML = '';
    pageEntries.forEach(entry => {
        const entryElement = createHistoryEntry(entry);
        container.appendChild(entryElement);
    });
    
    updatePaginationUI();
}

// EXACTAMENTE la misma función que app-clean.js - usa funciones compartidas
function createHistoryEntry(entry) {
    const div = document.createElement('div');
    div.className = 'history-entry';
    
    const emoji = getEmotionEmoji(entry.emotion); // De shared-utils.js
    const formattedDate = formatDate(entry.created_at); // De shared-utils.js
    const preview = truncateText(entry.text, 150); // De shared-utils.js
    
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

// ⚠️ Las funciones getEmotionEmoji, formatDate, truncateText vienen de shared-utils.js
// NO redefinir aquí para evitar duplicados

function calculatePagination() {
    totalPages = Math.ceil(filteredEntries.length / ENTRIES_PER_PAGE);
    if (currentPage > totalPages) currentPage = Math.max(1, totalPages);
}

function changePage(newPage) {
    if (newPage < 1 || newPage > totalPages) return;
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
        info.textContent = `${start}-${end} de ${filteredEntries.length} | Página ${currentPage}/${totalPages}`;
    }
    
    if (prev) {
        prev.disabled = currentPage === 1;
    }
    
    if (next) {
        next.disabled = currentPage === totalPages;
    }
}

function updateStatistics() {
    if (filteredEntries.length === 0) return;
    
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
    if (topEmotionEl) topEmotionEl.textContent = `${mostCommon} ${getEmotionEmoji(mostCommon)}`;
    if (avgConfEl) avgConfEl.textContent = `${avgConf}%`;
}

function showLoading(show) {
    const loadingState = document.getElementById('loadingState');
    const historyList = document.getElementById('historyList');
    const emptyState = document.getElementById('emptyState');
    
    if (show) {
        if (loadingState) loadingState.style.display = 'flex';
        if (historyList) historyList.style.display = 'none';
        if (emptyState) emptyState.style.display = 'none';
    } else {
        if (loadingState) loadingState.style.display = 'none';
    }
}

function showError(message) {
    const container = document.getElementById('entriesContainer');
    if (container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #e53e3e;">
                <h3>⚠️ ${message}</h3>
                <button onclick="location.reload()" class="btn-secondary" style="margin-top: 20px;">
                    🔄 Reintentar
                </button>
            </div>
        `;
    }
}

// ⚠️⚠️⚠️ TODAS las funciones principales ya están definidas ARRIBA ⚠️⚠️⚠️
// NO duplicar: setupNavbar, setupEventListeners, loadHistory, displayEntries
// calculatePagination, changePage, updatePaginationUI, updateStatistics,
// showLoading, showError, createHistoryEntry
// ⛔ TODO EL CÓDIGO DUPLICADO FUE ELIMINADO ⛔
