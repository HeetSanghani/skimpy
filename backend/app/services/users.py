# app/services/user_service.py

from datetime import datetime,date
from fastapi import HTTPException
from pymongo.errors import DuplicateKeyError
from app.db.mongodb import user_collection
from app.core.security import get_password_hash
from app.schemas.user import CreateUser,GetUserDetails
from fastapi import Depends,UploadFile,File
from app.db.models.user import UserRole
import os
from dotenv import load_dotenv
load_dotenv()
import requests

IMGBB_API_KEY = os.getenv("IMGBB_API_KEY")


async def update_user_profile_logic(
    request: CreateUser = Depends(CreateUser.as_form),
    photo: UploadFile = File(None),
    current_user: dict = Depends(...)
):
    user_id = str(current_user["user_id"])
    user_data = request.dict()
    user_data["updated_date"] = datetime.now()

    if isinstance(user_data.get("DOB"), date):
        user_data["DOB"] = datetime.combine(user_data["DOB"], datetime.min.time())

    # validate and upload photo
    if photo:
        if photo.content_type not in {"image/jpeg", "image/png"}:
            raise HTTPException(status_code=400, detail="Only jpg, jpeg, png allowed")
        file_bytes = await photo.read()
        response = requests.post(
            "https://api.imgbb.com/1/upload",
            params={"key": IMGBB_API_KEY},
            files={"image": file_bytes},
        )
        if response.status_code == 200:
            image_url = response.json()["data"]["url"]
            user_data["photo"] = image_url
        else:
            raise HTTPException(status_code=500, detail="Photo upload failed")

    result = user_collection.update_one({"user_id": user_id}, {"$set": user_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "message": f"User {request.first_name} updated successfully",
        "user_id": user_id,
        "photo_url": user_data.get("photo"),
    }
    
    
def get_profile_logic(current_user: dict):
    email = current_user["email"]

    user = user_collection.find_one({"email": email})

    if not user:
        # If no user found, return empty profile
        return GetUserDetails()

    profile = GetUserDetails(
        first_name=user.get("first_name", ""),
        last_name=user.get("last_name", ""),
        email=user.get("email", ""),
        phone=user.get("phone", ""),
        role=user.get("role", UserRole.user),
        gender=user.get("gender"),
        photo=user.get("photo", ""),
        address=user.get("address", ""),
        DOB=user.get("DOB", "") 

    )

    return profile