// habits.js - Lógica del frontend para el módulo de hábitos

const API_URL = 'http://localhost:3000/api';
const TOKEN_KEY = 'mindcare_token';
const USER_KEY = 'mindcare_user';
let currentEditingHabitId = null;

// ==========================================
// UTILIDADES DE AUTENTICACIÓN
// ==========================================

function getAuthToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function getCurrentUser() {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
}

function checkAuth() {
    const token = getAuthToken();
    const user = getCurrentUser();
    
    if (!token || !user) {
        console.log('❌ No hay token o usuario, redirigiendo a login');
        window.location.href = 'login.html';
        return null;
    }
    
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

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
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
    });
}

function createHabitCard(habit) {
    const streakDisplay = habit.racha > 0 ? `<span class="habit-streak">🔥 ${habit.racha} días</span>` : '';
    
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
                        ${streakDisplay}
                    </div>
                    <div class="habit-actions">
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
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        window.location.href = 'login.html';
    }
}
