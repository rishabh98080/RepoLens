from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import router as api_router
from .database import engine, Base
from . import models

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(
    title="CodeGuard Platform",
    description="Codebase Risk Intelligence Platform API",
    version="1.0.0",
    lifespan=lifespan
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from pydantic_settings import BaseSettings
from fastapi import Security, HTTPException, status, Depends
from fastapi.security.api_key import APIKeyHeader

class Settings(BaseSettings):
    api_key: str = "default_dev_key"
    
    class Config:
        env_file = ".env"

settings = Settings()
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=True)

async def verify_api_key(api_key: str = Security(api_key_header)):
    if api_key != settings.api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API Key"
        )
    return api_key

app.include_router(api_router, prefix="/api", dependencies=[Depends(verify_api_key)])

@app.get("/")
def read_root():
    return {"message": "Welcome to CodeGuard API"}
