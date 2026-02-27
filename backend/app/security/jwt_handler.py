"""
JWT token creation and verification using python-jose.
Tokens include user_id, role, and expiration timestamp.
Supports access tokens (short-lived) and refresh tokens (long-lived).
"""
from datetime import datetime, timedelta, timezone
from typing import Optional
import hashlib

from jose import JWTError, jwt

from app.core.config import settings
from app.db.mongodb import revoked_tokens_collection

# Valid roles
VALID_ROLES = frozenset({"user", "seller", "admin"})


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def is_token_revoked(token: str) -> bool:
    """Check if token has been revoked (logout)."""
    h = _token_hash(token)
    return revoked_tokens_collection.find_one({"token_hash": h}) is not None


def revoke_token(token: str, expires_at: datetime | None = None) -> None:
    """Revoke a token (store in blacklist until natural expiry)."""
    h = _token_hash(token)
    if expires_at is None:
        try:
            payload = jwt.decode(
                token,
                settings.get_jwt_secret(),
                algorithms=[settings.JWT_ALGORITHM],
                options={"verify_exp": False},
            )
            exp = payload.get("exp")
            expires_at = datetime.fromtimestamp(exp, tz=timezone.utc) if exp else datetime.now(timezone.utc) + timedelta(days=7)
        except Exception:
            expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    revoked_tokens_collection.update_one(
        {"token_hash": h},
        {"$set": {"token_hash": h, "expires_at": expires_at}},
        upsert=True,
    )


def create_access_token(user_id: str, role: str) -> str:
    """
    Create a JWT access token with user_id, role, and expiration.

    Args:
        user_id: Unique user identifier
        role: One of 'user', 'seller', 'admin'

    Returns:
        Encoded JWT string
    """
    role_lower = str(role).lower()
    if role_lower not in VALID_ROLES:
        raise ValueError(f"Invalid role: {role}. Must be one of {sorted(VALID_ROLES)}")

    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub": user_id,
        "role": role_lower,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    secret = settings.get_jwt_secret()
    encoded = jwt.encode(payload, secret, algorithm=settings.JWT_ALGORITHM)
    return encoded if isinstance(encoded, str) else encoded.decode()


def create_refresh_token(user_id: str, role: str) -> str:
    """Create a long-lived refresh token."""
    role_lower = str(role).lower()
    if role_lower not in VALID_ROLES:
        raise ValueError(f"Invalid role: {role}")
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": user_id,
        "role": role_lower,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "refresh",
    }
    secret = settings.get_jwt_secret()
    encoded = jwt.encode(payload, secret, algorithm=settings.JWT_ALGORITHM)
    return encoded if isinstance(encoded, str) else encoded.decode()


def verify_access_token(token: str) -> Optional[dict]:
    """
    Verify JWT token and return payload if valid.

    Args:
        token: JWT token string

    Returns:
        Payload dict with user_id (sub), role, exp, iat if valid.
        None if token is invalid or expired.
    """
    if is_token_revoked(token):
        return None
    try:
        secret = settings.get_jwt_secret()
        payload = jwt.decode(
            token,
            secret,
            algorithms=[settings.JWT_ALGORITHM],
            options={"verify_exp": True},
        )
        if payload.get("type") == "refresh":
            return None
        user_id = payload.get("sub")
        role = payload.get("role")
        if not user_id or not role or role not in VALID_ROLES:
            return None
        return {
            "user_id": user_id,
            "role": role.lower(),
            "exp": payload.get("exp"),
            "iat": payload.get("iat"),
        }
    except JWTError:
        return None


def verify_refresh_token(token: str) -> Optional[dict]:
    """Verify refresh token and return payload if valid."""
    if is_token_revoked(token):
        return None
    try:
        secret = settings.get_jwt_secret()
        payload = jwt.decode(
            token,
            secret,
            algorithms=[settings.JWT_ALGORITHM],
            options={"verify_exp": True},
        )
        if payload.get("type") != "refresh":
            return None
        user_id = payload.get("sub")
        role = payload.get("role")
        if not user_id or not role or role not in VALID_ROLES:
            return None
        return {"user_id": user_id, "role": role.lower(), "exp": payload.get("exp")}
    except JWTError:
        return None
