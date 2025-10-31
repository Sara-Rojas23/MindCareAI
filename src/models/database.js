const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor() {
        this.dbPath = path.join(__dirname, '../../data/mindcare.db');
        this.db = null;
    }

    async initialize() {
        return new Promise((resolve, reject) => {
            // Crear directorio de data si no existe
            const fs = require('fs');
            const dataDir = path.dirname(this.dbPath);
            
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }

            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('❌ Error al conectar con la base de datos:', err.message);
                    reject(err);
                } else {
                    console.log('✅ Conectado a la base de datos SQLite');
                    this.createTables()
                        .then(() => resolve())
                        .catch(reject);
                }
            });
        });
    }

    async createTables() {
        return new Promise((resolve, reject) => {
            // Tabla de usuarios
            const createUsersTable = `
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    failed_attempts INTEGER DEFAULT 0,
                    locked_until DATETIME DEFAULT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `;

            // Tabla de análisis emocionales
            const createEmotionEntriesTable = `
                CREATE TABLE IF NOT EXISTS emotion_entries (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    text TEXT NOT NULL,
                    primary_emotion TEXT NOT NULL,
                    confidence INTEGER NOT NULL,
                    emotion_breakdown TEXT NOT NULL,
                    context TEXT,
                    analysis_method TEXT DEFAULT 'openai',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
                )
            `;

            // Tabla de hábitos (para futura implementación)
            const createHabitsTable = `
                CREATE TABLE IF NOT EXISTS habits (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    name TEXT NOT NULL,
                    description TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
                )
            `;

            // Tabla de registros de hábitos diarios
            const createHabitEntriesTable = `
                CREATE TABLE IF NOT EXISTS habit_entries (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    habit_id INTEGER NOT NULL,
                    completed BOOLEAN DEFAULT FALSE,
                    date DATE NOT NULL,
                    notes TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                    FOREIGN KEY (habit_id) REFERENCES habits (id) ON DELETE CASCADE,
                    UNIQUE(user_id, habit_id, date)
                )
            `;

            this.db.serialize(() => {
                this.db.run(createUsersTable, (err) => {
                    if (err) {
                        console.error('Error creando tabla users:', err.message);
                        reject(err);
                        return;
                    }
                });

                this.db.run(createEmotionEntriesTable, (err) => {
                    if (err) {
                        console.error('Error creando tabla emotion_entries:', err.message);
                        reject(err);
                        return;
                    }
                });

                this.db.run(createHabitsTable, (err) => {
                    if (err) {
                        console.error('Error creando tabla habits:', err.message);
                        reject(err);
                        return;
                    }
                });

                this.db.run(createHabitEntriesTable, (err) => {
                    if (err) {
                        console.error('Error creando tabla habit_entries:', err.message);
                        reject(err);
                        return;
                    }
                    console.log('✅ Tablas de base de datos creadas/verificadas exitosamente');
                    
                    // Migración: Agregar columnas de bloqueo si no existen
                    this.migrateUsersTable()
                        .then(() => resolve())
                        .catch(reject);
                });
            });
        });
    }

    async migrateUsersTable() {
        return new Promise((resolve, reject) => {
            // Verificar si las columnas ya existen
            this.db.all("PRAGMA table_info(users)", (err, columns) => {
                if (err) {
                    console.error('Error verificando estructura de users:', err.message);
                    reject(err);
                    return;
                }

                const hasFailedAttempts = columns.some(col => col.name === 'failed_attempts');
                const hasLockedUntil = columns.some(col => col.name === 'locked_until');

                const migrations = [];

                if (!hasFailedAttempts) {
                    migrations.push(
                        new Promise((res, rej) => {
                            this.db.run(
                                'ALTER TABLE users ADD COLUMN failed_attempts INTEGER DEFAULT 0',
                                (err) => {
                                    if (err) {
                                        console.error('Error agregando failed_attempts:', err.message);
                                        rej(err);
                                    } else {
                                        console.log('✅ Columna failed_attempts agregada');
                                        res();
                                    }
                                }
                            );
                        })
                    );
                }

                if (!hasLockedUntil) {
                    migrations.push(
                        new Promise((res, rej) => {
                            this.db.run(
                                'ALTER TABLE users ADD COLUMN locked_until DATETIME DEFAULT NULL',
                                (err) => {
                                    if (err) {
                                        console.error('Error agregando locked_until:', err.message);
                                        rej(err);
                                    } else {
                                        console.log('✅ Columna locked_until agregada');
                                        res();
                                    }
                                }
                            );
                        })
                    );
                }

                if (migrations.length > 0) {
                    Promise.all(migrations)
                        .then(() => resolve())
                        .catch(reject);
                } else {
                    resolve();
                }
            });
        });
    }

    getDatabase() {
        return this.db;
    }

    async close() {
        return new Promise((resolve) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        console.error('Error cerrando la base de datos:', err.message);
                    } else {
                        console.log('✅ Conexión a la base de datos cerrada');
                    }
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    // Métodos de utilidad para consultas
    async run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    async get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }

    async all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }
}

// Instancia única de la base de datos
const database = new Database();

module.exports = database;