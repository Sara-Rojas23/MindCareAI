
import os
import shutil
import sqlite3
from datetime import datetime

def backup_db():
    src = os.path.join('data', 'mindcare.db')
    if not os.path.exists(src):
        print('No se encontró la base de datos para respaldar.')
        return
    # Contar registros y mostrar ejemplos
    try:
        conn = sqlite3.connect(src)
        cursor = conn.cursor()
        cursor.execute('SELECT COUNT(*) FROM users')
        user_count = cursor.fetchone()[0]
        cursor.execute('SELECT COUNT(*) FROM emotion_entries')
        emotion_count = cursor.fetchone()[0]
        print(f'Usuarios respaldados: {user_count}')
        print(f'Emociones respaldadas: {emotion_count}')
        # Mostrar primeros 3 usuarios
        cursor.execute('SELECT id, name, email, created_at FROM users LIMIT 3')
        users = cursor.fetchall()
        print('Ejemplo usuarios:')
        for u in users:
            print(f'  id={u[0]}, name={u[1]}, email={u[2]}, created_at={u[3]}')
        # Mostrar primeros 3 registros de emociones
        cursor.execute('SELECT id, user_id, text, detected_emotion, confidence, created_at FROM emotion_entries LIMIT 3')
        emotions = cursor.fetchall()
        print('Ejemplo emociones:')
        for e in emotions:
            print(f'  id={e[0]}, user_id={e[1]}, emocion={e[3]}, confianza={e[4]}, fecha={e[5]}')
        conn.close()
    except Exception as e:
        print(f'Error al mostrar evidencia: {e}')
    backup_dir = os.path.join('data', 'backups')
    os.makedirs(backup_dir, exist_ok=True)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    dst = os.path.join(backup_dir, f'mindcare_backup_{timestamp}.db')
    shutil.copy2(src, dst)
    print(f'Respaldo creado: {dst}')

if __name__ == "__main__":
    backup_db()
