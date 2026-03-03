"""Security headers middleware."""
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add production-grade security headers to all responses."""

    # Auth routes that should never be cached
    _NO_CACHE_PATHS = {"/auth/login", "/auth/register", "/auth/logout", "/auth/token"}

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)

        # Prevent MIME sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"
        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"
        # Legacy XSS protection
        response.headers["X-XSS-Protection"] = "1; mode=block"
        # Referrer policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        # Permissions policy
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        # HSTS — enforce HTTPS for 1 year
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        # Content Security Policy (permissive for marketplace assets, lock down scripts)
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "img-src * data: blob:; "
            "font-src 'self' https://fonts.gstatic.com; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; "
            "connect-src 'self' https://api.imgbb.com https://skimpy.vercel.app; "
            "frame-src 'none'; "
            "object-src 'none';"
        )

        # Sensitive auth routes must not be cached
        if request.url.path in self._NO_CACHE_PATHS:
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
            response.headers["Pragma"] = "no-cache"

        return response
