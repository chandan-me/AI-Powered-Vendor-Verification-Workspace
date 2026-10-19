import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    APP_NAME: str = "VendorVerify AI"
    APP_ENV: str = "development"
    SECRET_KEY: str = "vendorverify-super-secret-key-change-in-production"
    BACKEND_URL: str = "http://localhost:8000"
    FRONTEND_URL: str = "http://localhost:5173"

    # Database
    DATABASE_URL: str = "mysql+pymysql://root:chandan475219@localhost:3306/vendorverify"

    # Storage
    UPLOAD_DIR: str = str(BASE_DIR / "private_uploads")
    MAX_UPLOAD_SIZE_MB: int = 10

    # OpenAI
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"

    # OpenCorporates
    OPENCORPORATES_API_TOKEN: str = ""

    # Email (Resend or SMTP)
    RESEND_API_KEY: str = ""
    EMAIL_FROM: str = "onboarding@vendorverify.ai"
    SMTP_HOST: str = "localhost"
    SMTP_PORT: int = 1025
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_USE_TLS: bool = False

    # Demo Mode
    DEMO_MODE: bool = True

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def is_openai_configured(self) -> bool:
        return bool(self.OPENAI_API_KEY and len(self.OPENAI_API_KEY.strip()) > 10)

    @property
    def is_opencorporates_configured(self) -> bool:
        return bool(self.OPENCORPORATES_API_TOKEN and len(self.OPENCORPORATES_API_TOKEN.strip()) > 5)

    @property
    def is_resend_configured(self) -> bool:
        return bool(self.RESEND_API_KEY and len(self.RESEND_API_KEY.strip()) > 5)

settings = Settings()

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
