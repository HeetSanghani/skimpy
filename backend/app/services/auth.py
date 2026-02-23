from fastapi import HTTPException, BackgroundTasks
from app.db.mongodb import user_collection, otp_collection
from app.core.security import get_password_hash, verify_password, create_access_token
from app.schemas.auth import UserRegisterSchema, ResetPasswordRequest,VerifyForgotOtpRequest
from datetime import datetime, timedelta
import uuid, os, shutil, random
from app.services.n8n_sender import trigger_signup_notification, trigger_login_notification, trigger_otp_verified_notification, trigger_send_otp_notification

def login_logic(email: str, password: str, ip: str = None, device: str = None, background_tasks: BackgroundTasks = None):
    user = user_collection.find_one({"email": email})

    if not user or not verify_password(password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token = create_access_token(data={"sub": user["email"]})
    
    # Trigger n8n login notification
    # Inject runtime data into user dict for notification purpose (not saved to DB here)
    user_for_notify = user.copy() if user else {}
    user_for_notify["ip"] = ip
    user_for_notify["device"] = device
    user_for_notify["login_time"] = datetime.now().isoformat()
    
    if background_tasks:
        background_tasks.add_task(trigger_login_notification, user_for_notify)
    else:
        trigger_login_notification(user_for_notify)
    
    return {"access_token": access_token, "token_type": "bearer"}


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
        
        # Trigger n8n signup notification with metadata
        # Inject metadata into user_data for notification (it might not be in DB schema, but useful for webhook)
        user_data["ip"] = ip
        user_data["device"] = device
        
        if background_tasks:
            background_tasks.add_task(trigger_signup_notification, user_data)
        else:
            trigger_signup_notification(user_data)
        
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


def generate_and_send_otp(email: str, background_tasks: BackgroundTasks = None):
    try:
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

    # Call n8n synchronously so we only return success when email is actually sent
    sent = trigger_send_otp_notification(email, otp)
    if not sent:
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
    
    # Trigger n8n notification
    if background_tasks:
        background_tasks.add_task(trigger_otp_verified_notification, email)
    else:
        trigger_otp_verified_notification(email)

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
    
    # Trigger n8n notification for OTP verification
    if background_tasks:
        background_tasks.add_task(trigger_otp_verified_notification, request.email)
    else:
        trigger_otp_verified_notification(request.email)

    return {"message": "Password reset successfully"}