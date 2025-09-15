from app.database.connection import engine
from app.database.schemas import Base

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    print("Base de datos inicializada.")
