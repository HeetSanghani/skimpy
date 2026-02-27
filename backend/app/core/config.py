"""
Production-ready configuration loaded from environment variables.
Never hardcode credentials or secrets.
"""
import os
from typing import Optional

# Load .env for local development (Render loads ENV automatically in production)
from dotenv import load_dotenv
load_dotenv()


class Settings:
    """Application settings from environment variables."""

    # Database
    MONGODB_URL: str = os.getenv("MONGODB_URL") or os.getenv("MONGO_URI") or os.getenv("MONGO_URL") or ""
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "skimpy")

    # JWT Authentication (REQUIRED for production)
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

    # Account lockout (brute-force protection)
    MAX_LOGIN_ATTEMPTS: int = int(os.getenv("MAX_LOGIN_ATTEMPTS", "5"))
    LOCKOUT_MINUTES: int = int(os.getenv("LOCKOUT_MINUTES", "15"))

    # Rate limiting (requests per minute per IP for auth endpoints)
    RATE_LIMIT_AUTH_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_AUTH_PER_MINUTE", "10"))

    # Admin credentials (REQUIRED for admin login - never hardcode)
    ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "")

    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # CORS - Vercel frontend domain
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "https://skimpy.vercel.app")

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() in ("production", "prod")

    def get_jwt_secret(self) -> str:
        """Ensure JWT secret is set in production."""
        if not self.JWT_SECRET_KEY and self.is_production:
            raise ValueError("JWT_SECRET_KEY must be set in production")
        return self.JWT_SECRET_KEY or "dev-secret-change-in-production"

    @property
    def access_token_expire_hours(self) -> float:
        """Backward compatibility."""
        return self.ACCESS_TOKEN_EXPIRE_MINUTES / 60.0


settings = Settings()
