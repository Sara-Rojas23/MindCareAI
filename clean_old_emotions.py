import os
import sqlite3
from datetime import datetime, timedelta

def clean_old_emotions():
    db_path = os.path.join('data', 'mindcare.db')
    if not os.path.exists(db_path):
        print('No se encontró la base de datos.')
        return
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    # Calcular fecha límite (hace 1 año)
    one_year_ago = datetime.now() - timedelta(days=365)
    cutoff = one_year_ago.strftime('%Y-%m-%d %H:%M:%S')
    # Eliminar registros viejos
    cursor.execute("DELETE FROM emotion_entries WHERE created_at < ?", (cutoff,))
    deleted = cursor.rowcount
    conn.commit()
    conn.close()
    print(f"Registros eliminados: {deleted}")

if __name__ == "__main__":
    clean_old_emotions()
