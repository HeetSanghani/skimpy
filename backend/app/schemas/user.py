
from pydantic import EmailStr, constr
from typing import Optional
from app.db.models.base import CustomBaseModel
from app.db.models.user import UserRole,Gender
from datetime import date
from fastapi import Form

class CreateUser(CustomBaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: constr(regex=r"^\d{10}$")
    DOB: Optional[date] = ""
    role: UserRole = UserRole.user
    gender: Optional[Gender] = None
    address: Optional[str] = None
    
    
    @classmethod
    def as_form(
        cls,
        first_name: str = Form(...),
        last_name: str = Form(...),
        email: EmailStr = Form(...),
        phone: str = Form(...),
        DOB: Optional[date] = Form(...),
        role: UserRole = Form(UserRole.user),
        gender: Optional[Gender] = Form(None),
        address: Optional[str] = Form(None),
    ):
        return cls(
            first_name=first_name,
            last_name=last_name,
            email=email,
            phone=phone,
            DOB=DOB,
            role=role,
            gender=gender,
            address=address,
        )
        
class GetUserDetails(CustomBaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: constr(regex=r"^\d{10}$")
    DOB: Optional[date] = ""
    role: UserRole = UserRole.user
    gender: Optional[Gender] = None
    address: Optional[str] = None
    photo: Optional[str] = ""