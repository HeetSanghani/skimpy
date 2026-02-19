
from pydantic import EmailStr, constr,BaseModel
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
    user_id: str
    first_name: str
    last_name: str
    email: EmailStr
    # Phone and DOB can be absent; validate only when provided
    phone: Optional[constr(regex=r"^\d{10}$")] = None
    DOB: Optional[date] = None
    gender: Optional[Gender] = None
    role: str
    shop_name: Optional[str] = ""
    shop_description: Optional[str] = ""
    avatar: Optional[str] = None
    has_delivery_address: bool = False
    
    
    
class AddAccountDetails(CustomBaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: constr(regex=r"^\d{10}$")
    DOB: Optional[date] = ""
    gender: Optional[Gender] = None
    shop_name: Optional[str] = None
    shop_description: Optional[str] = None


    
# ---------------- DELETE USER ---------------- #
class DeleteUserResponse(BaseModel):
    status: bool
    message: str
    
class AddDeliveryAddress(BaseModel):
    first_name: str
    last_name: str
    phone: constr(regex=r"^\d{10}$")
    street_address: str
    city: str
    postcode: int
    state: str
    country: str
class GetDeliveryAddress(AddDeliveryAddress):
    address_id: str
    pass
    