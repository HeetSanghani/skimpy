from fastapi import APIRouter, Depends, UploadFile, File, Query
from app.schemas.user import GetUserDetails, CreateUser, AddAccountDetails, AddDeliveryAddress, GetDeliveryAddress
from app.security.dependencies import get_current_user
from app.services.users import account_details_logic,get_account_details_logic,delete_user_logic, add_delivery_address_logic, update_delivery_address_logic,get_delivery_address_logic, delete_delivery_address_logic,add_profile_avatar_logic,delete_profile_avatar_logic,get_profile_avatar_logic
from typing import List


router = APIRouter(prefix="/user/settings", tags=["User"])

@router.get("/get-account-details", response_model=GetUserDetails,tags=["User account "])
async def get_account_details(current_user: dict = Depends(get_current_user)):
    return  get_account_details_logic(current_user)

@router.put("/account-details",tags=["User account "])
def account_details(request:AddAccountDetails, current_user: dict = Depends(get_current_user)):
    return account_details_logic(request, current_user)

# ---------------- DELETE USER ---------------- #
@router.delete("/delete-account",tags=["User account "])
def delete_user(current_user: dict = Depends(get_current_user)):
    return delete_user_logic(current_user)

# ---------------- Delivery Addresses ---------------- #
@router.get("/get-delivery-address", response_model=List[GetDeliveryAddress], tags=["Delivery Address"])
async def get_delivery_address(current_user: dict = Depends(get_current_user)):
    return  get_delivery_address_logic(current_user)

@router.post("/add-delivery-address", tags=["Delivery Address"])
def add_delivery_address(request: AddDeliveryAddress, current_user: dict = Depends(get_current_user)):
    return add_delivery_address_logic(request, current_user)

@router.put("/update-delivery-address", tags=["Delivery Address"])
def update_delivery_address(
    request: AddDeliveryAddress,
    current_user: dict = Depends(get_current_user),
    address_id: str = Query(..., alias="address_id"),
):
    return update_delivery_address_logic(address_id, request, current_user)


@router.delete("/delete-delivery-address", tags=["Delivery Address"])
def delete_delivery_address(address_id: str= Query(...), current_user: dict = Depends(get_current_user)):
    print(f"Received address_id: {address_id}")  # debug
    return delete_delivery_address_logic(address_id, current_user)

@router.get("/get-profile-avatar", tags=["Avatar"])
async def get_profile_avatar(current_user: dict = Depends(get_current_user)):
    return  get_profile_avatar_logic(current_user)

@router.put("/add-profile-avatar", tags=["Avatar"])
async def add_profile_avatar( avatar: UploadFile = File(...),current_user: dict = Depends(get_current_user),):
    return await add_profile_avatar_logic(avatar, current_user)

@router.delete("/delete-profile-avatar", tags=["Avatar"])
def delete_profile_avatar(current_user: dict = Depends(get_current_user)):
    return  delete_profile_avatar_logic(current_user)
