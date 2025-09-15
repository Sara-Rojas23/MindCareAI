from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # App
    APP_NAME: str = "MindCare AI"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = "sqlite:///./data/mindcare.db"
    
    # AI Model
    MODEL_NAME: str = "cardiffnlp/twitter-roberta-base-emotion"
    USE_GPU: bool = False
    MODEL_CACHE_DIR: str = "./models"
    
    # API
    API_V1_PREFIX: str = "/api/v1"
    ALLOWED_HOSTS: list = ["localhost", "127.0.0.1"]
    
    # Frontend
    STATIC_FILES_DIR: str = "./static"
    
    class Config:
        env_file = ".env"
