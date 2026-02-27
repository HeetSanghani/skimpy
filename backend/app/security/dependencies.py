"""
FastAPI dependencies for extracting authenticated user from request state.
Used by route handlers that need current user info.
RBAC enforcement is done by middleware; this only provides user data.
"""
from typing import Annotated

from fastapi import Depends, HTTPException, Request, status

from app.core.config import settings
from app.db.mongodb import user_collection


def get_current_user_from_request(request: Request) -> dict:
    """
    Extract authenticated user from request.state (set by RBAC middleware).
    Only call this in routes under protected prefixes, where middleware has already validated the token.
    """
    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def get_optional_current_user(request: Request) -> dict | None:
    """
    Extract authenticated user from request.state if present.
    Returns None when no auth - use for routes that support both guest and logged-in.
    """
    return getattr(request.state, "user", None)


def get_current_user(request: Request) -> dict:
    """
    Load full user document for route handlers.
    For admin: returns minimal admin dict.
    For user/seller: loads from user_collection by user_id.
    """
    payload = get_current_user_from_request(request)
    role = (payload.get("role") or "").lower()
    user_id = payload.get("user_id")

    if role == "admin":
        return {"user_id": "admin", "role": "admin", "email": settings.ADMIN_EMAIL}

    full_user = user_collection.find_one({"user_id": str(user_id)})
    if not full_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return full_user


def require_role(*allowed_roles: str):
    """Dependency factory to require specific role(s)."""

    def _require(request: Request) -> dict:
        user = get_current_user_from_request(request)
        role = (user.get("role") or "").lower()
        if role not in [r.lower() for r in allowed_roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return user

    return _require


# Type alias for dependency injection
CurrentUser = Annotated[dict, Depends(get_current_user)]
