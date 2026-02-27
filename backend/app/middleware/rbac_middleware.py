"""
Global RBAC middleware for FastAPI.
Enforces access control based on path and HTTP method.
Frontend-compatible with legacy paths: /auth, /user/settings, /cart, /Product, etc.
"""
import logging
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)
from starlette.requests import Request
from starlette.responses import Response, JSONResponse

from app.security.jwt_handler import verify_access_token

# Role access matrix
USER_ROLES = frozenset({"user", "seller", "admin"})
SELLER_ROLES = frozenset({"seller", "admin"})
ADMIN_ROLES = frozenset({"admin"})


def _is_public_path(path: str) -> bool:
    """Paths that require no authentication."""
    if path in ("/", "/docs", "/redoc", "/openapi.json", "/health", "/ping"):
        return True
    if path.startswith("/uploads"):
        return True
    # Auth public endpoints
    if path in ("/auth/login", "/auth/register", "/auth/send-otp", "/auth/verify-otp", "/auth/verify-forgot-otp"):
        return True
    if path in ("/auth/refresh", "/auth/logout"):
        return True
    if path.startswith("/auth/") and path != "/auth/reset-password":
        return True
    # Contact is public
    if path == "/contact/" or path.startswith("/contact"):
        return True
    # Stripe webhook (verified by signature, not Bearer)
    if path == "/payment/webhook/stripe" or path.startswith("/payment/webhook/"):
        return True
    return False


def _is_public_get(path: str, method: str) -> bool:
    """GET requests to browse endpoints - public."""
    if method.upper() != "GET":
        return False
    # Browsing: GET Category, Product, Vendor
    if path == "/Category" or path.startswith("/Category"):
        return True
    if path == "/Product" or path == "/Product/" or path.startswith("/Product/"):
        return True
    if path == "/Vendor" or path == "/Vendor/":
        return True
    if path.startswith("/Vendor/") and "by-user" not in path:
        return True
    return False


def _get_required_roles(path: str, method: str) -> frozenset | None:
    """
    Return allowed roles for the path/method, or None if public.
    """
    method = method.upper()

    # Admin only
    if path.startswith("/api/admin"):
        return ADMIN_ROLES

    # Seller only
    if path.startswith("/api/seller"):
        return SELLER_ROLES
    if path.startswith("/Variant"):
        return SELLER_ROLES
    if path.startswith("/AttributeValue"):
        return SELLER_ROLES
    if path.startswith("/Attribute"):
        return SELLER_ROLES

    # Category, Product, Vendor: GET public, write needs seller
    if path.startswith("/Category"):
        if method == "GET":
            return None  # public
        return SELLER_ROLES
    if path.startswith("/Product"):
        if method == "GET":
            return None
        return SELLER_ROLES
    if path.startswith("/Vendor"):
        if "by-user" in path:
            return USER_ROLES
        if method == "GET":
            return None
        return SELLER_ROLES

    # User routes (user, seller, admin)
    if path.startswith("/user/settings"):
        return USER_ROLES
    if path.startswith("/cart"):
        return USER_ROLES
    if path.startswith("/orders"):
        return USER_ROLES
    if path.startswith("/payment"):
        return USER_ROLES
    if path.startswith("/wishlist"):
        return USER_ROLES
    if path == "/auth/reset-password":
        return USER_ROLES
    if path.startswith("/Chat"):
        return USER_ROLES

    return None


def _extract_bearer_token(request: Request) -> str | None:
    """Extract Bearer token from Authorization header."""
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        return None
    return auth[7:].strip()


class RBACMiddleware(BaseHTTPMiddleware):
    """Global RBAC enforcement - frontend compatible."""

    async def dispatch(self, request: Request, call_next) -> Response:
        path = request.scope.get("path", "")
        method = request.scope.get("method", "GET")

        # Public paths - no auth
        if _is_public_path(path):
            return await call_next(request)

        # Public GET for browsing
        if _is_public_get(path, method):
            return await call_next(request)

        required_roles = _get_required_roles(path, method)
        if required_roles is None:
            return await call_next(request)

        # Protected path
        token = _extract_bearer_token(request)
        if not token:
            logger.debug("RBAC 401: missing token for %s %s", method, path)
            return JSONResponse(
                status_code=401,
                content={"detail": "Missing or invalid Authorization header. Use: Bearer <token>"},
                headers={"WWW-Authenticate": "Bearer"},
            )

        payload = verify_access_token(token)
        if not payload:
            logger.warning("RBAC 401: invalid/expired token for %s %s", method, path)
            return JSONResponse(
                status_code=401,
                content={"detail": "Invalid or expired token"},
                headers={"WWW-Authenticate": "Bearer"},
            )

        role = (payload.get("role") or "").lower()
        if role not in required_roles:
            logger.warning("RBAC 403: role %s not in %s for %s %s", role, required_roles, method, path)
            return JSONResponse(
                status_code=403,
                content={"detail": "Insufficient permissions for this resource"},
            )

        request.state.user = {
            "user_id": payload.get("user_id"),
            "role": role,
        }
        return await call_next(request)
