// --- Mensajes y recomendaciones por emoción ---
console.log('=====================================');
console.log('¡ARCHIVO JS CARGADO CORRECTAMENTE!');
console.log('=====================================');

const EMOTION_MESSAGES = {
  'alegria': {
    mensaje: '¡Qué alegría verte tan bien! Tu energía positiva puede inspirar a quienes te rodean.',
    recomendaciones: [
      'Comparte este buen momento con alguien importante para ti; la alegría compartida se multiplica.',
      'Anota qué te hizo sentir feliz; te ayudará a reconocer qué cosas te aportan bienestar.',
      'Mantén el impulso haciendo algo que disfrutes, aunque sea un detalle pequeño.',
      'Tómate un momento para agradecer lo que te hace sentir así; la gratitud fortalece el bienestar emocional.',
      'Guarda esta sensación como referencia para cuando los días sean más difíciles.'
    ]
  },
  'joy': {
    mensaje: '¡Qué alegría verte tan bien! Tu energía positiva puede inspirar a quienes te rodean.',
    recomendaciones: [
      'Comparte este buen momento con alguien importante para ti; la alegría compartida se multiplica.',
      'Anota qué te hizo sentir feliz; te ayudará a reconocer qué cosas te aportan bienestar.',
      'Mantén el impulso haciendo algo que disfrutes, aunque sea un detalle pequeño.',
      'Tómate un momento para agradecer lo que te hace sentir así; la gratitud fortalece el bienestar emocional.',
      'Guarda esta sensación como referencia para cuando los días sean más difíciles.'
    ]
  },
  tristeza: {
    mensaje: 'Es normal sentirse triste a veces. Permítete sentir y busca apoyo si lo necesitas.',
    recomendaciones: [
      'Habla con alguien de confianza sobre cómo te sientes.',
      'Escribe tus pensamientos en un diario.',
      'Sal a caminar y respira aire fresco.',
      'Haz una pausa y cuida de ti mismo.',
      'Escucha música que te ayude a procesar tus emociones.'
    ]
  },
  enojo: {
    mensaje: 'El enojo es una emoción válida, pero es importante gestionarlo de forma saludable.',
    recomendaciones: [
      'Respira profundo varias veces antes de actuar.',
      'Haz ejercicio físico para liberar tensión.',
      'Escribe lo que te molesta y luego reflexiona.',
      'Habla de tus emociones de forma asertiva.',
      'Aléjate unos minutos de la situación que te genera enojo.'
    ]
  },
  miedo: {
    mensaje: 'Sentir miedo es natural ante situaciones nuevas o desafiantes.',
    recomendaciones: [
      'Identifica qué te preocupa y escríbelo.',
      'Habla con alguien que te brinde seguridad.',
      'Recuerda situaciones pasadas que lograste superar.',
      'Haz una pequeña acción para enfrentar tu miedo.',
      'Busca información para sentirte más preparado.'
    ]
  },
  asco: {
    mensaje: 'El asco puede protegerte de situaciones desagradables o dañinas.',
    recomendaciones: [
      'Aléjate de lo que te genera asco si es posible.',
      'Habla sobre lo que sientes con alguien de confianza.',
      'Reflexiona si tu reacción es proporcional a la situación.',
      'Haz una actividad que te relaje después.',
      'Recuerda que es válido sentir asco y protegerte.'
    ]
  },
  sorpresa: {
    mensaje: '¡Vaya sorpresa! Las novedades pueden ser emocionantes o desconcertantes.',
    recomendaciones: [
      'Tómate un momento para procesar la noticia.',
      'Comparte tu sorpresa con alguien.',
      'Piensa en cómo puedes adaptarte a lo nuevo.',
      'Busca el lado positivo de la sorpresa.',
      'Permítete sentir y luego actúa con calma.'
    ]
  },
  neutral: {
    mensaje: 'Tu estado emocional parece estable en este momento.',
    recomendaciones: [
      'Aprovecha para reflexionar sobre tus logros.',
      'Haz una actividad tranquila que disfrutes.',
      'Piensa en algo que te gustaría mejorar.',
      'Disfruta de la calma y el presente.',
      'Ayuda a alguien que lo necesite.'
    ]
  }
};

// --- Helpers globales ---
const API_BASE = '/api/v1';
function saveToken(token) { localStorage.setItem('access_token', token); }
function getToken() { return localStorage.getItem('access_token'); }
function clearToken() { localStorage.removeItem('access_token'); }
async function apiRequest(url, options = {}) {
  const token = getToken();
  options.headers = options.headers || {};
  if (token) options.headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(url, options);
  if (res.status === 401) throw new Error('No autenticado');
  return res;
}
async function registerUser(name, email, password) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password })
  });
  if (!res.ok) throw new Error((await res.json()).detail || 'Error al registrar');
  return await res.json();
}
async function loginUser(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error((await res.json()).detail || 'Error al iniciar sesión');
  return await res.json();
}
async function analyzeEmotion(text) {
  const res = await apiRequest(`${API_BASE}/emotions/analyze`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify({ text })
  });
  if (!res.ok) throw new Error('Error al analizar la emoción');
  return await res.json();
}
async function fetchHistorial() {
  const res = await apiRequest(`${API_BASE}/emotions/history`);
  if (!res.ok) throw new Error('No se pudo obtener el historial');
  return await res.json();
}

// --- Lógica principal UI ---
document.addEventListener('DOMContentLoaded', () => {
  // Alerta de prueba
  alert('¡El archivo JavaScript se ha cargado!');
  
  // Elementos globales
  // Elementos globales (robustecidos)
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const loginError = document.getElementById('login-error');
  const registerError = document.getElementById('register-error');
  const loginSection = document.getElementById('login-section');
  const registerSection = document.getElementById('register-section');
  const registroSection = document.getElementById('registro-section');
  const historialSection = document.getElementById('historial-section');
  const userInfo = document.getElementById('user-info');
  const logoutBtn = document.getElementById('logout-btn');
  const copyTokenBtn = document.getElementById('copy-token-btn');
  const navLogin = document.getElementById('nav-login');
  const navRegister = document.getElementById('nav-register');
  const navRegistro = document.getElementById('nav-registro');
  const navHistorial = document.getElementById('nav-historial');
  const form = document.getElementById('analyze-form');
  const textarea = document.getElementById('emotion-text');
  const charCount = document.getElementById('char-count');
  const resultCard = document.getElementById('result-card');
  const resultEmotion = document.getElementById('result-emotion');
  const resultConfidence = document.getElementById('result-confidence');
  const resultMethod = document.getElementById('result-method');
  const analyzeBtn = document.getElementById('analyze-btn');

  // Validar existencia de elementos críticos
  if (!loginForm || !registerForm || !form) {
    alert('Error crítico: Elementos del formulario no encontrados. Verifica el HTML.');
    return;
  }

  // Navegación
  navLogin.addEventListener('click', () => showSection('login-section'));
  navRegister.addEventListener('click', () => showSection('register-section'));
  navRegistro.addEventListener('click', () => showSection('registro-section'));
  navHistorial.addEventListener('click', () => { showSection('historial-section'); mostrarHistorial(); });
  if (logoutBtn) logoutBtn.addEventListener('click', () => { clearToken(); updateUIAuth(); showSection('login-section'); });
  if (copyTokenBtn) copyTokenBtn.addEventListener('click', () => {
    const token = getToken();
    if (token) {
      navigator.clipboard.writeText(token);
      alert('Token copiado al portapapeles. También se muestra en consola.');
      console.log('TOKEN JWT:', token);
    } else {
      alert('No hay token disponible. Inicia sesión primero.');
    }
  });

  // Mostrar sección y limpiar mensajes/campos
  function showSection(sectionId) {
    [loginSection, registerSection, registroSection, historialSection].forEach(sec => sec.classList.add('hidden'));
    document.getElementById(sectionId).classList.remove('hidden');
    if (sectionId === 'login-section') {
      loginError.textContent = '';
      loginError.style.display = 'none';
      loginForm.reset();
    }
    if (sectionId === 'register-section') {
      registerError.textContent = '';
      registerError.style.display = 'none';
      registerForm.reset();
    }
  }

  // Mostrar historial en la tabla
  async function mostrarHistorial() {
    const tableBody = document.querySelector('#historial-table tbody');
    if (!tableBody) return;
    tableBody.innerHTML = '<tr><td colspan="4">Cargando...</td></tr>';
    try {
      const historial = await fetchHistorial();
      if (!historial || historial.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4">No hay registros aún.</td></tr>';
        return;
      }
      tableBody.innerHTML = '';
      historial.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${new Date(item.date || item.timestamp || item.fecha || item.created_at).toLocaleString('es-ES')}</td>
          <td>${item.emotion ? item.emotion.charAt(0).toUpperCase() + item.emotion.slice(1) : ''}</td>
          <td>${item.confidence ? (item.confidence * 100).toFixed(1) + '%' : ''}</td>
          <td>${item.text || ''}</td>
        `;
        tableBody.appendChild(row);
      });
    } catch (err) {
      tableBody.innerHTML = `<tr><td colspan="4">Error al cargar historial: ${err.message}</td></tr>`;
    }
  }

  // Actualizar contador de caracteres
  textarea.addEventListener('input', () => {
    charCount.textContent = `${textarea.value.length}/300`;
  });

  // Analizar emoción
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = 'Analizando...';
    resultCard.classList.add('hidden');
    const msgDiv = document.getElementById('result-message');
    msgDiv.innerHTML = '';
    try {
      const text = textarea.value.trim();
      if (!text) return;
      const res = await analyzeEmotion(text);
      
      // Obtener la emoción
      const emocionOriginal = res.emotion;
      console.log('Emoción recibida de la API:', emocionOriginal);
      
      // Capitalizar para mostrar
      const emocionMostrar = emocionOriginal.charAt(0).toUpperCase() + emocionOriginal.slice(1);
      resultEmotion.textContent = emocionMostrar;
      
      // Buscar el mensaje
      let info = EMOTION_MESSAGES[emocionOriginal];
      console.log('Información encontrada:', info);
      
      // Si no se encuentra, intentar con otras variantes
      if (!info) {
          info = EMOTION_MESSAGES[emocionOriginal.toLowerCase()];
          console.log('Intentando con minúsculas:', info);
      }
      
      if (!info) {
          console.log('No se encontró información para la emoción:', emocionOriginal);
          info = {
              mensaje: '¡Detecté alegría en tus palabras! Es maravilloso verte así.',
              recomendaciones: [
                  'Comparte tu alegría con los demás, las emociones positivas son contagiosas.',
                  'Aprovecha este momento para hacer algo que disfrutes.',
                  'Recuerda qué te hizo sentir así, puede ayudarte en otros momentos.'
              ]
          };
      }
      
      let recomendacion = '';
      if (info.recomendaciones && info.recomendaciones.length > 0) {
        const idx = Math.floor(Math.random() * info.recomendaciones.length);
        recomendacion = info.recomendaciones[idx];
      }
      
      // Obtener el mensaje y la recomendación
      if (info && info.mensaje) {
        const mensaje = info.mensaje;
        let recomendacion = '';
        
        if (info.recomendaciones && info.recomendaciones.length > 0) {
          const idx = Math.floor(Math.random() * info.recomendaciones.length);
          recomendacion = info.recomendaciones[idx];
        }

        msgDiv.innerHTML = `
          <div class="mensaje">${mensaje}</div>
          ${recomendacion ? `<div class="recomendacion"><strong>Recomendación:</strong> ${recomendacion}</div>` : ''}
        `;
      } else {
        msgDiv.innerHTML = '<div class="mensaje">Lo siento, no pude encontrar un mensaje para esta emoción.</div>';
      }
      resultConfidence.textContent = (res.confidence * 100).toFixed(1) + '%';
      resultMethod.textContent = res.method === 'ai' ? 'IA' : (res.method === 'dictionary' ? 'Diccionario' : res.method);
      
      // Construir el mensaje HTML
      let mensajeHTML = '';
      if (info.mensaje) {
          mensajeHTML += `<div class="mensaje">${info.mensaje}</div>`;
      }
      if (info.recomendaciones && info.recomendaciones.length > 0) {
          const recomendacion = info.recomendaciones[Math.floor(Math.random() * info.recomendaciones.length)];
          mensajeHTML += `<div class="recomendacion"><strong>Recomendación:</strong> ${recomendacion}</div>`;
      }
      
      // Mostrar el mensaje
      const msgDiv = document.getElementById('result-message');
      msgDiv.innerHTML = mensajeHTML;
      
      // Asegurarnos de que la tarjeta se muestre
      resultCard.classList.remove('hidden');
      resultCard.style.display = 'block';
      
      // Actualizar historial
      mostrarHistorial();
    } catch (err) {
      alert('Debes iniciar sesión para analizar emociones.');
    } finally {
      analyzeBtn.disabled = false;
      analyzeBtn.textContent = 'Analizar emoción';
    }
  });

  // Estado inicial
  updateUIAuth();
  if (getToken()) {
    showSection('historial-section');
    mostrarHistorial();
  } else {
    showSection('login-section');
  }

  // Actualizar UI según autenticación
  function updateUIAuth() {
    if (getToken()) {
      userInfo.textContent = 'Sesión iniciada';
      logoutBtn.style.display = 'inline-block';
      copyTokenBtn.style.display = 'inline-block';
      navRegistro.style.display = 'inline-block';
      navHistorial.style.display = 'inline-block';
    } else {
      userInfo.textContent = '';
      logoutBtn.style.display = 'none';
      copyTokenBtn.style.display = 'none';
      navRegistro.style.display = 'none';
      navHistorial.style.display = 'none';
    }
  }

  // Registro
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    registerError.textContent = '';
    registerError.style.display = 'none';
    // Corregir nombres de campos según HTML
    const name = registerForm.elements['register-name']?.value.trim();
    const email = registerForm.elements['register-email']?.value.trim();
    const password = registerForm.elements['register-password']?.value;
    if (!name || !email || !password) {
      registerError.textContent = 'Completa todos los campos.';
      registerError.style.display = 'block';
      return;
    }
    try {
      await registerUser(name, email, password);
      alert('Registro exitoso. Ahora puedes iniciar sesión.');
      showSection('login-section');
    } catch (err) {
      registerError.textContent = err.message;
      registerError.style.display = 'block';
    }
  });

  // Login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.textContent = '';
    loginError.style.display = 'none';
    // Corregir nombres de campos según HTML
    const email = loginForm.elements['login-email']?.value.trim();
    const password = loginForm.elements['login-password']?.value;
    if (!email || !password) {
      loginError.textContent = 'Completa todos los campos.';
      loginError.style.display = 'block';
      return;
    }
    try {
      const data = await loginUser(email, password);
      saveToken(data.access_token);
      updateUIAuth();
      // Mensaje visible y console.log para login exitoso
      alert('¡Login exitoso!');
      console.log('Login exitoso, token:', data.access_token);
      showSection('registro-section');
    } catch (err) {
      loginError.textContent = err.message;
      loginError.style.display = 'block';
    }
  });

});
