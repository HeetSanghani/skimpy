from fastapi import HTTPException
from app.db.mongodb import user_collection, otp_collection
from app.core.security import get_password_hash, verify_password, create_access_token
from app.schemas.auth import UserRegisterSchema, ResetPasswordRequest,VerifyForgotOtpRequest
from datetime import datetime, timedelta
import uuid, os, shutil, random
from app.utils.email_service import send_otp_email

def login_logic(email: str, password: str):
    user = user_collection.find_one({"email": email})

    if not user or not verify_password(password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token = create_access_token(data={"sub": user["email"]})
    return {"access_token": access_token, "token_type": "bearer"}


def register_user_logic(request: UserRegisterSchema):
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


def generate_and_send_otp(email: str):
    existing_otp = otp_collection.find_one({"email": email})

    if existing_otp:
        # Check expiry
        if existing_otp["expires_at"] > datetime.now():
            otp_collection.delete_one({"email": email})

    # Create new OTP
    otp = str(random.randint(100000, 999999))
    otp_data = {
        "email": email,
        "otp": otp,
        "expires_at": datetime.now() + timedelta(minutes=5),
        "verified": False
    }

    otp_collection.insert_one(otp_data)
    send_otp_email(email, otp)

    return {"message": "New OTP sent to your email"}




def verify_otp_service(email: str, otp: str):
    record = otp_collection.find_one({"email": email})

    if not record:
        return {"success": False, "message": "OTP expired or not found"}

    if record["otp"] != otp:
        return {"success": False, "message": "Invalid OTP"}
    
    existing_otp = otp_collection.find_one({"email": email})

    if existing_otp:
        # Check expiry
        if existing_otp["expires_at"] < datetime.now():
            otp_collection.delete_one({"email": email})
            return {"invalid otp"}
    

    # ✅ Mark OTP as verified
    otp_collection.update_one(
        {"email": email},
        {"$set": {"verified": True}}
    )

    return {"success": True, "message": "OTP verified"}


# ---------------- VERIFY FORGOT PASSWORD OTP ---------------- #
def verify_forgot_otp_logic(request: VerifyForgotOtpRequest):
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

    return {"message": "Password reset successfully"}



# ---------------- DELETE USER ---------------- #
def delete_user_logic(current_user: dict):
    user_id = current_user["user_id"]

    # 1. Find user
    user = user_collection.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 2. Delete OTPs related to this user
    otp_collection.delete_many({"email": user["email"]})

    # 3. Delete user record
    user_collection.delete_one({"user_id": user_id})

    # 4. Delete user files (local storage cleanup)
    user_folder = os.path.join("uploads", str(user_id))
    if os.path.exists(user_folder):
        shutil.rmtree(user_folder)

    return {"status": True, "message": "User and all related data deleted"}