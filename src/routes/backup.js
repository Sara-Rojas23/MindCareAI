const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const AuthMiddleware = require('../middleware/auth');

// Directorio para backups
const BACKUP_DIR = path.join(__dirname, '../../backups');
const DB_PATH = path.join(__dirname, '../../data/mindcare.db');

// Asegurar que existe el directorio de backups
if (!fsSync.existsSync(BACKUP_DIR)) {
    fsSync.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * GET /api/backup/list
 * Lista todos los backups disponibles
 */
router.get('/list', AuthMiddleware.authenticate, async (req, res) => {
    try {
        console.log('📋 Listando backups disponibles...');
        
        const files = await fs.readdir(BACKUP_DIR);
        const backups = [];
        
        for (const file of files) {
            if (file.endsWith('.db')) {
                const filePath = path.join(BACKUP_DIR, file);
                const stats = await fs.stat(filePath);
                
                backups.push({
                    filename: file,
                    size: stats.size,
                    createdAt: stats.birthtime,
                    modifiedAt: stats.mtime
                });
            }
        }
        
        // Ordenar por fecha más reciente
        backups.sort((a, b) => b.createdAt - a.createdAt);
        
        console.log(`✅ ${backups.length} backups encontrados`);
        res.json({ success: true, backups });
        
    } catch (error) {
        console.error('❌ Error listando backups:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al listar backups',
            message: error.message 
        });
    }
});

/**
 * POST /api/backup/create
 * Crea un nuevo backup de la base de datos
 */
router.post('/create', AuthMiddleware.authenticate, async (req, res) => {
    try {
        console.log('💾 Creando backup de la base de datos...');
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFilename = `mindcare_backup_${timestamp}.db`;
        const backupPath = path.join(BACKUP_DIR, backupFilename);
        
        // Copiar la base de datos actual
        await fs.copyFile(DB_PATH, backupPath);
        
        const stats = await fs.stat(backupPath);
        
        console.log('✅ Backup creado:', backupFilename);
        res.json({ 
            success: true, 
            message: 'Backup creado exitosamente',
            backup: {
                filename: backupFilename,
                size: stats.size,
                createdAt: stats.birthtime
            }
        });
        
    } catch (error) {
        console.error('❌ Error creando backup:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al crear backup',
            message: error.message 
        });
    }
});

/**
 * GET /api/backup/download/:filename
 * Descarga un backup específico
 */
router.get('/download/:filename', AuthMiddleware.authenticate, async (req, res) => {
    try {
        const { filename } = req.params;
        const backupPath = path.join(BACKUP_DIR, filename);
        
        console.log('📥 Descargando backup:', filename);
        
        // Verificar que el archivo existe
        if (!fsSync.existsSync(backupPath)) {
            return res.status(404).json({ 
                success: false, 
                error: 'Backup no encontrado' 
            });
        }
        
        // Enviar el archivo
        res.download(backupPath, filename, (err) => {
            if (err) {
                console.error('❌ Error descargando:', err);
                if (!res.headersSent) {
                    res.status(500).json({ 
                        success: false, 
                        error: 'Error al descargar backup' 
                    });
                }
            } else {
                console.log('✅ Backup descargado:', filename);
            }
        });
        
    } catch (error) {
        console.error('❌ Error en descarga:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al descargar backup',
            message: error.message 
        });
    }
});

/**
 * POST /api/backup/restore/:filename
 * Restaura la base de datos desde un backup específico
 */
router.post('/restore/:filename', AuthMiddleware.authenticate, async (req, res) => {
    try {
        const { filename } = req.params;
        const backupPath = path.join(BACKUP_DIR, filename);
        
        console.log('🔄 Restaurando backup:', filename);
        
        // Verificar que el backup existe
        if (!fsSync.existsSync(backupPath)) {
            return res.status(404).json({ 
                success: false, 
                error: 'Backup no encontrado' 
            });
        }
        
        // Crear backup de seguridad antes de restaurar
        const safetyBackup = `mindcare_before_restore_${Date.now()}.db`;
        const safetyPath = path.join(BACKUP_DIR, safetyBackup);
        await fs.copyFile(DB_PATH, safetyPath);
        
        // Restaurar el backup
        await fs.copyFile(backupPath, DB_PATH);
        
        console.log('✅ Base de datos restaurada desde:', filename);
        console.log('🛡️ Backup de seguridad creado:', safetyBackup);
        
        res.json({ 
            success: true, 
            message: 'Base de datos restaurada exitosamente',
            restored: filename,
            safetyBackup: safetyBackup
        });
        
    } catch (error) {
        console.error('❌ Error restaurando backup:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al restaurar backup',
            message: error.message 
        });
    }
});

/**
 * DELETE /api/backup/delete/:filename
 * Elimina un backup específico
 */
router.delete('/delete/:filename', AuthMiddleware.authenticate, async (req, res) => {
    try {
        const { filename } = req.params;
        const backupPath = path.join(BACKUP_DIR, filename);
        
        console.log('🗑️ Eliminando backup:', filename);
        
        // Verificar que el archivo existe
        if (!fsSync.existsSync(backupPath)) {
            return res.status(404).json({ 
                success: false, 
                error: 'Backup no encontrado' 
            });
        }
        
        await fs.unlink(backupPath);
        
        console.log('✅ Backup eliminado:', filename);
        res.json({ 
            success: true, 
            message: 'Backup eliminado exitosamente' 
        });
        
    } catch (error) {
        console.error('❌ Error eliminando backup:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al eliminar backup',
            message: error.message 
        });
    }
});

module.exports = router;
