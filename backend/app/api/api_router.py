from fastapi import APIRouter
from app.api.routes import (
    vendors,
    documents,
    verification,
    workflow,
    tasks,
    versions,
    dashboard,
    samples
)

api_router = APIRouter(prefix="/api")

api_router.include_router(vendors.router)
api_router.include_router(documents.router)
api_router.include_router(verification.router)
api_router.include_router(workflow.router)
api_router.include_router(tasks.router)
api_router.include_router(versions.router)
api_router.include_router(dashboard.router)
api_router.include_router(samples.router)
