# app/services/user_service.py

from datetime import datetime,date
from fastapi import HTTPException
from app.db.mongodb import user_collection, delivery_addresses_collection
from app.schemas.user import GetUserDetails
import os, uuid
from dotenv import load_dotenv
load_dotenv()
import requests, shutil
from app.db.mongodb import user_collection, otp_collection
from bson import ObjectId
from pymongo.errors import PyMongoError



IMGBB_API_KEY = os.getenv("IMGBB_API_KEY")
    
def get_account_details_logic(current_user: dict):
    email = current_user["email"]

    user = user_collection.find_one({"email": email})

    if not user:
        # If no user found, return empty profile with required fields blank
        return GetUserDetails(
            first_name="",
            last_name="",
            email=current_user.get("email", "")
        )

    # Normalize optional fields so validation doesn't fail
    raw_phone = user.get("phone")
    phone = raw_phone if isinstance(raw_phone, str) and raw_phone.strip() else None

    raw_dob = user.get("DOB")
    if isinstance(raw_dob, datetime):
        DOB = raw_dob.date()
    elif isinstance(raw_dob, date):
        DOB = raw_dob
    else:
        # treat empty string or invalid formats as None for response
        DOB = None

    profile = GetUserDetails(
        first_name=user.get("first_name", ""),
        last_name=user.get("last_name", ""),
        email=user.get("email", ""),
        phone=phone,
        gender=user.get("gender"),
        DOB=DOB,
        role = user.get("role","")
    )

    return profile


def account_details_logic(request, current_user):
    
    user_id = str(current_user["user_id"])
    user_data = request.dict()
    user_data["updated_date"] = datetime.now()

    if isinstance(user_data.get("DOB"), date):
        user_data["DOB"] = datetime.combine(user_data["DOB"], datetime.min.time())
        
    result = user_collection.update_one({"user_id": user_id}, {"$set": user_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "message": f"User {request.first_name} updated successfully",
        "user_id": user_id,
    }
    
# ---------------- DELETE USER ---------------- #
def delete_user_logic(current_user: dict):
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid user data")

    # 1. Find user
    user = user_collection.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    email = user.get("email")

    try:
        # 2. Delete OTPs related to this user
        otp_collection.delete_many({"email": email})

        # 3. Delete delivery addresses related to this user
        delivery_addresses_collection.delete_many({"user_id": user_id})

        # 4. Delete user record
        user_collection.delete_one({"user_id": user_id})

        # 5. Delete user files (local storage cleanup)
        user_folder = os.path.join("uploads", str(user_id))
        if os.path.exists(user_folder):
            shutil.rmtree(user_folder)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete user data: {str(e)}")

    return {"status": True, "message": "User, avatar, addresses, OTPs, and all related data deleted successfully"}


def add_delivery_address_logic(request, current_user):
    try:
        # Get user_id from token/session
        user_id = current_user.get("user_id")
        if not user_id:
            raise ValueError("Invalid user data")

        user_data = request.dict()
        user_data["user_id"] = user_id  # foreign key reference

        # Generate unique custom address id
        address_id = f"ADDR-{uuid.uuid4().hex[:8].upper()}"
        user_data["address_id"] = address_id  

        result = delivery_addresses_collection.insert_one(user_data)

        return {
            "status": "success",
            "address_id": address_id,
            "message": "Delivery address added successfully"
        }

    except ValueError as ve:
        return {"status": "error", "message": str(ve)}
    except PyMongoError as pe:
        return {"status": "error", "message": f"Database error: {str(pe)}"}
    except Exception as e:
        return {"status": "error", "message": f"Unexpected error: {str(e)}"}



def update_delivery_address_logic(address_id, request, current_user):
    try:
        user_id = current_user.get("user_id")
        if not user_id:
            raise HTTPException(status_code=400, detail="Invalid user data")

        # Prepare updated data
        updated_data = request.dict()
        updated_data["user_id"] = user_id  # ensure only owner can update

        # Update the address using custom address_id
        result = delivery_addresses_collection.update_one(
            {"address_id": address_id, "user_id": user_id},  # filter by custom id & user
            {"$set": updated_data}
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Address not found or not owned by user")

        # Fetch updated document
        updated_address = delivery_addresses_collection.find_one(
            {"address_id": address_id, "user_id": user_id}
        )

        # Convert ObjectId to string for response
        updated_address["_id"] = str(updated_address["_id"])

        return {
            "status": "success",
            "message": "Delivery address updated successfully",
            "address_id": updated_address["address_id"],  # return custom id
        }

    except PyMongoError as pe:
        raise HTTPException(status_code=500, detail=f"Database error: {str(pe)}")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

    
def get_delivery_address_logic(current_user):
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid user data")

    try:
        # Find all addresses belonging to this user
        addresses =list(delivery_addresses_collection.find({"user_id": user_id}))

        return addresses

    except PyMongoError as pe:
        raise HTTPException(status_code=500, detail=f"Database error: {str(pe)}")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")
    
    
def delete_delivery_address_logic(address_id, current_user):
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid user data")

    try:
        # Ensure only the user's own address is deleted using custom address_id
        result = delivery_addresses_collection.delete_one({
            "address_id": address_id,  # use custom address_id
            "user_id": user_id
        })

        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Address not found or not owned by user")

        return {"status": "success", "message": "Address deleted successfully"}

    except PyMongoError as pe:
        raise HTTPException(status_code=500, detail=f"Database error: {str(pe)}")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

    
    
async def add_profile_avatar_logic(avatar,current_user):
    user_id = current_user["user_id"]
    
    # find user data
    user = user_collection.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")


    # Validate file type
    if avatar.content_type not in {"image/jpeg", "image/jpg", "image/png"}:
        raise HTTPException(status_code=400, detail="Only jpg, jpeg, png allowed")

    # Read file bytes
    file_bytes = await avatar.read()

    # Upload to imgbb
    response = requests.post(
        "https://api.imgbb.com/1/upload",
        params={"key": IMGBB_API_KEY},
        files={"image": file_bytes},
    )

    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="avatar upload failed")

    if response.status_code == 200:
        data = response.json()["data"]

        image_url = data["url"]
        delete_url = data["delete_url"]

        result = user_collection.update_one(
            {"user_id": user_id},
            {"$set": {
                "avatar": image_url,
                "avatar_delete_url": delete_url  # 👈 store this too
            }}
        )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "message": "avatar uploaded successfully",
        "user_id": user_id,
        "avatar_url": image_url,
    }
    
    
def delete_profile_avatar_logic(current_user):
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid user data")

    user = user_collection.find_one({"user_id": user_id}, {"avatar_delete_url": 1})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.get("avatar_delete_url"):
        try:
            delete_resp = requests.delete(user["avatar_delete_url"])
            if delete_resp.status_code == 200:
                print("✅ Old avatar deleted from ImgBB")
            else:
                print(f"⚠️ Failed to delete old avatar. Status: {delete_resp.status_code}")
        except Exception as e:
            print(f"⚠️ Warning: could not delete avatar from ImgBB: {e}")

    user_collection.update_one(
        {"user_id": user_id},
        {"$unset": {"avatar": "", "avatar_delete_url": ""}}
    )

    # Remove avatar fields from database
    user_collection.update_one(
        {"user_id": user_id},
        {"$unset": {"avatar": "", "avatar_delete_url": ""}}
    )

    return {"status": "success", "message": "Profile avatar deleted successfully"}


def get_profile_avatar_logic(current_user):
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid user data")

    # Fetch only the photo field
    user = user_collection.find_one({"user_id": user_id}, {"avatar": 1, "_id": 0})

    avatar_url = user.get("avatar")
    if not avatar_url:
        return {"status": "success", "avatar_url": None, "message": "No profile avatar uploaded"}

    return {"status": "success", "avatar_url": avatar_url}