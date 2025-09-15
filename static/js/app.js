// Lógica principal del frontend MindCare AI
alert('JS cargado');
// Función para obtener el historial de emociones del usuario
async function fetchHistorial(userId = 1) {
    try {
        const response = await fetch(`/api/v1/emotions/history?user_id=${userId}`);
        if (!response.ok) {
            throw new Error('No se pudo obtener el historial');
        }
        return await response.json();
    } catch (error) {
        console.error('Error al obtener historial:', error);
        return [];
    }
}

import { analyzeEmotion } from './api.js';

console.log('MindCare AI frontend loaded');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM cargado');
    const form = document.getElementById('analyze-form');
    const textarea = document.getElementById('emotion-text');
    const charCount = document.getElementById('char-count');
    const resultCard = document.getElementById('result-card');
    const resultEmotion = document.getElementById('result-emotion');
    const resultConfidence = document.getElementById('result-confidence');
    const resultMethod = document.getElementById('result-method');
    const analyzeBtn = document.getElementById('analyze-btn');
    const navRegistro = document.getElementById('nav-registro');
    const navHistorial = document.getElementById('nav-historial');

    // Actualizar contador de caracteres
    textarea.addEventListener('input', () => {
        charCount.textContent = `${textarea.value.length}/300`;
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        analyzeBtn.disabled = true;
        analyzeBtn.textContent = 'Analizando...';
        resultCard.classList.add('hidden');
        try {
            const text = textarea.value.trim();
            if (!text) return;
            const res = await analyzeEmotion(text, 1);
            resultEmotion.textContent = res.emotion;
            resultConfidence.textContent = (res.confidence * 100).toFixed(1) + '%';
            resultMethod.textContent = res.method === 'ai' ? 'IA' : (res.method === 'dictionary' ? 'Diccionario' : res.method);
            resultCard.classList.remove('hidden');
        } catch (err) {
            alert('Ocurrió un error al analizar la emoción.');
        } finally {
            analyzeBtn.disabled = false;
            analyzeBtn.textContent = 'Analizar emoción';
        }
    });
    
    // Navegación
    navRegistro.addEventListener('click', () => {
        console.log('Click en Registrar emoción');
        showSection('registro-section');
    });
    navHistorial.addEventListener('click', async () => {
        console.log('Click en Historial');
        showSection('historial-section');
        // Obtener y mostrar historial
        const historial = await fetchHistorial(1);
        console.log('Historial recibido:', historial);
        renderHistorialTable(historial);
    });

    // Mostrar sección de registro por defecto
    showSection('registro-section');
});

// Mostrar historial en la tabla
function renderHistorialTable(historial) {
    console.log('Renderizando historial:', historial);
    const tbody = document.querySelector('#historial-table tbody');
    tbody.innerHTML = '';
    if (!historial.length) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 4;
        cell.textContent = 'No hay registros.';
        row.appendChild(cell);
        tbody.appendChild(row);
        return;
    }
    historial.forEach(entry => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${entry.date ? new Date(entry.date).toLocaleString() : ''}</td>
            <td>${entry.emotion}</td>
            <td>${(entry.confidence * 100).toFixed(1)}%</td>
            <td>${entry.text}</td>
        `;
        tbody.appendChild(row);
    });
}

// Navegación entre secciones
function showSection(sectionId) {
    document.getElementById('registro-section').classList.add('hidden');
    document.getElementById('historial-section').classList.add('hidden');
    document.getElementById(sectionId).classList.remove('hidden');
}
