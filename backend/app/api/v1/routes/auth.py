"""
Auth router - /auth/* (frontend compatible)
/api/auth/* (RBAC structure - same handlers)
"""
from fastapi import APIRouter, Depends, Request, BackgroundTasks, HTTPException
from fastapi.security import OAuth2PasswordRequestForm

from app.schemas.auth import UserRegisterSchema, ResetPasswordRequest, EmailModel, VerifyOtpModel, VerifyForgotOtpRequest
from app.services.auth import (
    user_login_logic,
    seller_login_logic,
    admin_login_logic,
    register_user_logic,
    reset_password_logic,
    refresh_token_logic,
    logout_logic,
    generate_and_send_otp,
    verify_otp_service,
    verify_forgot_otp_logic,
)
from app.security.dependencies import get_current_user
from app.core.config import settings
from app.utils.rate_limit import check_rate_limit

router = APIRouter(prefix="/auth", tags=["Auth"])


def _rate_limit_auth(request: Request) -> None:
    ip = request.client.host if request.client else "0.0.0.0"
    key = f"auth:{ip}"
    if not check_rate_limit(key, settings.RATE_LIMIT_AUTH_PER_MINUTE):
        raise HTTPException(status_code=429, detail="Too many requests. Try again in a minute.")


@router.post("/user-login")
def user_login(
    req: Request,
    request: OAuth2PasswordRequestForm = Depends(),
    background_tasks: BackgroundTasks = None,
):
    """Buyer login. Returns JWT with role user or seller."""
    _rate_limit_auth(req)
    ip = req.client.host if req.client else "Unknown"
    device = req.headers.get("User-Agent", "Unknown") if req else "Unknown"
    return user_login_logic(
        request.username,
        request.password,
        ip=ip,
        device=device,
        background_tasks=background_tasks,
    )


@router.post("/seller-login")
def seller_login(
    req: Request,
    request: OAuth2PasswordRequestForm = Depends(),
    background_tasks: BackgroundTasks = None,
):
    """Seller login. Only users with role 'seller' can use."""
    _rate_limit_auth(req)
    ip = req.client.host if req.client else "Unknown"
    device = req.headers.get("User-Agent", "Unknown") if req else "Unknown"
    return seller_login_logic(
        request.username, request.password,
        ip=ip, device=device, background_tasks=background_tasks,
    )


@router.post("/admin-login")
def admin_login(req: Request, request: OAuth2PasswordRequestForm = Depends()):
    """Superadmin login. Credentials from ADMIN_EMAIL and ADMIN_PASSWORD env."""
    _rate_limit_auth(req)
    return admin_login_logic(request.username, request.password)


@router.post("/login")
def login_legacy(
    req: Request,
    request: OAuth2PasswordRequestForm = Depends(),
    background_tasks: BackgroundTasks = None,
):
    """Legacy login (same as user-login). Prefer /user-login or /seller-login."""
    return user_login(req, request, background_tasks)


@router.post("/register")
def register(req: Request, request: UserRegisterSchema, background_tasks: BackgroundTasks = None):
    _rate_limit_auth(req)
    ip = req.client.host if req.client else "Unknown"
    device = req.headers.get("User-Agent", "Unknown") if req else "Unknown"
    return register_user_logic(request, ip=ip, device=device, background_tasks=background_tasks)


@router.post("/send-otp")
def send_otp(req: Request, request: EmailModel, background_tasks: BackgroundTasks):
    _rate_limit_auth(req)
    return generate_and_send_otp(request.email, background_tasks)


@router.post("/verify-otp")
def verify_otp(request: VerifyOtpModel, background_tasks: BackgroundTasks):
    return verify_otp_service(request.email, request.otp, background_tasks)


@router.post("/verify-forgot-otp")
def verify_forgot_otp(request: VerifyForgotOtpRequest, background_tasks: BackgroundTasks):
    return verify_forgot_otp_logic(request, background_tasks)


@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, current_user: dict = Depends(get_current_user)):
    """Reset password for authenticated user. Frontend: /auth/reset-password"""
    return reset_password_logic(request, current_user)


@router.post("/refresh")
async def refresh(request: Request):
    """Exchange refresh token for new access token. JSON body: { refresh_token: "..." }"""
    try:
        data = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")
    token = data.get("refresh_token") if isinstance(data, dict) else None
    if not token:
        raise HTTPException(status_code=400, detail="refresh_token required")
    return refresh_token_logic(token)


@router.post("/logout")
async def logout(request: Request):
    """Revoke access token (logout). Send Bearer token in Authorization header."""
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        raise HTTPException(status_code=400, detail="Bearer token required")
    token = auth[7:].strip()
    return logout_logic(token)
