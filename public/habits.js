// habits.js - Lógica del frontend para el módulo de hábitos

const API_URL = 'http://localhost:3000/api';
let currentEditingHabitId = null;

// ==========================================
// UTILIDADES DE AUTENTICACIÓN
// ==========================================
// Nota: TOKEN_KEY y USER_KEY ya están definidas en mindcare-auth.js

function getAuthToken() {
    const TOKEN_KEY = 'mindcare_token';
    const token = localStorage.getItem(TOKEN_KEY);
    console.log('🔑 Token obtenido:', token ? `${token.substring(0, 20)}...` : 'null');
    return token;
}

function getCurrentUser() {
    const USER_KEY = 'mindcare_user';
    const userStr = localStorage.getItem(USER_KEY);
    const user = userStr ? JSON.parse(userStr) : null;
    console.log('👤 Usuario obtenido:', user ? user.name : 'null');
    return user;
}

function checkAuth() {
    const token = getAuthToken();
    const user = getCurrentUser();
    
    if (!token || !user) {
        console.log('❌ No hay token o usuario, redirigiendo a login');
        window.location.href = 'login.html';
        return null;
    }
    
    console.log('✅ Autenticación verificada');
    return user;
}

// ==========================================
// INICIALIZACIÓN
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎯 Módulo de hábitos iniciado');

    // Verificar autenticación
    const user = checkAuth();
    if (!user) {
        return;
    }

    // Mostrar nombre del usuario
    const userWelcome = document.getElementById('userWelcome');
    if (userWelcome) {
        userWelcome.textContent = `Hola, ${user.name}`;
    }

    // Configurar event listeners
    setupEventListeners();

    // Cargar datos iniciales
    await loadHabitsData();
    
    // Verificar si hay parámetros para crear hábito desde recomendaciones
    checkUrlParamsForHabitCreation();
});

// ==========================================
// EVENT LISTENERS
// ==========================================

function setupEventListeners() {
    // Botón agregar hábito
    const addHabitBtn = document.getElementById('addHabitBtn');
    if (addHabitBtn) {
        addHabitBtn.addEventListener('click', openCreateHabitModal);
    }

    // Cerrar modal
    const closeModal = document.getElementById('closeModal');
    if (closeModal) {
        closeModal.addEventListener('click', closeHabitModal);
    }

    // Cancelar
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeHabitModal);
    }

    // Cerrar modal al hacer clic fuera
    const modal = document.getElementById('habitModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeHabitModal();
            }
        });
    }

    // Formulario de hábito
    const habitForm = document.getElementById('habitForm');
    if (habitForm) {
        habitForm.addEventListener('submit', handleSaveHabit);
    }

    // Selector de color
    const habitColor = document.getElementById('habitColor');
    if (habitColor) {
        habitColor.addEventListener('input', (e) => {
            document.getElementById('colorValue').textContent = e.target.value;
        });
    }

    // Selector de frecuencia - mostrar/ocultar días personalizados
    const habitFrequency = document.getElementById('habitFrequency');
    const customDaysSection = document.getElementById('customDaysSection');
    if (habitFrequency && customDaysSection) {
        habitFrequency.addEventListener('change', (e) => {
            if (e.target.value === 'personalizada') {
                customDaysSection.style.display = 'block';
            } else {
                customDaysSection.style.display = 'none';
            }
        });
    }

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Modal de progreso - Cerrar
    const closeProgressModal = document.getElementById('closeProgressModal');
    if (closeProgressModal) {
        closeProgressModal.addEventListener('click', () => {
            document.getElementById('progressModal').style.display = 'none';
        });
    }
    
    // Modal de progreso - Cerrar al hacer clic fuera
    const progressModal = document.getElementById('progressModal');
    if (progressModal) {
        progressModal.addEventListener('click', (e) => {
            if (e.target === progressModal) {
                progressModal.style.display = 'none';
            }
        });
    }
}

// ==========================================
// CREAR HÁBITO DESDE RECOMENDACIONES
// ==========================================

function checkUrlParamsForHabitCreation() {
    const urlParams = new URLSearchParams(window.location.search);
    const shouldCreate = urlParams.get('create');
    
    if (shouldCreate === 'true') {
        const name = urlParams.get('name');
        const category = urlParams.get('category');
        const description = urlParams.get('description');
        
        console.log('📝 Abriendo modal con datos prellenados:', { name, category, description });
        
        // Abrir modal de creación
        openCreateHabitModal();
        
        // Prellenar formulario después de un pequeño delay para asegurar que el modal está abierto
        setTimeout(() => {
            if (name) {
                const nameInput = document.getElementById('habitName');
                if (nameInput) nameInput.value = name;
            }
            
            if (category) {
                const categorySelect = document.getElementById('habitCategory');
                if (categorySelect) categorySelect.value = category;
            }
            
            if (description) {
                const descriptionInput = document.getElementById('habitDescription');
                if (descriptionInput) descriptionInput.value = description;
            }
            
            // Limpiar URL sin recargar la página
            window.history.replaceState({}, document.title, window.location.pathname);
        }, 100);
    }
}

// ==========================================
// CARGAR DATOS
// ==========================================

async function loadHabitsData() {
    try {
        // Cargar estadísticas
        await loadStats();

        // Cargar hábitos de hoy
        await loadTodayHabits();

    } catch (error) {
        console.error('Error al cargar datos:', error);
        showNotification('Error al cargar los datos', 'error');
    }
}

async function loadStats() {
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/habits/stats`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            const stats = data.stats;
            document.getElementById('completedToday').textContent = stats.completadosHoy;
            document.getElementById('activeHabits').textContent = stats.habitosActivos;
            document.getElementById('bestStreak').textContent = stats.mejorRacha;
            document.getElementById('percentageToday').textContent = stats.porcentajeHoy + '%';
        }

    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
    }
}

async function loadTodayHabits() {
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/habits/today`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            displayHabits(data.habits);
        } else {
            throw new Error(data.error || 'Error al cargar hábitos');
        }

    } catch (error) {
        console.error('Error al cargar hábitos:', error);
        showNotification('Error al cargar los hábitos', 'error');
    }
}

// ==========================================
// MOSTRAR HÁBITOS
// ==========================================

function displayHabits(habits) {
    const habitsList = document.getElementById('habitsList');
    const emptyState = document.getElementById('emptyState');

    if (!habits || habits.length === 0) {
        habitsList.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    habitsList.innerHTML = habits.map(habit => createHabitCard(habit)).join('');

    // Agregar event listeners a los checkboxes
    habits.forEach(habit => {
        const checkbox = document.getElementById(`habit-${habit.habitId}`);
        if (checkbox) {
            checkbox.addEventListener('change', () => handleToggleHabit(habit.habitId, checkbox.checked));
        }

        // Botón editar
        const editBtn = document.getElementById(`edit-${habit.habitId}`);
        if (editBtn) {
            editBtn.addEventListener('click', () => openEditHabitModal(habit.habitId));
        }

        // Botón eliminar
        const deleteBtn = document.getElementById(`delete-${habit.habitId}`);
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => handleDeleteHabit(habit.habitId, habit.nombre));
        }

        // Botón mi progreso del hábito
        const viewProgressBtn = document.getElementById(`view-progress-${habit.habitId}`);
        if (viewProgressBtn) {
            viewProgressBtn.addEventListener('click', () => openProgressModal(habit.habitId, habit.nombre));
        }
    });
}

function createHabitCard(habit) {
    // Ya no mostramos racha individual, solo racha global en las estadísticas
    
    return `
        <div class="habit-card" style="border-left: 4px solid ${habit.color}">
            <div class="habit-checkbox">
                <input 
                    type="checkbox" 
                    id="habit-${habit.habitId}" 
                    ${habit.completado ? 'checked' : ''}
                    class="habit-checkbox-input"
                >
                <label for="habit-${habit.habitId}" class="habit-checkbox-label"></label>
            </div>
            
            <div class="habit-content">
                <div class="habit-header">
                    <div class="habit-info">
                        <span class="habit-icon">${habit.icono}</span>
                        <span class="habit-name ${habit.completado ? 'completed' : ''}">${habit.nombre}</span>
                    </div>
                    <div class="habit-actions">
                        <button class="habit-action-btn view-habit-progress-btn" id="view-progress-${habit.habitId}" title="Mi progreso">
                            📊 Mi progreso
                        </button>
                        <button class="habit-action-btn" id="edit-${habit.habitId}" title="Editar">
                            ✏️
                        </button>
                        <button class="habit-action-btn danger" id="delete-${habit.habitId}" title="Eliminar">
                            🗑️
                        </button>
                    </div>
                </div>
                
                ${habit.descripcion ? `<p class="habit-description">${habit.descripcion}</p>` : ''}
                
                <div class="habit-meta">
                    <span class="habit-category">${getCategoryLabel(habit.categoria)}</span>
                    <span class="habit-frequency">${getFrequencyLabel(habit.frecuencia)}</span>
                    ${habit.completado && habit.horaCompletado ? `<span class="habit-time">⏰ ${habit.horaCompletado}</span>` : ''}
                </div>
            </div>
        </div>
    `;
}

function getCategoryLabel(category) {
    const labels = {
        mental: '🧘‍♀️ Mental',
        fisico: '💪 Físico',
        descanso: '😴 Descanso',
        nutricion: '🍎 Nutrición',
        personal: '📚 Personal'
    };
    return labels[category] || category;
}

function getFrequencyLabel(frequency) {
    const labels = {
        diaria: '📅 Diaria',
        semanal: '📆 Semanal',
        personalizada: '⚙️ Personalizada'
    };
    return labels[frequency] || frequency;
}

// ==========================================
// MODAL
// ==========================================

function openCreateHabitModal() {
    currentEditingHabitId = null;
    document.getElementById('modalTitle').textContent = 'Crear nuevo hábito';
    document.getElementById('habitForm').reset();
    document.getElementById('habitColor').value = '#6366f1';
    document.getElementById('colorValue').textContent = '#6366f1';
    
    // Ocultar sección de días personalizados
    document.getElementById('customDaysSection').style.display = 'none';
    
    // Desmarcar todos los checkboxes de días
    document.querySelectorAll('input[name="customDays"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    document.getElementById('habitModal').style.display = 'block';
}

async function openEditHabitModal(habitId) {
    try {
        currentEditingHabitId = habitId;
        document.getElementById('modalTitle').textContent = 'Editar hábito';

        const token = getAuthToken();
        const response = await fetch(`${API_URL}/habits/${habitId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            const habit = data.habit;
            document.getElementById('habitName').value = habit.name;
            document.getElementById('habitDescription').value = habit.description || '';
            document.getElementById('habitCategory').value = habit.category;
            document.getElementById('habitFrequency').value = habit.frequency;
            document.getElementById('habitIcon').value = habit.icon;
            document.getElementById('habitColor').value = habit.color;
            document.getElementById('colorValue').textContent = habit.color;

            // Si es frecuencia personalizada, mostrar y marcar los días
            if (habit.frequency === 'personalizada' && habit.custom_schedule) {
                document.getElementById('customDaysSection').style.display = 'block';
                
                // Parsear los días guardados
                const customDays = JSON.parse(habit.custom_schedule);
                
                // Desmarcar todos primero
                document.querySelectorAll('input[name="customDays"]').forEach(checkbox => {
                    checkbox.checked = false;
                });
                
                // Marcar los días guardados
                customDays.forEach(day => {
                    const checkbox = document.querySelector(`input[name="customDays"][value="${day}"]`);
                    if (checkbox) {
                        checkbox.checked = true;
                    }
                });
            } else {
                document.getElementById('customDaysSection').style.display = 'none';
            }

            document.getElementById('habitModal').style.display = 'block';
        } else {
            throw new Error(data.error);
        }

    } catch (error) {
        console.error('Error al cargar hábito:', error);
        showNotification('Error al cargar el hábito', 'error');
    }
}

function closeHabitModal() {
    document.getElementById('habitModal').style.display = 'none';
    currentEditingHabitId = null;
    
    // Ocultar sección de días personalizados al cerrar
    document.getElementById('customDaysSection').style.display = 'none';
}

// ==========================================
// GUARDAR HÁBITO
// ==========================================

async function handleSaveHabit(e) {
    e.preventDefault();

    const saveBtn = document.getElementById('saveHabitBtn');
    const btnText = saveBtn.querySelector('.btn-text');
    const spinner = saveBtn.querySelector('.loading-spinner');

    try {
        // Mostrar loading
        btnText.style.display = 'none';
        spinner.style.display = 'inline-block';
        saveBtn.disabled = true;

        const habitData = {
            name: document.getElementById('habitName').value.trim(),
            description: document.getElementById('habitDescription').value.trim(),
            category: document.getElementById('habitCategory').value,
            frequency: document.getElementById('habitFrequency').value,
            icon: document.getElementById('habitIcon').value || '⭐',
            color: document.getElementById('habitColor').value
        };

        // Si es frecuencia personalizada, obtener los días seleccionados
        if (habitData.frequency === 'personalizada') {
            const customDays = [];
            const checkboxes = document.querySelectorAll('input[name="customDays"]:checked');
            
            if (checkboxes.length === 0) {
                showNotification('Debes seleccionar al menos un día para la frecuencia personalizada', 'error');
                return;
            }
            
            checkboxes.forEach(checkbox => {
                customDays.push(parseInt(checkbox.value));
            });
            
            // Guardar como JSON en custom_schedule
            habitData.custom_schedule = JSON.stringify(customDays);
        }

        const token = getAuthToken();
        const url = currentEditingHabitId 
            ? `${API_URL}/habits/${currentEditingHabitId}`
            : `${API_URL}/habits`;
        
        const method = currentEditingHabitId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(habitData)
        });

        const data = await response.json();

        if (data.success) {
            showNotification(
                currentEditingHabitId ? 'Hábito actualizado' : 'Hábito creado exitosamente',
                'success'
            );
            closeHabitModal();
            await loadHabitsData();
        } else {
            throw new Error(data.message || 'Error al guardar el hábito');
        }

    } catch (error) {
        console.error('Error al guardar hábito:', error);
        showNotification(error.message || 'Error al guardar el hábito', 'error');
    } finally {
        btnText.style.display = 'inline';
        spinner.style.display = 'none';
        saveBtn.disabled = false;
    }
}

// ==========================================
// TOGGLE HÁBITO (COMPLETAR/DESMARCAR)
// ==========================================

async function handleToggleHabit(habitId, isCompleted) {
    try {
        const token = getAuthToken();
        const endpoint = isCompleted ? 'complete' : 'uncomplete';

        const response = await fetch(`${API_URL}/habits/${habitId}/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            // Recargar datos para actualizar estadísticas y rachas
            await loadHabitsData();
            
            if (isCompleted) {
                showNotification('¡Hábito completado! 🎉', 'success');
            }
        } else {
            throw new Error(data.message);
        }

    } catch (error) {
        console.error('Error al actualizar hábito:', error);
        showNotification('Error al actualizar el hábito', 'error');
        
        // Revertir checkbox
        const checkbox = document.getElementById(`habit-${habitId}`);
        if (checkbox) {
            checkbox.checked = !checkbox.checked;
        }
    }
}

// ==========================================
// ELIMINAR HÁBITO
// ==========================================

async function handleDeleteHabit(habitId, habitName) {
    if (!confirm(`¿Estás seguro de que quieres eliminar el hábito "${habitName}"?\n\nEsta acción no se puede deshacer y se perderá todo el historial.`)) {
        return;
    }

    try {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/habits/${habitId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Hábito eliminado', 'success');
            await loadHabitsData();
        } else {
            throw new Error(data.message);
        }

    } catch (error) {
        console.error('Error al eliminar hábito:', error);
        showNotification('Error al eliminar el hábito', 'error');
    }
}

// ==========================================
// MODAL DE PROGRESO
// ==========================================

async function openProgressModal(habitId, habitName) {
    console.log('🎯 openProgressModal llamado:', { habitId, habitName });
    
    const modal = document.getElementById('progressModal');
    const modalTitle = document.getElementById('progressModalTitle');
    const progressContent = document.getElementById('progressContent');
    
    console.log('📦 Elementos del modal:', { modal, modalTitle, progressContent });
    
    if (!modal || !modalTitle || !progressContent) {
        console.error('❌ No se encontraron los elementos del modal');
        alert('Error: Modal no encontrado. Recarga la página.');
        return;
    }
    
    modalTitle.textContent = `📊 Mi Progreso - ${habitName}`;
    
    // Mostrar loading
    progressContent.innerHTML = `
        <div class="loading-message">
            <div class="loading-spinner"></div>
            <p>Cargando progreso...</p>
        </div>
    `;
    
    modal.style.display = 'block';
    console.log('✅ Modal mostrado');
    
    try {
        const token = getAuthToken();
        
        // Cargar datos de progreso
        const [weekResponse, monthResponse, statsResponse] = await Promise.all([
            fetch(`${API_URL}/habits/${habitId}/progress/week`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`${API_URL}/habits/${habitId}/progress/month`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`${API_URL}/habits/${habitId}/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]);
        
        const weekData = await weekResponse.json();
        const monthData = await monthResponse.json();
        const statsData = await statsResponse.json();
        
        console.log('📊 Datos recibidos:', { weekData, monthData, statsData });
        
        if (weekData.success && monthData.success && statsData.success) {
            displayProgressData(weekData.progress, monthData.progress, statsData.stats);
        } else {
            throw new Error('Error al cargar datos de progreso');
        }
        
    } catch (error) {
        console.error('Error al cargar progreso:', error);
        progressContent.innerHTML = `
            <div class="error-message">
                <p>❌ Error al cargar el progreso</p>
                <button onclick="document.getElementById('closeProgressModal').click()" class="btn-secondary">Cerrar</button>
            </div>
        `;
    }
}

function displayProgressData(weekData, monthData, statsData) {
    const progressContent = document.getElementById('progressContent');
    
    console.log('📊 Mostrando datos:', { weekData, monthData, statsData });
    
    // Calcular porcentaje semanal
    const completedDays = weekData.estadisticas.completados;
    const totalDays = weekData.estadisticas.total;
    const weekPercentage = weekData.estadisticas.porcentaje;
    
    progressContent.innerHTML = `
        <div class="progress-stats-grid">
            <div class="progress-stat-card">
                <div class="progress-stat-icon">📅</div>
                <div class="progress-stat-value">${completedDays}/${totalDays}</div>
                <div class="progress-stat-label">Días completados esta semana</div>
            </div>
            
            <div class="progress-stat-card">
                <div class="progress-stat-icon">📊</div>
                <div class="progress-stat-value">${monthData.porcentaje}%</div>
                <div class="progress-stat-label">Cumplimiento mensual</div>
            </div>
            
            <div class="progress-stat-card">
                <div class="progress-stat-icon">🔥</div>
                <div class="progress-stat-value">${statsData.rachaActual || 0}</div>
                <div class="progress-stat-label">Racha actual</div>
            </div>
            
            <div class="progress-stat-card">
                <div class="progress-stat-icon">⭐</div>
                <div class="progress-stat-value">${statsData.totalCompletado || 0}</div>
                <div class="progress-stat-label">Total completado</div>
            </div>
        </div>
        
        <div class="progress-section">
            <h3>📆 Últimos 7 días</h3>
            <div class="week-calendar">
                ${weekData.progreso.map(day => `
                    <div class="day-card ${day.completado ? 'completed' : 'incomplete'}">
                        <div class="day-name">${day.diaSemana}</div>
                        <div class="day-date">${formatDate(day.fecha)}</div>
                        <div class="day-status">${day.completado ? '✅' : '⭕'}</div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="progress-section">
            <h3>📈 Progreso Semanal</h3>
            <div class="progress-bar-container">
                <div class="progress-bar-fill" style="width: ${weekPercentage}%"></div>
                <span class="progress-bar-text">${weekPercentage}%</span>
            </div>
        </div>
        
        <div class="progress-section">
            <h3>🏆 Logros</h3>
            <div class="achievements-grid">
                ${(statsData.rachaActual || 0) >= 7 ? '<div class="achievement-badge">🔥 Racha de 7 días</div>' : ''}
                ${(statsData.totalCompletado || 0) >= 30 ? '<div class="achievement-badge">⭐ 30 completados</div>' : ''}
                ${monthData.porcentaje >= 80 ? '<div class="achievement-badge">💪 80% mensual</div>' : ''}
                ${(statsData.totalCompletado || 0) >= 100 ? '<div class="achievement-badge">🎯 100 completados</div>' : ''}
                ${completedDays === 7 ? '<div class="achievement-badge">✨ Semana perfecta</div>' : ''}
                ${!(statsData.rachaActual || 0) && !(statsData.totalCompletado || 0) ? '<div class="no-achievements">🌱 ¡Sigue así para desbloquear logros!</div>' : ''}
            </div>
        </div>
    `;
}

function getDayName(dateString) {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const date = new Date(dateString + 'T00:00:00');
    return days[date.getDay()];
}

function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    return `${date.getDate()}/${date.getMonth() + 1}`;
}

// ==========================================
// UTILIDADES
// ==========================================

function showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Agregar al DOM
    document.body.appendChild(notification);

    // Mostrar con animación
    setTimeout(() => notification.classList.add('show'), 100);

    // Ocultar y eliminar después de 3 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

async function handleLogout() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        const TOKEN_KEY = 'mindcare_token';
        const USER_KEY = 'mindcare_user';
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        window.location.href = 'login.html';
    }
}

// ==========================================
// SISTEMA DE LOGROS
// ==========================================

// Definición de todos los logros disponibles
const ACHIEVEMENTS = [
    {
        id: 'first_habit',
        title: 'Primer Paso',
        description: 'Crea tu primer hábito',
        icon: '🌱',
        category: 'inicio',
        target: 1,
        checkProgress: (stats) => stats.totalHabits || 0,
        reward: 'Desbloqueas la capacidad de crear hábitos ilimitados'
    },
    {
        id: 'habit_collector',
        title: 'Coleccionista de Hábitos',
        description: 'Crea 5 hábitos diferentes',
        icon: '📚',
        category: 'inicio',
        target: 5,
        checkProgress: (stats) => stats.totalHabits || 0,
        reward: 'Desbloqueas nuevas categorías de hábitos'
    },
    {
        id: 'first_completion',
        title: 'Primera Victoria',
        description: 'Completa un hábito por primera vez',
        icon: '✨',
        category: 'completado',
        target: 1,
        checkProgress: (stats) => stats.totalCompletado || 0,
        reward: 'Motivación para seguir adelante'
    },
    {
        id: 'ten_completions',
        title: 'En Marcha',
        description: 'Completa 10 hábitos en total',
        icon: '🎯',
        category: 'completado',
        target: 10,
        checkProgress: (stats) => stats.totalCompletado || 0,
        reward: 'Insignia de Principiante'
    },
    {
        id: 'thirty_completions',
        title: 'Dedicado',
        description: 'Completa 30 hábitos en total',
        icon: '⭐',
        category: 'completado',
        target: 30,
        checkProgress: (stats) => stats.totalCompletado || 0,
        reward: 'Insignia de Compromiso'
    },
    {
        id: 'fifty_completions',
        title: 'Imparable',
        description: 'Completa 50 hábitos en total',
        icon: '💪',
        category: 'completado',
        target: 50,
        checkProgress: (stats) => stats.totalCompletado || 0,
        reward: 'Insignia de Perseverancia'
    },
    {
        id: 'hundred_completions',
        title: 'Centurión',
        description: 'Completa 100 hábitos en total',
        icon: '👑',
        category: 'completado',
        target: 100,
        checkProgress: (stats) => stats.totalCompletado || 0,
        reward: 'Insignia de Maestría'
    },
    {
        id: 'streak_3',
        title: 'Constante',
        description: 'Mantén una racha global de 3 días',
        icon: '🔥',
        category: 'racha',
        target: 3,
        checkProgress: (stats) => stats.bestStreak || 0,
        reward: 'Insignia de Consistencia'
    },
    {
        id: 'streak_7',
        title: 'Semana Perfecta',
        description: 'Mantén una racha global de 7 días',
        icon: '🌟',
        category: 'racha',
        target: 7,
        checkProgress: (stats) => stats.bestStreak || 0,
        reward: 'Insignia de Semana Perfecta'
    },
    {
        id: 'streak_14',
        title: 'Dos Semanas',
        description: 'Mantén una racha global de 14 días',
        icon: '🏆',
        category: 'racha',
        target: 14,
        checkProgress: (stats) => stats.bestStreak || 0,
        reward: 'Insignia de Fortaleza'
    },
    {
        id: 'streak_30',
        title: 'Mes Perfecto',
        description: 'Mantén una racha global de 30 días',
        icon: '💎',
        category: 'racha',
        target: 30,
        checkProgress: (stats) => stats.bestStreak || 0,
        reward: 'Insignia de Diamante'
    },
    {
        id: 'perfect_day',
        title: 'Día Perfecto',
        description: 'Completa todos tus hábitos en un día',
        icon: '🌈',
        category: 'especial',
        target: 1,
        checkProgress: (stats) => stats.perfectDays || 0,
        reward: 'Sensación de logro total'
    },
    {
        id: 'early_bird',
        title: 'Madrugador',
        description: 'Completa un hábito antes de las 8 AM',
        icon: '🌅',
        category: 'especial',
        target: 1,
        checkProgress: (stats) => stats.earlyCompletions || 0,
        reward: 'Insignia de Madrugador'
    },
    {
        id: 'night_owl',
        title: 'Búho Nocturno',
        description: 'Completa un hábito después de las 10 PM',
        icon: '🦉',
        category: 'especial',
        target: 1,
        checkProgress: (stats) => stats.lateCompletions || 0,
        reward: 'Insignia de Noctámbulo'
    },
    {
        id: 'all_categories',
        title: 'Explorador',
        description: 'Crea hábitos en todas las categorías',
        icon: '🗺️',
        category: 'especial',
        target: 5,
        checkProgress: (stats) => stats.categoriesUsed || 0,
        reward: 'Insignia de Explorador'
    },
    {
        id: 'comeback',
        title: 'Resiliente',
        description: 'Vuelve después de perder una racha',
        icon: '🔄',
        category: 'especial',
        target: 1,
        checkProgress: (stats) => stats.comebacks || 0,
        reward: 'Insignia de Resiliencia'
    }
];

// Abrir modal de logros
async function openAchievementsModal() {
    const modal = document.getElementById('achievementsModal');
    const content = document.getElementById('achievementsContent');

    if (!modal || !content) {
        console.error('❌ Modal de logros no encontrado');
        return;
    }

    modal.style.display = 'block';

    try {
        // Obtener estadísticas del usuario
        const response = await fetch('/api/habits/stats', {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        if (!response.ok) throw new Error('Error al cargar estadísticas');

        const data = await response.json();
        const stats = data.stats || {};

        // Calcular estadísticas adicionales para logros especiales
        await enrichStatsForAchievements(stats);

        // Mostrar logros
        displayAchievements(stats);

    } catch (error) {
        console.error('❌ Error al cargar logros:', error);
        content.innerHTML = `
            <div class="error-message">
                <p>❌ Error al cargar los logros</p>
                <button onclick="openAchievementsModal()" class="btn-primary">Reintentar</button>
            </div>
        `;
    }
}

// Enriquecer estadísticas con datos adicionales
async function enrichStatsForAchievements(stats) {
    try {
        // Obtener todos los hábitos para contar categorías
        const habitsResponse = await fetch('/api/habits', {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        if (habitsResponse.ok) {
            const habitsData = await habitsResponse.json();
            const habits = habitsData.habits || [];
            
            // Contar hábitos totales
            stats.totalHabits = habits.length;
            
            // Contar categorías únicas
            const categories = new Set(habits.map(h => h.category));
            stats.categoriesUsed = categories.size;
        }

        // TODO: Implementar lógica para días perfectos, completados temprano/tarde, comebacks
        stats.perfectDays = 0;
        stats.earlyCompletions = 0;
        stats.lateCompletions = 0;
        stats.comebacks = 0;

    } catch (error) {
        console.error('Error al enriquecer estadísticas:', error);
    }
}

// Mostrar todos los logros
function displayAchievements(stats) {
    const content = document.getElementById('achievementsContent');

    // Calcular progreso de cada logro
    const achievementsWithProgress = ACHIEVEMENTS.map(achievement => {
        const current = achievement.checkProgress(stats);
        const progress = Math.min(100, (current / achievement.target) * 100);
        const unlocked = current >= achievement.target;

        return {
            ...achievement,
            current,
            progress,
            unlocked
        };
    });

    // Contar logros desbloqueados
    const unlockedCount = achievementsWithProgress.filter(a => a.unlocked).length;
    const totalCount = ACHIEVEMENTS.length;
    const overallProgress = Math.round((unlockedCount / totalCount) * 100);

    // Agrupar por categoría
    const categories = {
        inicio: { name: 'Inicio', icon: '🚀' },
        completado: { name: 'Completados', icon: '✅' },
        racha: { name: 'Rachas', icon: '🔥' },
        especial: { name: 'Especiales', icon: '⭐' }
    };

    let html = `
        <div class="achievements-header">
            <h3>🏆 Tus Logros</h3>
            <p>Desbloquea logros completando hábitos y alcanzando metas</p>
        </div>

        <div class="achievements-summary">
            <div class="summary-stat">
                <div class="summary-stat-value">${unlockedCount}/${totalCount}</div>
                <div class="summary-stat-label">Logros Desbloqueados</div>
            </div>
            <div class="summary-stat">
                <div class="summary-stat-value">${overallProgress}%</div>
                <div class="summary-stat-label">Progreso Total</div>
            </div>
            <div class="summary-stat">
                <div class="summary-stat-value">${stats.totalCompletado || 0}</div>
                <div class="summary-stat-label">Hábitos Completados</div>
            </div>
        </div>

        <div class="achievements-categories">
            <button class="category-filter active" data-category="all">Todos</button>
            ${Object.entries(categories).map(([key, cat]) => `
                <button class="category-filter" data-category="${key}">
                    ${cat.icon} ${cat.name}
                </button>
            `).join('')}
        </div>

        <div class="achievements-list">
            ${achievementsWithProgress.map(achievement => createAchievementHTML(achievement)).join('')}
        </div>
    `;

    content.innerHTML = html;

    // Agregar event listeners para filtros
    setupCategoryFilters();
}

// Crear HTML para un logro individual
function createAchievementHTML(achievement) {
    const statusClass = achievement.unlocked ? 'unlocked' : 'locked';
    const statusText = achievement.unlocked ? 'Desbloqueado' : 'Bloqueado';
    
    return `
        <div class="achievement-item ${statusClass}" data-category="${achievement.category}">
            <div class="achievement-header-content">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-info">
                    <h4 class="achievement-title">
                        ${achievement.title}
                        <span class="achievement-status ${statusClass}">${statusText}</span>
                    </h4>
                    <p class="achievement-description">${achievement.description}</p>
                </div>
            </div>
            
            <div class="achievement-progress">
                <div class="achievement-progress-label">
                    <span>Progreso</span>
                    <span class="achievement-progress-value">
                        ${achievement.current} / ${achievement.target}
                    </span>
                </div>
                <div class="achievement-progress-bar">
                    <div class="achievement-progress-fill" style="width: ${achievement.progress}%"></div>
                </div>
            </div>

            <div class="achievement-reward">
                <strong>Recompensa:</strong> ${achievement.reward}
            </div>
        </div>
    `;
}

// Configurar filtros de categorías
function setupCategoryFilters() {
    const filters = document.querySelectorAll('.category-filter');
    
    filters.forEach(filter => {
        filter.addEventListener('click', () => {
            // Remover active de todos
            filters.forEach(f => f.classList.remove('active'));
            // Agregar active al seleccionado
            filter.classList.add('active');
            
            const category = filter.dataset.category;
            filterAchievements(category);
        });
    });
}

// Filtrar logros por categoría
function filterAchievements(category) {
    const achievements = document.querySelectorAll('.achievement-item');
    
    achievements.forEach(achievement => {
        if (category === 'all') {
            achievement.style.display = 'block';
        } else {
            if (achievement.dataset.category === category) {
                achievement.style.display = 'block';
            } else {
                achievement.style.display = 'none';
            }
        }
    });
}

// Cerrar modal de logros
function closeAchievementsModal() {
    const modal = document.getElementById('achievementsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Event listeners para el modal de logros
document.addEventListener('DOMContentLoaded', () => {
    const achievementsBtn = document.getElementById('achievementsBtn');
    const closeAchievementsBtn = document.getElementById('closeAchievementsModal');
    const achievementsModal = document.getElementById('achievementsModal');

    if (achievementsBtn) {
        achievementsBtn.addEventListener('click', openAchievementsModal);
    }

    if (closeAchievementsBtn) {
        closeAchievementsBtn.addEventListener('click', closeAchievementsModal);
    }

    // Cerrar al hacer click fuera del modal
    if (achievementsModal) {
        achievementsModal.addEventListener('click', (e) => {
            if (e.target === achievementsModal) {
                closeAchievementsModal();
            }
        });
    }
});
