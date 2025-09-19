# app/api/v1/routes/user.py

from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from app.schemas.auth import UserRegisterSchema, ResetPasswordRequest, EmailModel, VerifyOtpModel, VerifyForgotOtpRequest
from app.core.security import get_current_user
from app.services.auth import login_logic, reset_password_logic, generate_and_send_otp, verify_otp_service, register_user_logic,delete_user_logic,verify_forgot_otp_logic

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
def send_otp(request: EmailModel):
    return generate_and_send_otp(request.email)

@router.post("/verify-otp")
def verify_otp(request: VerifyOtpModel):
    return verify_otp_service(request.email, request.otp)

# ---------------- VERIFY FORGOT PASSWORD OTP ---------------- #
@router.post("/verify-forgot-otp")
def verify_forgot_otp(request: VerifyForgotOtpRequest):
    return verify_forgot_otp_logic(request)

# ---------------- DELETE USER ---------------- #
@router.delete("/delete-account")
def delete_user(current_user: dict = Depends(get_current_user)):
    return delete_user_logic(current_user)