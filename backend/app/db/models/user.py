# app/db/models/user.py
from pydantic import EmailStr, constr
from typing import Optional
from datetime import datetime
from enum import Enum
from app.db.models.base import CustomBaseModel
from datetime import date

class UserRole(str, Enum):
    user = "user"
    seller = "seller"
class Gender(str, Enum):
    male = "male"
    female = "female"
    other = "other"

class CreateUser(CustomBaseModel):
    _id:str
    first_name: str
    last_name: str
    email: EmailStr
    password: constr(
        min_length=8,
        regex=r"^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*(),.?\":{}|<>]).*$"
    )
    phone: constr(regex=r"^\d{10}$")
    role: UserRole = UserRole.user
    user_id: str
    gender: Optional[Gender] = None
    photo: Optional[str] = None
    address: Optional[str] = None
    created_date: date
    updated_date: date
