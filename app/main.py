from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.config.settings import Settings
from app.api.routes.health import router as health_router
from app.api.routes.emotions import router as emotions_router

from app.api.routes.analytics import router as analytics_router
from app.api.routes.auth import router as auth_router

settings = Settings()

app = FastAPI(title=settings.APP_NAME, version=settings.VERSION, debug=settings.DEBUG)

# Montar archivos estáticos
app.mount("/static", StaticFiles(directory=settings.STATIC_FILES_DIR), name="static")

# Registrar routers
app.include_router(health_router)
app.include_router(emotions_router, prefix=f"{settings.API_V1_PREFIX}/emotions")
app.include_router(analytics_router, prefix=f"{settings.API_V1_PREFIX}/analytics")
app.include_router(auth_router, prefix=f"{settings.API_V1_PREFIX}")
