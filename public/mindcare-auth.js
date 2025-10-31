// Configuración
window.API_BASE_URL = window.API_BASE_URL || '/api';
const TOKEN_KEY = 'mindcare_token';
const USER_KEY = 'mindcare_user';

// Elementos del DOM
let loginForm, registerForm, errorModal, successModal;
let closeModal, closeSuccessModal, errorMessage, successMessage;

// Estado de la aplicación
let isSubmitting = false;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    initializeAuthPage();
});

function initializeAuthPage() {
    // Obtener elementos del DOM según la página
    loginForm = document.getElementById('loginForm');
    registerForm = document.getElementById('registerForm');
    errorModal = document.getElementById('errorModal');
    successModal = document.getElementById('successModal');
    closeModal = document.getElementById('closeModal');
    closeSuccessModal = document.getElementById('closeSuccessModal');
    errorMessage = document.getElementById('errorMessage');
    successMessage = document.getElementById('successMessage');

    // Configurar event listeners
    setupEventListeners();

    // Verificar si ya está autenticado (con delay para evitar conflictos)
    setTimeout(() => {
        checkAuthenticationStatus();
    }, 100);

    console.log('🔐 Página de autenticación inicializada');
}

function setupEventListeners() {
    // Login form
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Register form
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
        
        // Validación en tiempo real de contraseñas
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        
        if (passwordInput && confirmPasswordInput) {
            confirmPasswordInput.addEventListener('input', validatePasswordMatch);
        }
    }

    // Modales
    if (closeModal) {
        closeModal.addEventListener('click', hideError);
    }

    if (closeSuccessModal) {
        closeSuccessModal.addEventListener('click', hideSuccess);
    }

    // Cerrar modales con click fuera
    if (errorModal) {
        errorModal.addEventListener('click', function(e) {
            if (e.target === errorModal) {
                hideError();
            }
        });
    }

    if (successModal) {
        successModal.addEventListener('click', function(e) {
            if (e.target === successModal) {
                hideSuccess();
            }
        });
    }

    // Cerrar modales con ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideError();
            hideSuccess();
        }
    });
}

async function checkAuthenticationStatus() {
    // Solo verificar si estamos en páginas de auth
    const currentPath = window.location.pathname;
    const isAuthPage = currentPath.includes('login.html') || currentPath.includes('register.html');
    
    if (!isAuthPage) {
        return; // No hacer nada si no es página de auth
    }
    
    const token = localStorage.getItem(TOKEN_KEY);
    
    if (!token) {
        console.log('🔐 No hay token, permaneciendo en página de auth');
        return; // No hay token, el usuario debe autenticarse
    }
    
    // Verificar formato del token antes de hacer petición
    if (!token.includes('.') || token.split('.').length !== 3) {
        console.log('🔐 Token con formato inválido, limpiando...');
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        return;
    }
    
    // Verificar si el token es válido haciendo una petición al servidor
    try {
        const response = await fetch('/api/auth/verify', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                // Token válido, redirigir al dashboard
                console.log('✅ Usuario ya autenticado, redirigiendo...');
                setTimeout(() => {
                    window.location.href = '/';
                }, 500);
            } else {
                // Token inválido, limpiar storage
                localStorage.removeItem(TOKEN_KEY);
                localStorage.removeItem(USER_KEY);
                console.log('🔐 Token inválido según servidor, permaneciendo en página de auth');
            }
        } else {
            // Error en verificación, limpiar storage
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            console.log('🔐 Error en verificación del servidor, permaneciendo en página de auth');
        }
    } catch (error) {
        // Error de red, limpiar storage por seguridad
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        console.log('🔐 Error de conexión, permaneciendo en página de auth:', error.message);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    try {
        setSubmittingState(true, 'loginBtn');
        
        const formData = new FormData(loginForm);
        const loginData = {
            email: formData.get('email').trim(),
            password: formData.get('password')
        };

        // Validaciones del cliente
        if (!loginData.email || !loginData.password) {
            throw new Error('Todos los campos son requeridos');
        }

        if (!isValidEmail(loginData.email)) {
            throw new Error('El formato del email no es válido');
        }

        console.log('🔐 Intentando iniciar sesión...');

        const response = await fetch(`${window.API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Error en el servidor');
        }

        if (!data.success) {
            throw new Error(data.error || 'Error desconocido');
        }

        // Guardar datos de autenticación
        localStorage.setItem(TOKEN_KEY, data.data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.data.user));

        console.log('✅ Login exitoso:', data.data.user.email);

        // Mostrar éxito y redirigir
        showSuccess(`¡Bienvenido ${data.data.user.name}! Redirigiendo...`);
        
        setTimeout(() => {
            window.location.href = '/';
        }, 1500);

    } catch (error) {
        console.error('❌ Error en login:', error.message);
        showError(error.message);
    } finally {
        setSubmittingState(false, 'loginBtn');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    try {
        setSubmittingState(true, 'registerBtn');
        
        const formData = new FormData(registerForm);
        const registerData = {
            name: formData.get('name').trim(),
            email: formData.get('email').trim(),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword')
        };

        // Validaciones del cliente
        if (!registerData.name || !registerData.email || !registerData.password || !registerData.confirmPassword) {
            throw new Error('Todos los campos son requeridos');
        }

        if (registerData.name.length < 2) {
            throw new Error('El nombre debe tener al menos 2 caracteres');
        }

        if (!isValidEmail(registerData.email)) {
            throw new Error('El formato del email no es válido');
        }

        if (registerData.password.length < 6) {
            throw new Error('La contraseña debe tener al menos 6 caracteres');
        }

        if (!isValidPassword(registerData.password)) {
            throw new Error('La contraseña debe contener al menos una minúscula, una mayúscula y un número');
        }

        if (registerData.password !== registerData.confirmPassword) {
            throw new Error('Las contraseñas no coinciden');
        }

        if (!document.getElementById('termsAccepted').checked) {
            throw new Error('Debes aceptar los términos y condiciones');
        }

        console.log('📝 Intentando registrar usuario...');

        const response = await fetch(`${window.API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(registerData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Error en el servidor');
        }

        if (!data.success) {
            throw new Error(data.error || 'Error desconocido');
        }

        // Guardar datos de autenticación
        localStorage.setItem(TOKEN_KEY, data.data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.data.user));

        console.log('✅ Registro exitoso:', data.data.user.email);

        // Mostrar éxito y redirigir
        showSuccess(`¡Cuenta creada exitosamente! Bienvenido ${data.data.user.name}. Redirigiendo...`);
        
        setTimeout(() => {
            window.location.href = '/';
        }, 2000);

    } catch (error) {
        console.error('❌ Error en registro:', error.message);
        showError(error.message);
    } finally {
        setSubmittingState(false, 'registerBtn');
    }
}

function validatePasswordMatch() {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    if (confirmPassword && password !== confirmPassword) {
        confirmPasswordInput.setCustomValidity('Las contraseñas no coinciden');
    } else {
        confirmPasswordInput.setCustomValidity('');
    }
}

function setSubmittingState(submitting, buttonId) {
    isSubmitting = submitting;
    const button = document.getElementById(buttonId);
    const btnText = button.querySelector('.btn-text');
    const spinner = button.querySelector('.loading-spinner');
    
    button.disabled = submitting;
    
    if (submitting) {
        btnText.style.display = 'none';
        spinner.style.display = 'block';
    } else {
        btnText.style.display = 'block';
        spinner.style.display = 'none';
    }
}

function showError(message) {
    if (errorMessage && errorModal) {
        errorMessage.textContent = message;
        errorModal.style.display = 'flex';
    }
}

function hideError() {
    if (errorModal) {
        errorModal.style.display = 'none';
    }
}

function showSuccess(message) {
    if (successMessage && successModal) {
        successMessage.textContent = message;
        successModal.style.display = 'flex';
    }
}

function hideSuccess() {
    if (successModal) {
        successModal.style.display = 'none';
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPassword(password) {
    // Al menos una minúscula, una mayúscula y un número
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    return passwordRegex.test(password);
}

// Funciones de utilidad para otras páginas
function getAuthToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function getCurrentUser() {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
}

function isAuthenticated() {
    const token = getAuthToken();
    const user = getCurrentUser();
    return !!(token && user);
}

function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    console.log('👋 Usuario deslogueado');
    window.location.href = '/login.html';
}

// Hacer funciones disponibles globalmente para otras páginas
window.MindCareAuth = {
    getAuthToken,
    getCurrentUser,
    isAuthenticated,
    logout
};

console.log('🔐 Sistema de autenticación cargado');