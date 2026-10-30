from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import FRONTEND_URL
from app.routes.auth import router as auth_router
from app.routes.crm import router as crm_router
from app.routes.health import router as health_router

app = FastAPI(
    title="NovaCRM API",
    version="0.1.0",
)

_cors_origins = {
    FRONTEND_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
}

app.add_middleware(
    CORSMiddleware,
    allow_origins=sorted(_cors_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(crm_router)


@app.get("/")
def root() -> dict:
    return {
        "name": "NovaCRM API",
        "status": "ok",
    }
