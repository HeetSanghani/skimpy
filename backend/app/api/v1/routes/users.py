from fastapi import APIRouter, Depends
from app.schemas.user import CreateUser
from app.core.security import get_current_user
from app.services.users import update_user_profile_logic

router = APIRouter()

@router.put("/user/profile", tags=["User Profile"])
def update_user_profile(request: CreateUser, current_user: dict = Depends(get_current_user)):
    return update_user_profile_logic(request, current_user)
