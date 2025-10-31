const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data/mindcare.db');
const db = new sqlite3.Database(dbPath);

db.run(
    'UPDATE users SET failed_attempts = 0, locked_until = NULL',
    function(err) {
        if (err) {
            console.error('❌ Error:', err.message);
        } else {
            console.log('✅ Todos los bloqueos han sido reseteados');
            console.log(`   Usuarios actualizados: ${this.changes}`);
        }
        db.close();
    }
);
