const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Importar base de datos y modelos
const database = require('./src/models/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rutas
const emotionRoutes = require('./src/routes/emotion');
const authRoutes = require('./src/routes/auth');
const backupRoutes = require('./src/routes/backup');
const habitsRoutes = require('./src/routes/habits');

app.use('/api/emotions', emotionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/habits', habitsRoutes);

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Algo salió mal!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Error interno del servidor'
    });
});

// Ruta no encontrada
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Inicializar base de datos y servidor
async function startServer() {
    try {
        // Inicializar base de datos
        await database.initialize();
        
        // Iniciar servidor
        app.listen(PORT, () => {
            console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
            console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔐 Sistema de autenticación habilitado`);
        });

    } catch (error) {
        console.error('❌ Error iniciando el servidor:', error.message);
        process.exit(1);
    }
}

// Manejar cierre graceful del servidor
process.on('SIGINT', async () => {
    console.log('🛑 Cerrando servidor...');
    await database.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('🛑 Cerrando servidor...');
    await database.close();
    process.exit(0);
});

// Iniciar aplicación
startServer();

module.exports = app;