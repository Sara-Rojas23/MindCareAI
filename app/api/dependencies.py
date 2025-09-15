# Dependencias comunes para la API (ejemplo de dependencia de usuario)
from fastapi import Depends

def get_current_user():
    # Placeholder para autenticación futura
    return {"user_id": 1}
