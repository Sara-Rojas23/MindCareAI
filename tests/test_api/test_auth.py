import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

import os
import sqlalchemy
import app.database.connection as db_conn

@pytest.fixture(scope="function", autouse=True)
def clean_db():
    # Limpia la base de datos antes de cada prueba (opcional, solo para entorno de test)
    db_path = 'data/mindcare.db'
    # Cierra todas las conexiones activas de SQLAlchemy
    try:
        db_conn.engine.dispose()
    except Exception:
        pass
    if os.path.exists(db_path):
        os.remove(db_path)
    from app.database.init_db import Base
    from app.database.connection import engine
    Base.metadata.create_all(bind=engine)


def test_registro_usuario_exitoso():
    payload = {
        "name": "Test User",
        "email": "testuser@example.com",
        "password": "testpassword"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_registro_usuario_email_duplicado():
    payload = {
        "name": "Test User",
        "email": "testuser@example.com",
        "password": "testpassword"
    }
    # Primer registro
    response1 = client.post("/api/v1/auth/register", json=payload)
    assert response1.status_code == 200
    # Segundo registro con el mismo email
    response2 = client.post("/api/v1/auth/register", json=payload)
    assert response2.status_code == 400
    data = response2.json()
    assert data["detail"] == "El correo ya está registrado."
