# app/api/v1/routes/user.py

from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from app.schemas.auth import UserRegisterSchema, ResetPasswordRequest
from app.core.security import get_current_user
from app.services.auth import login_logic, reset_password_logic, generate_and_send_otp, verify_otp_service, register_user_logic

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login")
def login(request: OAuth2PasswordRequestForm = Depends()):
    return login_logic(request.username, request.password)


@router.post("/register")
def register_user(request: UserRegisterSchema):
    return register_user_logic(request)


@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, current_user: dict = Depends(get_current_user)):
    return reset_password_logic(request, current_user)

@router.post("/send-otp")
def send_otp(email: str):
    return generate_and_send_otp(email)

@router.post("/verify-otp")
def verify_otp(email: str, otp: str):
    return verify_otp_service(email, otp)

