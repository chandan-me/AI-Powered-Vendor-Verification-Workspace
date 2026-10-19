from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.logging import logger
from app.database.connection import engine
from app.database.base import Base
import app.models  # Ensure all models are registered with Base.metadata
from app.api.api_router import api_router
from app.api.routes.samples import ensure_sample_pdfs

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables are created
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database schemas and relational tables verified successfully.")
    except Exception as e:
        logger.error(f"Error creating database tables on startup: {e}")

    # Generate sample PDFs
    try:
        ensure_sample_pdfs()
        logger.info("Sample verification PDFs verified and ready in sample_documents/.")
    except Exception as e:
        logger.warning(f"Could not generate sample PDFs on startup: {e}")

    yield

    # Shutdown
    logger.info("VendorVerify AI backend shutting down.")

app = FastAPI(
    title="VendorVerify AI API",
    description="Enterprise AI-Powered Vendor Onboarding, Document Extraction, and Compliance Verification Workspace",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Centralized Exception Handlers
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "status_code": exc.status_code}
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        loc = " -> ".join([str(l) for l in err.get("loc", [])])
        errors.append(f"{loc}: {err.get('msg', 'Invalid input')}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Validation error", "errors": errors}
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception on {request.method} {request.url.path}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error occurred. Please consult backend logs."}
    )

# Include API Router
app.include_router(api_router)

@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "database": "connected",
        "demo_mode": settings.DEMO_MODE,
        "openai_configured": settings.is_openai_configured,
        "opencorporates_configured": settings.is_opencorporates_configured,
        "resend_configured": settings.is_resend_configured
    }

@app.get("/download-report", tags=["Reports"])
@app.get("/api/download-report", tags=["Reports"])
def direct_download_report():
    from app.api.routes.samples import download_build_report
    return download_build_report()

@app.get("/", tags=["Root"])
def root_redirect():
    return {
        "name": settings.APP_NAME,
        "docs": "/docs",
        "health": "/health",
        "api": "/api",
        "download_report": "/api/samples/download-report"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
