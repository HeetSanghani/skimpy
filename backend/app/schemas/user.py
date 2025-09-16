
from pydantic import EmailStr, constr
from typing import Optional
from app.db.models.base import CustomBaseModel
from app.db.models.user import UserRole,Gender
from datetime import date

class CreateUser(CustomBaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: constr(regex=r"^\d{10}$")
    DOB: date
    role: UserRole = UserRole.user
    gender: Optional[Gender] = None
    photo: Optional[str] = None
    address: Optional[str] = None
    
