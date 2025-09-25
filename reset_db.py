import os
from app.database.connection import engine
from app.database.schemas import Base

def reset_db():
    db_path = os.path.join('data', 'mindcare.db')
    if os.path.exists(db_path):
        os.remove(db_path)
        print('Base de datos antigua eliminada.')
    else:
        print('No se encontró base de datos previa.')
    Base.metadata.create_all(bind=engine)
    print('Base de datos recreada correctamente.')

if __name__ == "__main__":
    reset_db()
