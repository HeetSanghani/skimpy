import logging
from fastapi import HTTPException, BackgroundTasks
from app.db.mongodb import user_collection, otp_collection, login_attempts_collection
from app.core.security import get_password_hash, verify_password
from app.security.jwt_handler import create_access_token, create_refresh_token, verify_refresh_token, revoke_token
from app.core.config import settings
from app.schemas.auth import UserRegisterSchema, ResetPasswordRequest, VerifyForgotOtpRequest
from datetime import datetime, timedelta
import uuid, os, shutil, random
from app.utils.email_service import (
    send_otp_email,
    send_signup_welcome_email,
    send_login_alert_email,
    send_otp_verified_email,
)

logger = logging.getLogger(__name__)


def _check_account_locked(email: str) -> None:
    """Raise 429 if account is locked due to failed attempts."""
    rec = login_attempts_collection.find_one({"email": email})
    if not rec or not rec.get("locked_until"):
        return
    from datetime import datetime
    if datetime.utcnow() < rec["locked_until"]:
        mins = int((rec["locked_until"] - datetime.utcnow()).total_seconds() / 60)
        raise HTTPException(
            status_code=429,
            detail=f"Account temporarily locked. Try again in {mins} minutes.",
        )


def _record_failed_login(email: str) -> None:
    """Record failed attempt; lock account if threshold reached."""
    from datetime import datetime, timedelta
    rec = login_attempts_collection.find_one({"email": email})
    attempts = (rec.get("attempts") or 0) + 1
    update = {"attempts": attempts}
    if attempts >= settings.MAX_LOGIN_ATTEMPTS:
        update["locked_until"] = datetime.utcnow() + timedelta(minutes=settings.LOCKOUT_MINUTES)
    login_attempts_collection.update_one(
        {"email": email},
        {"$set": update, "$setOnInsert": {"email": email}},
        upsert=True,
    )


def _clear_login_attempts(email: str) -> None:
    """Clear failed attempts on successful login."""
    login_attempts_collection.delete_one({"email": email})


def login_logic(email: str, password: str, ip: str = None, device: str = None, background_tasks: BackgroundTasks = None):
    _check_account_locked(email)
    user = user_collection.find_one({"email": email})

    if not user or not verify_password(password, user["password"]):
        _record_failed_login(email)
        raise HTTPException(status_code=401, detail="Invalid email or password")

    _clear_login_attempts(email)
    role = (user.get("role") or "user").lower()
    user_id = user.get("user_id") or user.get("email", "")
    access_token = create_access_token(user_id=str(user_id), role=role)
    refresh_token = create_refresh_token(user_id=str(user_id), role=role)

    user_for_notify = user.copy() if user else {}
    user_for_notify["ip"] = ip
    user_for_notify["device"] = device
    user_for_notify["login_time"] = datetime.now().isoformat()

    if background_tasks:
        background_tasks.add_task(send_login_alert_email, user_for_notify)
    else:
        send_login_alert_email(user_for_notify)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "role": role,
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }


def user_login_logic(email: str, password: str, ip: str = None, device: str = None, background_tasks: BackgroundTasks = None):
    """Login for buyers (user role). Accepts user and seller roles (both can access user APIs)."""
    return login_logic(email, password, ip=ip, device=device, background_tasks=background_tasks)


def seller_login_logic(email: str, password: str, ip: str = None, device: str = None, background_tasks: BackgroundTasks = None):
    """Login for sellers. Only users with role 'seller' can use seller APIs."""
    _check_account_locked(email)
    user = user_collection.find_one({"email": email})
    if not user or not verify_password(password, user["password"]):
        _record_failed_login(email)
        raise HTTPException(status_code=401, detail="Invalid email or password")
    role = (user.get("role") or "").lower()
    if role != "seller":
        raise HTTPException(status_code=403, detail="Seller access required. Use user login for buyer access.")
    _clear_login_attempts(email)
    user_id = user.get("user_id") or user.get("email", "")
    access_token = create_access_token(user_id=str(user_id), role="seller")
    refresh_token = create_refresh_token(user_id=str(user_id), role="seller")
    user_for_notify = user.copy()
    user_for_notify["ip"] = ip
    user_for_notify["device"] = device
    user_for_notify["login_time"] = datetime.now().isoformat()
    if background_tasks:
        background_tasks.add_task(send_login_alert_email, user_for_notify)
    else:
        send_login_alert_email(user_for_notify)
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "role": "seller",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }


def admin_login_logic(email: str, password: str):
    """Login for superadmin. Credentials verified against ENV variables only."""
    admin_email = settings.ADMIN_EMAIL
    admin_password = settings.ADMIN_PASSWORD
    if not admin_email or not admin_password:
        raise HTTPException(status_code=503, detail="Admin login not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD.")
    if email != admin_email or password != admin_password:
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    access_token = create_access_token(user_id="admin", role="admin")
    refresh_token = create_refresh_token(user_id="admin", role="admin")
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "role": "admin",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }


def refresh_token_logic(refresh_token: str):
    """Exchange refresh token for new access token."""
    payload = verify_refresh_token(refresh_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    access_token = create_access_token(
        user_id=str(payload["user_id"]),
        role=payload["role"],
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": payload["role"],
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }


def logout_logic(token: str):
    """Revoke access token (logout)."""
    revoke_token(token)
    return {"message": "Logged out successfully"}


def register_user_logic(request: UserRegisterSchema, ip: str = None, device: str = None, background_tasks: BackgroundTasks = None):
    user_data = request.dict()
    user_data.pop("confirm_password")

    # Check OTP verification first
    otp_record = otp_collection.find_one({"email": user_data["email"], "verified": True})
    if not otp_record:
        raise HTTPException(status_code=400, detail="Please verify OTP before registering")

    # Create user
    user_data["user_id"] = str(uuid.uuid4())
    user_data["password"] = get_password_hash(user_data["password"])
    user_data["created_date"] = datetime.now()
    user_data["verified"] = True   # mark as verified directly

    try:
        user_collection.insert_one(user_data)
        otp_collection.delete_one({"email": user_data["email"]})  # cleanup OTP
        
        user_data["ip"] = ip
        user_data["device"] = device

        if background_tasks:
            background_tasks.add_task(send_signup_welcome_email, user_data)
        else:
            send_signup_welcome_email(user_data)
        
        return {
            "message": f"User {request.first_name} created successfully",
            "user_id": user_data["user_id"],
        }
    except Exception as e:
        if "email" in str(e):
            raise HTTPException(status_code=400, detail="Email already registered")
        else:
            raise HTTPException(status_code=400, detail="User creation failed")




def reset_password_logic(request: ResetPasswordRequest, current_user: dict):
    user_id = str(current_user["user_id"])

    # Old password verification
    if not verify_password(request.old_password, current_user["password"]):
        raise HTTPException(status_code=401, detail="Old password is incorrect")

    # Hash new password
    new_hashed_password = get_password_hash(request.password)

    # Update in DB
    result = user_collection.update_one(
        {"user_id": user_id},
        {"$set": {"password": new_hashed_password, "updated_date": datetime.now()}}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Password not updated")

    return {"message": "Password updated successfully"}


def _delete_expired_otps():
    """Remove all OTPs that have already expired (keeps MongoDB clean)."""
    try:
        result = otp_collection.delete_many({"expires_at": {"$lt": datetime.now()}})
        if result.deleted_count:
            logger.info("Cleaned up %d expired OTP(s)", result.deleted_count)
    except Exception as e:
        logger.warning("Expired OTP cleanup failed: %s", e)


def generate_and_send_otp(email: str, background_tasks: BackgroundTasks = None):
    try:
        _delete_expired_otps()
        otp_collection.delete_many({"email": email})

        otp = str(random.randint(100000, 999999))
        otp_data = {
            "email": email,
            "otp": otp,
            "expires_at": datetime.now() + timedelta(minutes=5),
            "verified": False
        }
        otp_collection.insert_one(otp_data)
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail="Service temporarily unavailable. Please try again in a moment."
        )

    try:
        send_otp_email(email, otp)
    except ValueError as e:
        logger.warning("OTP email not configured: %s", e)
        raise HTTPException(
            status_code=503,
            detail="OTP service unavailable. Set sender_email and sender_password on the backend."
        )
    except Exception as e:
        logger.exception("OTP email failed: %s", e)
        raise HTTPException(
            status_code=503,
            detail="OTP service temporarily unavailable. Please try again in a moment."
        )

    return {"message": "New OTP sent to your email"}




def verify_otp_service(email: str, otp: str, background_tasks: BackgroundTasks = None):
    record = otp_collection.find_one({"email": email})

    if not record:
        return {"success": False, "message": "OTP expired or not found"}

    if record["otp"] != otp:
        return {"success": False, "message": "Invalid OTP"}
    
    if record:
        # Check expiry
        if record["expires_at"] < datetime.now():
            otp_collection.delete_one({"email": email})
            return {"success": False, "message": "OTP expired"}
    

    # ✅ Mark OTP as verified
    otp_collection.update_one(
        {"email": email},
        {"$set": {"verified": True}}
    )
    
    if background_tasks:
        background_tasks.add_task(send_otp_verified_email, email)
    else:
        send_otp_verified_email(email)

    return {"success": True, "message": "OTP verified"}


# ---------------- VERIFY FORGOT PASSWORD OTP ---------------- #
def verify_forgot_otp_logic(request: VerifyForgotOtpRequest, background_tasks: BackgroundTasks = None):
    user = user_collection.find_one({"email": request.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    otp_record = otp_collection.find_one({"email": request.email})
    if not otp_record:
        raise HTTPException(status_code=400, detail="No OTP found. Request again.")

    if otp_record["otp"] != request.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    if datetime.now() > otp_record["expires_at"]:
        raise HTTPException(status_code=400, detail="OTP expired")

    new_hashed_password = get_password_hash(request.new_password)
    user_collection.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"password": new_hashed_password, "updated_date": datetime.now()}}
    )

    otp_collection.delete_one({"email": request.email})
    
    if background_tasks:
        background_tasks.add_task(send_otp_verified_email, request.email)
    else:
        send_otp_verified_email(request.email)

    return {"message": "Password reset successfully"}