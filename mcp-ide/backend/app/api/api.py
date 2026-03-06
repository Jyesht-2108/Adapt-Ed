from fastapi import APIRouter
from app.api.endpoints import tutor, executor, files, terminal

api_router = APIRouter()

api_router.include_router(tutor.router, prefix="/tutor", tags=["tutor"])
api_router.include_router(executor.router, prefix="/executor", tags=["executor"])
api_router.include_router(files.router, prefix="/files", tags=["files"])
api_router.include_router(terminal.router, prefix="/terminal", tags=["terminal"])
