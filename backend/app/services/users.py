# app/services/user_service.py

from datetime import datetime
from fastapi import HTTPException
from pymongo.errors import DuplicateKeyError
from app.db.mongodb import user_collection
from app.core.security import get_password_hash
from app.schemas.user import CreateUser


def update_user_profile_logic(request: CreateUser, current_user: dict):
    user_id = str(current_user["user_id"])  

    user_data = request.dict()

    # Hash password
    user_data["password"] = get_password_hash(user_data["password"])
    user_data["updated_date"] = datetime.utcnow()

    try:
        result = user_collection.update_one(
            {"user_id": user_id},   # Filter
            {"$set": user_data}     # Update fields
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")

        return {
            "message": f"User {request.first_name} updated successfully",
            "user_id": user_id
        }

    except DuplicateKeyError as e:
        if "email" in str(e):
            raise HTTPException(status_code=400, detail="Email already registered")
        else:
            raise HTTPException(status_code=400, detail="Duplicate data")
