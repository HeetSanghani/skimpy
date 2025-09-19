from fastapi import APIRouter, Depends,UploadFile,File
from app.schemas.user import GetUserDetails, CreateUser
from app.core.security import get_current_user
from app.services.users import update_user_profile_logic,get_profile_logic

router = APIRouter()

@router.put("/user/profile", tags=["User Profile"])
async def update_user_profile(
    request: CreateUser = Depends(CreateUser.as_form),
    photo: UploadFile = File(None),
    current_user: dict = Depends(get_current_user)
):
    return await update_user_profile_logic(request, photo, current_user)

@router.get("/user/getprofile", response_model=GetUserDetails)
async def get_profile(current_user: dict = Depends(get_current_user)):
    return  get_profile_logic(current_user)