import time
import subprocess
from datetime import datetime

# Intervalo de respaldo en segundos
# 6 meses = 180 días = 180 * 24 * 60 * 60 = 15,552,000 segundos
BACKUP_INTERVAL = 15552000  # 6 meses

print("Iniciando backup automático de la base de datos...")

while True:
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f"[{now}] Realizando backup...")
    result = subprocess.run(["python", "backup_db.py"], capture_output=True, text=True)
    if result.returncode == 0:
        print(f"[{now}] Backup completado exitosamente.")
        if result.stdout:
            print(result.stdout.strip())
    else:
        print(f"[{now}] Error al realizar backup:")
        if result.stderr:
            print(result.stderr.strip())
    print(f"[{now}] Esperando el siguiente ciclo...\n")
    time.sleep(BACKUP_INTERVAL)
