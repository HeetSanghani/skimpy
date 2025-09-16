
from pydantic import EmailStr, constr, BaseModel,  validator
from typing import Optional
from app.db.models.base import CustomBaseModel
from app.db.models.user import UserRole

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    user_id: str
    email : EmailStr

class UserRegisterSchema(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: constr(
        min_length=8,
        regex=r"^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*(),.?\":{}|<>]).*$"
    )
    confirm_password: str

    @validator("confirm_password")
    def passwords_match(cls, v, values):
        if "password" in values and v != values["password"]:
            raise ValueError("Passwords do not match")
        return v
    
class LoginUser(BaseModel):
    email:EmailStr
    password: constr(
        min_length=8,
        regex=r"^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*(),.?\":{}|<>]).*$"
    )


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: str | None = None
    
    
class ResetPasswordRequest(BaseModel):
    old_password: str
    password: constr(
        min_length=8,
        regex=r"^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*(),.?\":{}|<>]).*$"
    )
    confirm_password: str

    @validator("confirm_password")
    def passwords_match(cls, v, values):
        if "new_password" in values and v != values["new_password"]:
            raise ValueError("Passwords do not match")
        return v

