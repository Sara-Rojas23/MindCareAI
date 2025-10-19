from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from app.config.settings import Settings
from app.api.routes.health import router as health_router
from app.api.routes.emotions import router as emotions_router

from app.api.routes.analytics import router as analytics_router
from app.api.routes.auth import router as auth_router

settings = Settings()

app = FastAPI(title=settings.APP_NAME, version=settings.VERSION, debug=settings.DEBUG)

# Montar archivos estáticos
app.mount("/static", StaticFiles(directory=settings.STATIC_FILES_DIR), name="static")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ruta para la página principal
@app.get("/")
async def read_root():
    return FileResponse("static/index.html")

# Registrar routers
app.include_router(health_router)
app.include_router(emotions_router, prefix=f"{settings.API_V1_PREFIX}/emotions")
app.include_router(analytics_router, prefix=f"{settings.API_V1_PREFIX}/analytics")
app.include_router(auth_router, prefix=f"{settings.API_V1_PREFIX}")
