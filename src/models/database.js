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
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
                    analysis_method TEXT DEFAULT 'openai',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
                )
            `;

            // Tabla de hábitos
            const createHabitsTable = `
                CREATE TABLE IF NOT EXISTS habits (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    name TEXT NOT NULL,
                    description TEXT,
                    category TEXT DEFAULT 'personal',
                    frequency TEXT DEFAULT 'diaria',
                    icon TEXT DEFAULT '⭐',
                    color TEXT DEFAULT '#6366f1',
                    is_active BOOLEAN DEFAULT 1,
                    streak INTEGER DEFAULT 0,
                    best_streak INTEGER DEFAULT 0,
                    custom_schedule TEXT DEFAULT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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
                    completion_time TIME,
                    mood_after TEXT,
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
                        .then(() => this.migrateHabitsTable())
                        .then(() => this.migrateHabitEntriesTable())
                        .then(() => resolve())
                        .catch(reject);
                });
            });
        });
    }

    async migrateUsersTable() {
        // No se requieren migraciones para la tabla users
        return Promise.resolve();
    }

    async migrateHabitsTable() {
        return new Promise((resolve, reject) => {
            // Verificar si las columnas ya existen
            this.db.all("PRAGMA table_info(habits)", (err, columns) => {
                if (err) {
                    console.error('Error verificando estructura de habits:', err.message);
                    reject(err);
                    return;
                }

                // Si la tabla no existe o está vacía, no hacer nada
                if (!columns || columns.length === 0) {
                    resolve();
                    return;
                }

                const existingColumns = columns.map(col => col.name);
                const migrations = [];

                // Definir columnas a agregar
                const columnsToAdd = [
                    { name: 'category', sql: 'ALTER TABLE habits ADD COLUMN category TEXT DEFAULT \'personal\'' },
                    { name: 'frequency', sql: 'ALTER TABLE habits ADD COLUMN frequency TEXT DEFAULT \'diaria\'' },
                    { name: 'icon', sql: 'ALTER TABLE habits ADD COLUMN icon TEXT DEFAULT \'⭐\'' },
                    { name: 'color', sql: 'ALTER TABLE habits ADD COLUMN color TEXT DEFAULT \'#6366f1\'' },
                    { name: 'is_active', sql: 'ALTER TABLE habits ADD COLUMN is_active BOOLEAN DEFAULT 1' },
                    { name: 'streak', sql: 'ALTER TABLE habits ADD COLUMN streak INTEGER DEFAULT 0' },
                    { name: 'best_streak', sql: 'ALTER TABLE habits ADD COLUMN best_streak INTEGER DEFAULT 0' },
                    { name: 'custom_schedule', sql: 'ALTER TABLE habits ADD COLUMN custom_schedule TEXT DEFAULT NULL' },
                    { name: 'updated_at', sql: 'ALTER TABLE habits ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP' }
                ];

                // Verificar qué columnas faltan y agregar migraciones
                columnsToAdd.forEach(column => {
                    if (!existingColumns.includes(column.name)) {
                        migrations.push(
                            new Promise((res, rej) => {
                                this.db.run(column.sql, (err) => {
                                    if (err) {
                                        console.error(`Error agregando ${column.name} a habits:`, err.message);
                                        rej(err);
                                    } else {
                                        console.log(`✅ Columna ${column.name} agregada a habits`);
                                        res();
                                    }
                                });
                            })
                        );
                    }
                });

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

    async migrateHabitEntriesTable() {
        return new Promise((resolve, reject) => {
            // Verificar si las columnas ya existen
            this.db.all("PRAGMA table_info(habit_entries)", (err, columns) => {
                if (err) {
                    console.error('Error verificando estructura de habit_entries:', err.message);
                    reject(err);
                    return;
                }

                // Si la tabla no existe o está vacía, no hacer nada
                if (!columns || columns.length === 0) {
                    resolve();
                    return;
                }

                const existingColumns = columns.map(col => col.name);
                const migrations = [];

                // Definir columnas a agregar
                const columnsToAdd = [
                    { name: 'completion_time', sql: 'ALTER TABLE habit_entries ADD COLUMN completion_time TIME' },
                    { name: 'mood_after', sql: 'ALTER TABLE habit_entries ADD COLUMN mood_after TEXT' }
                ];

                // Verificar qué columnas faltan y agregar migraciones
                columnsToAdd.forEach(column => {
                    if (!existingColumns.includes(column.name)) {
                        migrations.push(
                            new Promise((res, rej) => {
                                this.db.run(column.sql, (err) => {
                                    if (err) {
                                        console.error(`Error agregando ${column.name} a habit_entries:`, err.message);
                                        rej(err);
                                    } else {
                                        console.log(`✅ Columna ${column.name} agregada a habit_entries`);
                                        res();
                                    }
                                });
                            })
                        );
                    }
                });

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